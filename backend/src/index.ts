import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { config, logApiStatus } from './config/env.js';
import { createApiRouter } from './routes/api.routes.js';
import { ScoringService } from './services/scoring.service.js';
import { WeatherService } from './services/weather.service.js';
import { EventsService } from './services/events.service.js';
import { FlightsService } from './services/flights.service.js';
import { TrafficService } from './services/traffic.service.js';
import { RoutingService } from './services/routing.service.js';
import { SurgeService } from './services/surge.service.js';
import { EventAlertsService } from './services/eventAlerts.service.js';
import { DriverPulseService } from './services/driverPulse.service.js';
import type { WeatherConditions, Event, FlightArrival, ZoneScoreFactors } from './types/index.js';
import {
  weatherCache,
  eventsCache,
  flightsCache,
  trafficCache,
  getCached,
} from './middleware/cache.middleware.js';
import { errorHandler, ErrorFactory, asyncHandler } from './lib/errors.js';
import { rateLimitMiddleware } from './middleware/rateLimit.middleware.js';

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: ['http://localhost:3000', 'http://localhost:5173'],
    methods: ['GET', 'POST'],
  },
});

// Middleware
app.use(cors());
app.use(express.json());

// Initialize services
const weatherService = new WeatherService(config.apis.weather.key);
const eventsService = new EventsService(config.apis.ticketmaster.key);
const flightsService = new FlightsService(config.apis.flights.key);
const trafficService = new TrafficService(config.apis.traffic.key);
const routingService = new RoutingService(config.apis.traffic.key); // TomTom key same as traffic
const scoringService = new ScoringService();
const surgeService = new SurgeService();
const eventAlertsService = new EventAlertsService();
const driverPulseService = new DriverPulseService();

// Routes
app.use('/api', createApiRouter(
  weatherService,
  eventsService,
  flightsService,
  trafficService,
  scoringService,
  routingService,
  eventAlertsService,
  driverPulseService
));

// Error handling middleware (must be after all routes)
app.use(errorHandler);

// Root endpoint
app.get('/', (_req: express.Request, res: express.Response) => {
  res.json({
    name: 'Seattle Uber Driver Optimizer API',
    version: '4.2.5',
    features: [
      'Real-time WebSocket updates',
      'Surge detection',
      'Micro-zones (granular Seattle scoring)',
      'Money-makers intelligence (ferries, hotel checkout, hospitals, UW bursts)',
      'Driver Pulse (crowdsourced ground truth)',
      'Trip chain recommendations',
    ],
    endpoints: {
      zones: '/api/zones',
      zone: '/api/zones/:id',
      forecast: '/api/forecast',
      conditions: '/api/conditions',
      health: '/api/health',
    },
  });
});

// WebSocket connection handling with rate limiting
io.on('connection', (socket) => {
  console.log(`🔌 Client connected: ${socket.id}`);

  // Rate limiting for WebSocket messages
  const messageCounts = new Map<string, number>();
  const resetTime = Date.now() + 60000; // 1 minute window

  socket.on('disconnect', () => {
    console.log(`🔌 Client disconnected: ${socket.id}`);
    messageCounts.delete(socket.id);
  });

  // Rate limit check for incoming messages
  const checkRateLimit = (): boolean => {
    const now = Date.now();
    if (now > resetTime) {
      // Reset window
      messageCounts.clear();
      return true;
    }

    const count = messageCounts.get(socket.id) || 0;
    if (count >= 300) { // 300 messages per minute per connection
      socket.emit('error', {
        type: 'RATE_LIMITED',
        message: 'Too many messages, please slow down.',
        retryAfter: Math.ceil((resetTime - now) / 1000),
      });
      return false;
    }

    messageCounts.set(socket.id, count + 1);
    return true;
  };

  // Apply rate limiting to all message handlers
  const originalOn = socket.on;
  socket.on = function(event: string, listener: (...args: any[]) => void) {
    if (event !== 'disconnect' && event !== 'error') {
      return originalOn.call(this, event, (...args: any[]) => {
        if (checkRateLimit()) {
          listener(...args);
        }
      });
    }
    return originalOn.call(this, event, listener);
  };
});

// Real-time score broadcast (every 30 seconds)
async function broadcastScores() {
  try {
    // Get cached or fresh data with proper types
    const weather = getCached<WeatherConditions>(weatherCache, 'weather') || await weatherService.getCurrentWeather();
    const events = getCached<Event[]>(eventsCache, 'events') || await eventsService.getUpcomingEvents();
    const flights = getCached<FlightArrival[]>(flightsCache, 'flights') || await flightsService.getArrivals();
    const traffic = getCached<Map<string, number>>(trafficCache, 'traffic') || await trafficService.getCongestionData();

    // Calculate scores
    const currentTime = new Date();
    const zoneScores = scoringService.calculateZoneScores(
      currentTime,
      events,
      weather,
      flights,
      traffic
    );

    // Apply real-time Driver Pulse modifiers (crowdsourced ground truth)
    const zonesWithPulses = zoneScores
      .map((z) => {
        const pulse = driverPulseService.getScoreModifier(z.id);
        const score = Math.min(100, Math.max(0, z.score + pulse));
        return {
          ...z,
          score,
          factors: {
            ...z.factors,
            pulse,
          },
        };
      })
      .sort((a, b) => b.score - a.score);

    const topPick = scoringService.determineTopPick(zonesWithPulses as any, events, flights);

    const data = {
      timestamp: currentTime.toISOString(),
      topPick,
      zones: zonesWithPulses,
    };

    // Detect surges
    const surges = surgeService.detectSurges(zonesWithPulses as any);

    // Broadcast to all connected clients
    io.emit('scores:update', data);

    if (surges.length > 0) {
      io.emit('surge:alert', surges);
      console.log(`🔥 Surge detected in ${surges.length} zone(s):`, surges.map(s => s.zoneName).join(', '));
    }
  } catch (error) {
    console.error('Error broadcasting scores:', error);
    // Log the error but don't crash the server
    // In production, you might want to send this to a monitoring service
  }
}

// Start broadcasting
const broadcastInterval = setInterval(broadcastScores, 30000); // Every 30 seconds

// Cleanup on shutdown
process.on('SIGTERM', () => {
  clearInterval(broadcastInterval);
  httpServer.close();
});

// Start server
httpServer.listen(config.port, () => {
  console.log(`🚗 Seattle Driver Optimizer API v4.2.3`);
  console.log(`📍 HTTP: http://localhost:${config.port}`);
  console.log(`⚡ WebSocket: ws://localhost:${config.port}`);
  console.log(`🏥 Health: http://localhost:${config.port}/api/health`);
  
  logApiStatus();
  
  console.log('\n⚡ Real-time updates: Broadcasting every 30 seconds');
  console.log('🔥 Surge detection: Active (threshold: 20 points)\n');
  
  // Do initial broadcast
  setTimeout(broadcastScores, 5000);
});

