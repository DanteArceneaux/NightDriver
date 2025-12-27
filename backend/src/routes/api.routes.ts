import { Router, Request, Response } from 'express';
import { ScoringService } from '../services/scoring.service.js';
import { WeatherService } from '../services/weather.service.js';
import { EventsService } from '../services/events.service.js';
import { FlightsService } from '../services/flights.service.js';
import { TrafficService } from '../services/traffic.service.js';
import { RoutingService } from '../services/routing.service.js';
import { EventAlertsService } from '../services/eventAlerts.service.js';
import { DriverPulseService } from '../services/driverPulse.service.js';
import { zones as legacyZones } from '../data/zones.js';
import { microZones } from '../data/microZones.js';
import type { WeatherConditions, Event, FlightArrival } from '../types/index.js';
import {
  weatherCache,
  eventsCache,
  flightsCache,
  trafficCache,
  scoresCache,
  getCached,
  setCache,
} from '../middleware/cache.middleware.js';

export function createApiRouter(
  weatherService: WeatherService,
  eventsService: EventsService,
  flightsService: FlightsService,
  trafficService: TrafficService,
  scoringService: ScoringService,
  routingService: RoutingService,
  eventAlertsService: EventAlertsService,
  driverPulseService: DriverPulseService
): Router {
  const router = Router();

  // GET /api/status - Get API status for each data source
  router.get('/status', async (_req: Request, res: Response) => {
    try {
      const status = {
        timestamp: new Date().toISOString(),
        sources: {
          weather: {
            enabled: !!weatherService,
            source: process.env.OPENWEATHER_API_KEY ? 'real' : 'mock',
            provider: process.env.OPENWEATHER_API_KEY ? 'OpenWeatherMap' : 'Mock',
            cached: !!getCached(weatherCache, 'weather'),
          },
          events: {
            enabled: !!eventsService,
            source: process.env.TICKETMASTER_API_KEY ? 'real' : 'mock',
            provider: (() => {
              const tm = process.env.TICKETMASTER_API_KEY;
              const sg = process.env.SEATGEEK_CLIENT_ID;
              if (tm && sg) return 'Ticketmaster + SeatGeek';
              if (tm) return 'Ticketmaster';
              if (sg) return 'SeatGeek';
              return 'Mock';
            })(),
            cached: !!getCached(eventsCache, 'events'),
          },
          flights: {
            enabled: !!flightsService,
            source: process.env.AVIATIONSTACK_API_KEY ? 'real' : 'mock',
            provider: process.env.AVIATIONSTACK_API_KEY ? 'AviationStack' : 'Mock',
            cached: !!getCached(flightsCache, 'flights'),
          },
          traffic: {
            enabled: !!trafficService,
            source: process.env.TOMTOM_API_KEY ? 'real' : 'mock',
            provider: process.env.TOMTOM_API_KEY ? 'TomTom' : 'Mock',
            cached: !!getCached(trafficCache, 'traffic'),
          },
        },
      };

      res.json(status);
    } catch (error) {
      console.error('Error in /status:', error);
      res.status(500).json({ error: 'Failed to get status' });
    }
  });

  // GET /api/zones - Get all zones with current scores
  router.get('/zones', async (_req: Request, res: Response) => {
    try {
      // Check cache first
      const cached = getCached(scoresCache, 'zones');
      if (cached) {
        return res.json(cached);
      }

      // Gather all data
      const [weather, events, flights, traffic] = await Promise.all([
        getWeatherData(weatherService),
        getEventsData(eventsService),
        getFlightsData(flightsService),
        getTrafficData(trafficService),
      ]);

      // Calculate scores
      const currentTime = new Date();
      const zoneScores = scoringService.calculateZoneScores(
        currentTime,
        events,
        weather,
        flights,
        traffic
      );

      const topPick = scoringService.determineTopPick(zoneScores, events, flights);

      const response = {
        timestamp: currentTime.toISOString(),
        topPick,
        zones: zoneScores,
      };

      // Cache the response
      setCache(scoresCache, 'zones', response);

      res.json(response);
    } catch (error) {
      console.error('Error in /zones:', error);
      res.status(500).json({ error: 'Failed to calculate zone scores' });
    }
  });

  // GET /api/zones/:id - Get single zone details
  router.get('/zones/:id', async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const zone = getZoneMetaById(id);

      if (!zone) {
        return res.status(404).json({ error: 'Zone not found' });
      }

      // Get full zone data from the zones endpoint
      const cached = getCached(scoresCache, 'zones');
      let zonesData: any;

      if (cached) {
        zonesData = cached;
      } else {
        // Recalculate if not cached
        const [weather, events, flights, traffic] = await Promise.all([
          getWeatherData(weatherService),
          getEventsData(eventsService),
          getFlightsData(flightsService),
          getTrafficData(trafficService),
        ]);

        const currentTime = new Date();
        const zoneScores = scoringService.calculateZoneScores(
          currentTime,
          events,
          weather,
          flights,
          traffic
        );

        const topPick = scoringService.determineTopPick(zoneScores, events, flights);

        zonesData = {
          timestamp: currentTime.toISOString(),
          topPick,
          zones: zoneScores,
        };

        setCache(scoresCache, 'zones', zonesData);
      }

      const zoneScore = zonesData.zones.find((z: any) => z.id === id);

      if (!zoneScore) {
        return res.status(404).json({ error: 'Zone score not found' });
      }

      res.json({
        ...zone,
        score: zoneScore.score,
        trend: zoneScore.trend,
        factors: zoneScore.factors,
      });
    } catch (error) {
      console.error('Error in /zones/:id:', error);
      res.status(500).json({ error: 'Failed to get zone details' });
    }
  });

  // GET /api/forecast - Get 4-hour forecast
  router.get('/forecast', async (_req: Request, res: Response) => {
    try {
      const forecast = scoringService.generateForecast(4);

      res.json({
        points: forecast,
      });
    } catch (error) {
      console.error('Error in /forecast:', error);
      res.status(500).json({ error: 'Failed to generate forecast' });
    }
  });

  // GET /api/conditions - Get current conditions
  router.get('/conditions', async (_req: Request, res: Response) => {
    try {
      const [weather, events, flights] = await Promise.all([
        getWeatherData(weatherService),
        getEventsData(eventsService),
        getFlightsData(flightsService),
      ]);

      res.json({
        weather,
        events: events.slice(0, 5), // Top 5 events
        flights: flights.slice(0, 10), // Top 10 flights
        lastUpdated: new Date().toISOString(),
      });
    } catch (error) {
      console.error('Error in /conditions:', error);
      res.status(500).json({ error: 'Failed to get conditions' });
    }
  });

  // GET /api/event-alerts - Get smart event alerts (Doors Open, Encore)
  router.get('/event-alerts', async (req: Request, res: Response) => {
    try {
      const { alertMinutes } = req.query;
      const minutes = alertMinutes ? parseInt(alertMinutes as string) : 60;
      
      const events = await getEventsData(eventsService);
      const currentTime = new Date();
      const alerts = eventAlertsService.detectEventAlerts(events, currentTime, minutes);

      res.json({
        alerts,
        timestamp: currentTime.toISOString(),
      });
    } catch (error) {
      console.error('Error in /event-alerts:', error);
      res.status(500).json({ error: 'Failed to get event alerts' });
    }
  });

  // GET /api/health - Health check
  router.get('/health', (_req: Request, res: Response) => {
    res.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    });
  });

  // POST /api/feedback - Submit user feedback
  router.post('/feedback', async (req: Request, res: Response) => {
    try {
      const { zoneId, predictedScore, actualBusyness, timestamp } = req.body;

      // Log feedback (in production, save to database)
      console.log('📊 Feedback received:', {
        zoneId,
        predictedScore,
        actualBusyness,
        timestamp,
      });

      // Calculate simple accuracy
      let accurate = false;
      if (actualBusyness === 'busy' && predictedScore >= 70) accurate = true;
      if (actualBusyness === 'ok' && predictedScore >= 40 && predictedScore < 70) accurate = true;
      if (actualBusyness === 'slow' && predictedScore < 40) accurate = true;

      res.json({
        success: true,
        accurate,
        message: 'Thank you for your feedback!',
      });
    } catch (error) {
      console.error('Error processing feedback:', error);
      res.status(500).json({ error: 'Failed to process feedback' });
    }
  });

  // POST /api/events/report - Report a bad/wrong event
  router.post('/events/report', async (req: Request, res: Response) => {
    try {
      const { eventId, eventName, reason } = req.body;

      if (!eventId || !eventName) {
        return res.status(400).json({ error: 'eventId and eventName are required' });
      }

      // Get the blacklist service from EventsService
      const blacklistService = eventsService.getBlacklistService();
      blacklistService.reportEvent(eventId, eventName, reason);

      res.json({
        success: true,
        message: 'Event reported and blacklisted',
        blacklistedCount: blacklistService.getBlacklistedCount(),
      });
    } catch (error) {
      console.error('Error reporting event:', error);
      res.status(500).json({ error: 'Failed to report event' });
    }
  });

  // POST /api/route - Calculate route between two points
  router.post('/route', async (req: Request, res: Response) => {
    try {
      const { from, to, departAt } = req.body;

      if (!from || !to || !from.lat || !from.lng || !to.lat || !to.lng) {
        return res.status(400).json({ error: 'from and to coordinates are required' });
      }

      const departTime = departAt ? new Date(departAt) : undefined;
      const routeInfo = await routingService.calculateRoute(from, to, departTime);

      res.json(routeInfo);
    } catch (error) {
      console.error('Error calculating route:', error);
      res.status(500).json({ error: 'Failed to calculate route' });
    }
  });

  // POST /api/route/multi-stop - Calculate route with waypoints
  router.post('/route/multi-stop', async (req: Request, res: Response) => {
    try {
      const { stops, departAt } = req.body;

      if (!stops || !Array.isArray(stops) || stops.length < 2) {
        return res.status(400).json({ error: 'At least 2 stops are required' });
      }

      const departTime = departAt ? new Date(departAt) : undefined;
      const routeInfo = await routingService.calculateMultiStopRoute(stops, departTime);

      res.json(routeInfo);
    } catch (error) {
      console.error('Error calculating multi-stop route:', error);
      res.status(500).json({ error: 'Failed to calculate multi-stop route' });
    }
  });

  // POST /api/pulse/report - Report driver pulse (ground truth)
  router.post('/pulse/report', async (req: Request, res: Response) => {
    try {
      const { zoneId, type } = req.body;

      if (!zoneId || !type) {
        return res.status(400).json({ error: 'zoneId and type are required' });
      }

      const validTypes = ['airport_full', 'surge_fake', 'traffic_bad', 'high_demand', 'quiet'];
      if (!validTypes.includes(type)) {
        return res.status(400).json({ error: 'Invalid pulse type' });
      }

      const report = driverPulseService.reportPulse(zoneId, type);
      res.json({ success: true, report });
    } catch (error) {
      console.error('Error reporting pulse:', error);
      res.status(500).json({ error: 'Failed to report pulse' });
    }
  });

  // GET /api/pulse - Get all active pulses
  router.get('/pulse', async (_req: Request, res: Response) => {
    try {
      const pulses = driverPulseService.getAllPulses();
      res.json({ pulses });
    } catch (error) {
      console.error('Error fetching pulses:', error);
      res.status(500).json({ error: 'Failed to fetch pulses' });
    }
  });

  // GET /api/pulse/:zoneId - Get pulses for a specific zone
  router.get('/pulse/:zoneId', async (req: Request, res: Response) => {
    try {
      const { zoneId } = req.params;
      const pulses = driverPulseService.getPulsesForZone(zoneId);
      res.json({ pulses });
    } catch (error) {
      console.error('Error fetching zone pulses:', error);
      res.status(500).json({ error: 'Failed to fetch zone pulses' });
    }
  });

  // GET /api/live-sports - Get live Seattle sports games with real-time status
  router.get('/live-sports', async (_req: Request, res: Response) => {
    try {
      const espnService = eventsService.getESPNService();
      const games = await espnService.getSeattleGames();
      
      res.json({
        games,
        timestamp: new Date().toISOString(),
        count: games.length,
        liveCount: games.filter(g => g.status === 'in_progress').length,
        endingSoonCount: games.filter(g => g.nearingEnd).length,
      });
    } catch (error) {
      console.error('Error fetching live sports:', error);
      res.status(500).json({ error: 'Failed to fetch live sports data' });
    }
  });

  // GET /api/surge-alerts - Get surge alerts for games ending soon
  router.get('/surge-alerts', async (_req: Request, res: Response) => {
    try {
      const espnService = eventsService.getESPNService();
      const [surgeAlerts, endingGames] = await Promise.all([
        espnService.getSurgeAlerts(),
        espnService.getEndingSoonGames(),
      ]);
      
      res.json({
        alerts: surgeAlerts,
        endingGames,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.error('Error fetching surge alerts:', error);
      res.status(500).json({ error: 'Failed to fetch surge alerts' });
    }
  });

  // GET /api/money-makers - Get all money-making intelligence
  router.get('/money-makers', async (_req: Request, res: Response) => {
    try {
      const { CruiseShipsService } = await import('../services/cruiseShips.service.js');
      const { AirportQueueService } = await import('../services/airportQueue.service.js');
      const { ConventionsService } = await import('../services/conventions.service.js');
      const { WeatherSurgeService } = await import('../services/weatherSurge.service.js');
      const { getBarCloseAlerts, getRecommendedBarZone } = await import('../data/barCloseTimes.js');
      const { getCurrentDeadZones } = await import('../data/deadZones.js');

      const cruiseService = new CruiseShipsService();
      const airportService = new AirportQueueService();
      const conventionsService = new ConventionsService();
      const weatherSurgeService = new WeatherSurgeService();

      const currentTime = new Date();
      const [weather, flights] = await Promise.all([
        getWeatherData(weatherService),
        getFlightsData(flightsService),
      ]);

      const [cruiseShips, cruiseAlerts, conventions, queueEstimate, weatherSurge] = await Promise.all([
        cruiseService.getTodaysShips(),
        cruiseService.getSurgeAlerts(),
        conventionsService.getActiveConventions(),
        airportService.estimateQueueWait(flights, currentTime),
        Promise.resolve(weatherSurgeService.predictNextHour(weather)),
      ]);

      const barCloseAlerts = getBarCloseAlerts(currentTime);
      const recommendedBarZone = getRecommendedBarZone(currentTime);
      const deadZones = getCurrentDeadZones(currentTime);

      res.json({
        timestamp: currentTime.toISOString(),
        cruiseShips: {
          ships: cruiseShips,
          alerts: cruiseAlerts,
        },
        airportQueue: queueEstimate,
        conventions: {
          active: conventions,
        },
        barClose: {
          alerts: barCloseAlerts,
          recommendedZone: recommendedBarZone,
        },
        deadZones,
        weatherSurge,
      });
    } catch (error) {
      console.error('Error fetching money-makers:', error);
      res.status(500).json({ error: 'Failed to fetch money-making intelligence' });
    }
  });

  // GET /api/staging-spot/:zoneId - Get staging spot for a zone
  router.get('/staging-spot/:zoneId', async (req: Request, res: Response) => {
    try {
      const { getStagingSpotForZone } = await import('../data/stagingSpots.js');
      const { zoneId } = req.params;
      const { purpose } = req.query;
      
      const spot = getStagingSpotForZone(zoneId, purpose as any);
      
      if (!spot) {
        return res.status(404).json({ error: 'No staging spot found for this zone' });
      }

      res.json(spot);
    } catch (error) {
      console.error('Error fetching staging spot:', error);
      res.status(500).json({ error: 'Failed to fetch staging spot' });
    }
  });

  // POST /api/pace-check - Check earnings pace
  router.post('/pace-check', async (req: Request, res: Response) => {
    try {
      const { PaceAlertsService } = await import('../services/paceAlerts.service.js');
      const paceService = new PaceAlertsService();
      
      const { currentEarnings, hoursWorked, dailyGoal, plannedTotalHours } = req.body;

      if (typeof currentEarnings !== 'number' || typeof hoursWorked !== 'number' ||
          typeof dailyGoal !== 'number' || typeof plannedTotalHours !== 'number') {
        return res.status(400).json({ error: 'Invalid parameters' });
      }

      const paceAlert = paceService.calculatePace(
        currentEarnings,
        hoursWorked,
        dailyGoal,
        plannedTotalHours
      );

      res.json(paceAlert);
    } catch (error) {
      console.error('Error calculating pace:', error);
      res.status(500).json({ error: 'Failed to calculate pace' });
    }
  });

  return router;
}

/**
 * Zone metadata lookup:
 * - Micro-zones first (more granular, replaces many Seattle core legacy zones)
 * - Legacy zones for suburbs/coverage
 */
function getZoneMetaById(zoneId: string) {
  return microZones.find(z => z.id === zoneId) || legacyZones.find(z => z.id === zoneId);
}

// Helper functions to get cached data or fetch fresh
async function getWeatherData(weatherService: WeatherService): Promise<WeatherConditions> {
  const cached = getCached<WeatherConditions>(weatherCache, 'weather');
  if (cached) return cached;

  const weather = await weatherService.getCurrentWeather();
  setCache(weatherCache, 'weather', weather);
  return weather;
}

async function getEventsData(eventsService: EventsService): Promise<Event[]> {
  const cached = getCached<Event[]>(eventsCache, 'events');
  if (cached) return cached;

  const events = await eventsService.getUpcomingEvents();
  setCache(eventsCache, 'events', events);
  return events;
}

async function getFlightsData(flightsService: FlightsService): Promise<FlightArrival[]> {
  const cached = getCached<FlightArrival[]>(flightsCache, 'flights');
  if (cached) return cached;

  const flights = await flightsService.getArrivals();
  setCache(flightsCache, 'flights', flights);
  return flights;
}

async function getTrafficData(trafficService: TrafficService): Promise<Map<string, number>> {
  const cached = getCached<Map<string, number>>(trafficCache, 'traffic');
  if (cached) return cached;

  const traffic = await trafficService.getCongestionData();
  setCache(trafficCache, 'traffic', traffic);
  return traffic;
}

