import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import request from 'supertest';
import { createServer } from 'http';
import express from 'express';
import cors from 'cors';
import { Server } from 'socket.io';
import { config } from '../../src/config/env.js';
import { createApiRouter } from '../../src/routes/api.routes.js';
import { ScoringService } from '../../src/services/scoring.service.js';
import { WeatherService } from '../../src/services/weather.service.js';
import { EventsService } from '../../src/services/events.service.js';
import { FlightsService } from '../../src/services/flights.service.js';
import { TrafficService } from '../../src/services/traffic.service.js';
import { RoutingService } from '../../src/services/routing.service.js';
import { EventAlertsService } from '../../src/services/eventAlerts.service.js';
import { DriverPulseService } from '../../src/services/driverPulse.service.js';
import { errorHandler } from '../../src/lib/errors.js';

describe('API Integration Tests', () => {
  let app: express.Application;
  let server: any;
  let scoringService: ScoringService;
  let weatherService: WeatherService;
  let eventsService: EventsService;
  let flightsService: FlightsService;
  let trafficService: TrafficService;
  let routingService: RoutingService;
  let eventAlertsService: EventAlertsService;
  let driverPulseService: DriverPulseService;

  beforeAll(async () => {
    // Create Express app
    app = express();
    const httpServer = createServer(app);
    
    // Middleware
    app.use(cors());
    app.use(express.json());

    // Initialize services with mock API keys
    scoringService = new ScoringService();
    weatherService = new WeatherService('test-weather-key');
    eventsService = new EventsService('test-ticketmaster-key');
    flightsService = new FlightsService('test-flights-key');
    trafficService = new TrafficService('test-traffic-key');
    routingService = new RoutingService('test-traffic-key');
    eventAlertsService = new EventAlertsService();
    driverPulseService = new DriverPulseService();

    // Mock service methods to return test data
    vi.spyOn(weatherService, 'getCurrentWeather').mockResolvedValue({
      temperature: 55,
      description: 'partly cloudy',
      isRaining: false,
      rainPrediction: 'No rain expected',
    });

    vi.spyOn(eventsService, 'getUpcomingEvents').mockResolvedValue([]);
    vi.spyOn(flightsService, 'getArrivals').mockResolvedValue([]);
    vi.spyOn(trafficService, 'getCongestionData').mockResolvedValue(new Map());

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

    // Error handling
    app.use(errorHandler);

    // Start server
    server = httpServer.listen(0); // Random port
  });

  afterAll(() => {
    if (server) {
      server.close();
    }
    vi.restoreAllMocks();
  });

  describe('GET /api/zones', () => {
    it('should return zones data with correct structure', async () => {
      const response = await request(app)
        .get('/api/zones')
        .expect('Content-Type', /json/)
        .expect(200);

      const data = response.body;
      
      expect(data).toHaveProperty('timestamp');
      expect(data).toHaveProperty('topPick');
      expect(data).toHaveProperty('zones');
      
      // Check top pick structure
      expect(data.topPick).toHaveProperty('zoneId');
      expect(data.topPick).toHaveProperty('score');
      expect(data.topPick).toHaveProperty('reason');
      
      // Check zones array
      expect(Array.isArray(data.zones)).toBe(true);
      expect(data.zones.length).toBeGreaterThan(0);
      
      // Check first zone structure
      const firstZone = data.zones[0];
      expect(firstZone).toHaveProperty('id');
      expect(firstZone).toHaveProperty('name');
      expect(firstZone).toHaveProperty('score');
      expect(firstZone).toHaveProperty('factors');
      expect(firstZone.factors).toHaveProperty('baseline');
      expect(firstZone.factors).toHaveProperty('events');
      expect(firstZone.factors).toHaveProperty('weather');
      expect(firstZone.factors).toHaveProperty('flights');
      expect(firstZone.factors).toHaveProperty('traffic');
    });

    it('should return valid score ranges', async () => {
      const response = await request(app)
        .get('/api/zones')
        .expect(200);

      const { zones } = response.body;
      
      zones.forEach((zone: any) => {
        expect(zone.score).toBeGreaterThanOrEqual(0);
        expect(zone.score).toBeLessThanOrEqual(100);
        
        // Factor scores should be reasonable
        expect(zone.factors.baseline).toBeGreaterThanOrEqual(0);
        expect(zone.factors.events).toBeGreaterThanOrEqual(0);
        expect(zone.factors.weather).toBeGreaterThanOrEqual(0);
        expect(zone.factors.flights).toBeGreaterThanOrEqual(0);
        expect(zone.factors.traffic).toBeGreaterThanOrEqual(0);
      });
    });
  });

  describe('GET /api/forecast', () => {
    it('should return forecast data with correct structure', async () => {
      const response = await request(app)
        .get('/api/forecast')
        .expect('Content-Type', /json/)
        .expect(200);

      const data = response.body;
      
      expect(data).toHaveProperty('points');
      expect(Array.isArray(data.points)).toBe(true);
      expect(data.points.length).toBe(4); // Default 4-hour forecast
      
      // Check first forecast point
      const firstPoint = data.points[0];
      expect(firstPoint).toHaveProperty('time');
      expect(firstPoint).toHaveProperty('hour');
      expect(firstPoint).toHaveProperty('topZones');
      expect(Array.isArray(firstPoint.topZones)).toBe(true);
      expect(firstPoint.topZones.length).toBeLessThanOrEqual(3);
      
      // Check top zone structure
      if (firstPoint.topZones.length > 0) {
        const topZone = firstPoint.topZones[0];
        expect(topZone).toHaveProperty('id');
        expect(topZone).toHaveProperty('name');
        expect(topZone).toHaveProperty('score');
      }
    });

    it('should accept hours parameter', async () => {
      const response = await request(app)
        .get('/api/forecast?hours=2')
        .expect(200);

      const data = response.body;
      expect(data.points.length).toBe(2);
    });

    it('should validate hours parameter', async () => {
      const response = await request(app)
        .get('/api/forecast?hours=25') // Too many hours
        .expect(200); // Should still work, just cap at reasonable limit

      const data = response.body;
      expect(data.points.length).toBeLessThanOrEqual(24);
    });
  });

  describe('GET /api/conditions', () => {
    it('should return conditions data with correct structure', async () => {
      const response = await request(app)
        .get('/api/conditions')
        .expect('Content-Type', /json/)
        .expect(200);

      const data = response.body;
      
      expect(data).toHaveProperty('weather');
      expect(data).toHaveProperty('events');
      expect(data).toHaveProperty('flights');
      expect(data).toHaveProperty('lastUpdated');
      
      // Check weather structure
      expect(data.weather).toHaveProperty('temperature');
      expect(data.weather).toHaveProperty('description');
      expect(data.weather).toHaveProperty('isRaining');
      expect(data.weather).toHaveProperty('rainPrediction');
      
      // Check events array
      expect(Array.isArray(data.events)).toBe(true);
      
      // Check flights array
      expect(Array.isArray(data.flights)).toBe(true);
    });
  });

  describe('GET /api/health', () => {
    it('should return health check status', async () => {
      const response = await request(app)
        .get('/api/health')
        .expect('Content-Type', /json/)
        .expect(200);

      const data = response.body;
      
      expect(data).toHaveProperty('status', 'healthy');
      expect(data).toHaveProperty('timestamp');
      expect(data).toHaveProperty('version');
      expect(data).toHaveProperty('services');
      
      // Check services status
      expect(data.services).toHaveProperty('weather');
      expect(data.services).toHaveProperty('events');
      expect(data.services).toHaveProperty('flights');
      expect(data.services).toHaveProperty('traffic');
      
      // Each service should have enabled and source properties
      expect(data.services.weather).toHaveProperty('enabled');
      expect(data.services.weather).toHaveProperty('source');
      expect(data.services.events).toHaveProperty('enabled');
      expect(data.services.events).toHaveProperty('source');
      expect(data.services.flights).toHaveProperty('enabled');
      expect(data.services.flights).toHaveProperty('source');
      expect(data.services.traffic).toHaveProperty('enabled');
      expect(data.services.traffic).toHaveProperty('source');
    });
  });

  describe('GET /api/zones/:id', () => {
    it('should return specific zone details', async () => {
      // First get all zones to get a valid zone ID
      const zonesResponse = await request(app)
        .get('/api/zones')
        .expect(200);

      const zoneId = zonesResponse.body.zones[0].id;
      
      const response = await request(app)
        .get(`/api/zones/${zoneId}`)
        .expect('Content-Type', /json/)
        .expect(200);

      const data = response.body;
      
      expect(data).toHaveProperty('id', zoneId);
      expect(data).toHaveProperty('name');
      expect(data).toHaveProperty('score');
      expect(data).toHaveProperty('factors');
      expect(data).toHaveProperty('coordinates');
      expect(data.coordinates).toHaveProperty('lat');
      expect(data.coordinates).toHaveProperty('lng');
    });

    it('should return 404 for non-existent zone', async () => {
      const response = await request(app)
        .get('/api/zones/nonexistent-zone')
        .expect('Content-Type', /json/)
        .expect(404);

      const data = response.body;
      
      expect(data).toHaveProperty('error');
      expect(data.error).toHaveProperty('code');
      expect(data.error).toHaveProperty('message');
      expect(data.error.message).toContain('not found');
    });
  });

  describe('Error Handling', () => {
    it('should handle invalid routes with 404', async () => {
      const response = await request(app)
        .get('/api/nonexistent')
        .expect('Content-Type', /json/)
        .expect(404);

      const data = response.body;
      expect(data).toHaveProperty('error');
    });

    it('should handle malformed requests gracefully', async () => {
      // Test with invalid query parameters
      const response = await request(app)
        .get('/api/forecast?hours=not-a-number')
        .expect(200); // Should still return default forecast

      const data = response.body;
      expect(data).toHaveProperty('points');
    });
  });
});



