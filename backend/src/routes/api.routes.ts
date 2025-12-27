import { Router, Request, Response } from 'express';
import { ScoringService } from '../services/scoring.service.js';
import { WeatherService } from '../services/weather.service.js';
import { EventsService } from '../services/events.service.js';
import { FlightsService } from '../services/flights.service.js';
import { TrafficService } from '../services/traffic.service.js';
import { zones } from '../data/zones.js';
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
  scoringService: ScoringService
): Router {
  const router = Router();

  // GET /api/zones - Get all zones with current scores
  router.get('/zones', async (req: Request, res: Response) => {
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
      const zone = zones.find(z => z.id === id);

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
  router.get('/forecast', async (req: Request, res: Response) => {
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
  router.get('/conditions', async (req: Request, res: Response) => {
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

  // GET /api/health - Health check
  router.get('/health', (req: Request, res: Response) => {
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

  return router;
}

// Helper functions to get cached data or fetch fresh
async function getWeatherData(weatherService: WeatherService) {
  const cached = getCached(weatherCache, 'weather');
  if (cached) return cached;

  const weather = await weatherService.getCurrentWeather();
  setCache(weatherCache, 'weather', weather);
  return weather;
}

async function getEventsData(eventsService: EventsService) {
  const cached = getCached(eventsCache, 'events');
  if (cached) return cached;

  const events = await eventsService.getUpcomingEvents();
  setCache(eventsCache, 'events', events);
  return events;
}

async function getFlightsData(flightsService: FlightsService) {
  const cached = getCached(flightsCache, 'flights');
  if (cached) return cached;

  const flights = await flightsService.getArrivals();
  setCache(flightsCache, 'flights', flights);
  return flights;
}

async function getTrafficData(trafficService: TrafficService) {
  const cached = getCached(trafficCache, 'traffic');
  if (cached) return cached;

  const traffic = await trafficService.getCongestionData();
  setCache(trafficCache, 'traffic', traffic);
  return traffic;
}

