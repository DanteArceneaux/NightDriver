import { Router, Request, Response } from 'express';
import { ScoringService } from '../services/scoring.service.js';
import { WeatherService } from '../services/weather.service.js';
import { EventsService } from '../services/events.service.js';
import { FlightsService } from '../services/flights.service.js';
import { TrafficService } from '../services/traffic.service.js';
import { RoutingService } from '../services/routing.service.js';
import { EventAlertsService } from '../services/eventAlerts.service.js';
// DriverPulseService removed - was fake/unused data
import { zones as legacyZones } from '../data/zones.js';
import { microZones } from '../data/microZones.js';
import type { WeatherConditions, Event, FlightArrival, ZoneScore } from '../types/index.js';
import {
  weatherCache,
  eventsCache,
  flightsCache,
  trafficCache,
  scoresCache,
  getCached,
  setCache,
} from '../middleware/cache.middleware.js';
import { rateLimitMiddleware } from '../middleware/rateLimit.middleware.js';
import { TeslaService } from '../services/tesla.service.js';

export function createApiRouter(
  weatherService: WeatherService,
  eventsService: EventsService,
  flightsService: FlightsService,
  trafficService: TrafficService,
  scoringService: ScoringService,
  routingService: RoutingService,
  eventAlertsService: EventAlertsService,
  teslaService: TeslaService
): Router {
  const router = Router();

  // Apply rate limiting to all API routes
  router.use(rateLimitMiddleware.api);

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

      const response = {
        timestamp: currentTime.toISOString(),
        topPick: scoringService.determineTopPick(zoneScores, events, flights),
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
        factors: zoneScore.factors || {},
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

  // DriverPulse endpoints removed - was fake/unused data

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

  // GET /api/trip-chain/:fromZoneId - "Where should I end up next?"
  router.get('/trip-chain/:fromZoneId', async (req: Request, res: Response) => {
    try {
      const { fromZoneId } = req.params;
      const currentTime = new Date();

      // Use cached base scores if available; otherwise compute.
      const cached = getCached(scoresCache, 'zones') as any | undefined;
      let baseZones: ZoneScore[] | undefined = cached?.zones;

      if (!baseZones || !Array.isArray(baseZones) || baseZones.length === 0) {
        const [weather, events, flights, traffic] = await Promise.all([
          getWeatherData(weatherService),
          getEventsData(eventsService),
          getFlightsData(flightsService),
          getTrafficData(trafficService),
        ]);

        baseZones = scoringService.calculateZoneScores(
          currentTime,
          events,
          weather,
          flights,
          traffic
        );
      }

      const { TripChainService } = await import('../services/tripChain.service.js');
      const tripChainService = new TripChainService();

      const recommendations = tripChainService.getRecommendations(fromZoneId, baseZones, 3);

      res.json({
        timestamp: currentTime.toISOString(),
        fromZoneId,
        recommendations,
        note: 'Heuristic chain suggestions (metadata + live scores + distance penalty).',
      });
    } catch (error) {
      console.error('Error in /trip-chain:', error);
      res.status(500).json({ error: 'Failed to generate trip chain recommendations' });
    }
  });

  // GET /api/money-makers - Get all money-making intelligence
  router.get('/money-makers', async (_req: Request, res: Response) => {
    try {
      const { CruiseShipsService } = await import('../services/cruiseShips.service.js');
      const { AirportQueueService } = await import('../services/airportQueue.service.js');
      const { ConventionsService } = await import('../services/conventions.service.js');
      const { WeatherSurgeService } = await import('../services/weatherSurge.service.js');
      const { FerriesService } = await import('../services/ferries.service.js');
      const { HotelCheckoutService } = await import('../services/hotelCheckout.service.js');
      const { HospitalShiftsService } = await import('../services/hospitalShifts.service.js');
      const { UWClassesService } = await import('../services/uwClasses.service.js');
      const { getBarCloseAlerts, getRecommendedBarZone } = await import('../data/barCloseTimes.js');
      const { getCurrentDeadZones } = await import('../data/deadZones.js');

      const cruiseService = new CruiseShipsService();
      const airportService = new AirportQueueService();
      const conventionsService = new ConventionsService();
      const weatherSurgeService = new WeatherSurgeService();
      const ferriesService = new FerriesService();
      const hotelCheckoutService = new HotelCheckoutService();
      const hospitalShiftsService = new HospitalShiftsService();
      const uwClassesService = new UWClassesService();

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
      const ferries = ferriesService.getFerryIntelligence(currentTime);
      const hotelCheckout = hotelCheckoutService.getHotelCheckoutIntelligence(currentTime);
      const hospitalShifts = hospitalShiftsService.getHospitalShiftIntelligence(currentTime);
      const uwClasses = uwClassesService.getUWClassesIntelligence(currentTime);

      res.json({
        timestamp: currentTime.toISOString(),
        cruiseShips: {
          ships: cruiseShips,
          alerts: cruiseAlerts,
        },
        ferries,
        hotelCheckout,
        hospitalShifts,
        uwClasses,
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

  // GET /api/amenities - Find driver amenities (bathrooms, charging, coffee) (NEW)
  router.get('/amenities', async (req: Request, res: Response) => {
    try {
      const { AmenitiesService } = await import('../services/amenities.service.js');
      const amenitiesService = new AmenitiesService();

      const { lat, lng, type, radius } = req.query;

      if (!lat || !lng) {
        return res.status(400).json({ error: 'lat and lng query parameters required' });
      }

      const location = { lat: parseFloat(lat as string), lng: parseFloat(lng as string) };
      const searchType = (type as any) || 'all';
      const searchRadius = radius ? parseFloat(radius as string) : 2;

      const amenities = await amenitiesService.findNearby(location, searchType, searchRadius);

      res.json({
        location,
        count: amenities.length,
        amenities,
      });
    } catch (error) {
      console.error('Error fetching amenities:', error);
      res.status(500).json({ error: 'Failed to fetch amenities' });
    }
  });

  // GET /api/amenities/bathrooms - Get only 24/7 bathrooms (NEW)
  router.get('/amenities/bathrooms', async (req: Request, res: Response) => {
    try {
      const { AmenitiesService } = await import('../services/amenities.service.js');
      const amenitiesService = new AmenitiesService();

      const { lat, lng, radius } = req.query;

      if (!lat || !lng) {
        return res.status(400).json({ error: 'lat and lng query parameters required' });
      }

      const location = { lat: parseFloat(lat as string), lng: parseFloat(lng as string) };
      const searchRadius = radius ? parseFloat(radius as string) : 2;

      const bathrooms = await amenitiesService.find24HourBathrooms(location, searchRadius);

      res.json({
        location,
        count: bathrooms.length,
        bathrooms,
      });
    } catch (error) {
      console.error('Error fetching bathrooms:', error);
      res.status(500).json({ error: 'Failed to fetch bathrooms' });
    }
  });

  // GET /api/amenities/charging - Get EV charging stations (NEW)
  router.get('/amenities/charging', async (req: Request, res: Response) => {
    try {
      const { AmenitiesService } = await import('../services/amenities.service.js');
      const amenitiesService = new AmenitiesService();

      const { lat, lng, radius, tesla } = req.query;

      if (!lat || !lng) {
        return res.status(400).json({ error: 'lat and lng query parameters required' });
      }

      const location = { lat: parseFloat(lat as string), lng: parseFloat(lng as string) };
      const searchRadius = radius ? parseFloat(radius as string) : 5;

      const chargers = tesla === 'true'
        ? await amenitiesService.findTeslaSuperchargers(location, searchRadius)
        : await amenitiesService.findNearby(location, 'charging', searchRadius);

      res.json({
        location,
        count: chargers.length,
        chargers,
      });
    } catch (error) {
      console.error('Error fetching charging stations:', error);
      res.status(500).json({ error: 'Failed to fetch charging stations' });
    }
  });

  // POST /api/shift-planner - Generate optimal shift plan (NEW)
  router.post('/shift-planner', async (req: Request, res: Response) => {
    try {
      console.log('📅 Shift planner request received:', req.body);
      
      const { ShiftPlannerService } = await import('../services/shiftPlanner.service.js');
      const plannerService = new ShiftPlannerService();

      const { startTime, endTime, startingLocation, vehicleType, currentBatteryPercent, goals } = req.body;

      if (!startTime || !endTime || !startingLocation) {
        console.error('❌ Missing required fields:', { startTime, endTime, startingLocation });
        return res.status(400).json({ error: 'startTime, endTime, and startingLocation required' });
      }

      console.log('📅 Planning shift with params:', {
        startTime,
        endTime,
        startingLocation,
        vehicleType,
        currentBatteryPercent,
        goals,
      });

      const plan = await plannerService.planShift({
        startTime: new Date(startTime),
        endTime: new Date(endTime),
        startingLocation,
        vehicleType,
        currentBatteryPercent,
        goals,
      });

      console.log('✅ Shift plan generated successfully:', {
        totalHours: plan.totalHours,
        segments: plan.segments.length,
        estimatedEarnings: plan.estimatedTotalEarnings,
      });

      res.json(plan);
    } catch (error) {
      console.error('❌ Error planning shift:', error);
      res.status(500).json({ 
        error: 'Failed to plan shift', 
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // GET /api/conventions - Get real convention calendar (NEW)
  router.get('/conventions', async (req: Request, res: Response) => {
    try {
      const { WSCCConventionsService } = await import('../services/wsccConventions.service.js');
      const conventionsService = new WSCCConventionsService();

      const { date } = req.query;
      const targetDate = date ? new Date(date as string) : new Date();

      const active = await conventionsService.getActiveConventions(targetDate);
      const impacts = await conventionsService.getConventionImpacts(targetDate);

      res.json({
        date: targetDate.toISOString(),
        activeConventions: active,
        zoneImpacts: impacts,
      });
    } catch (error) {
      console.error('Error fetching conventions:', error);
      res.status(500).json({ error: 'Failed to fetch conventions' });
    }
  });

  // GET /api/tesla - Get Tesla vehicle data (NEW)
  router.get('/tesla', async (_req: Request, res: Response) => {
    try {
      const data = await teslaService.getVehicleData();
      res.json(data);
    } catch (error) {
      console.error('Error fetching Tesla data:', error);
      res.status(500).json({ error: 'Failed to fetch Tesla data' });
    }
  });

  // POST /api/tesla/auth - Update Tesla Access Token (NEW)
  router.post('/tesla/auth', async (req: Request, res: Response) => {
    try {
      const { token } = req.body;
      if (!token) {
        return res.status(400).json({ error: 'Token is required' });
      }
      
      teslaService.setAccessToken(token);
      res.json({ success: true, message: 'Tesla token updated successfully' });
    } catch (error) {
      console.error('Error updating Tesla token:', error);
      res.status(500).json({ error: 'Failed to update Tesla token' });
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

// applyPulseModifiers removed - DriverPulse was fake/unused data

