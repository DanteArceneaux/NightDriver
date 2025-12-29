import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ScoringService } from '../src/services/scoring.service.js';
import type { Event, WeatherConditions, FlightArrival } from '../src/types/index.js';

describe('ScoringService', () => {
  let scoringService: ScoringService;

  beforeEach(() => {
    scoringService = new ScoringService();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('calculateZoneScores', () => {
    it('should calculate scores for all zones', () => {
      const currentTime = new Date('2024-01-15T12:00:00Z');
      const scores = scoringService.calculateZoneScores(currentTime);

      expect(scores).toBeDefined();
      expect(Array.isArray(scores)).toBe(true);
      expect(scores.length).toBeGreaterThan(0);

      // Check score structure
      scores.forEach(score => {
        expect(score).toHaveProperty('id');
        expect(score).toHaveProperty('name');
        expect(score).toHaveProperty('score');
        expect(typeof score.score).toBe('number');
        expect(score.score).toBeGreaterThanOrEqual(0);
        expect(score.score).toBeLessThanOrEqual(100);
        expect(score).toHaveProperty('factors');
        expect(score.factors).toHaveProperty('baseline');
      });
    });

    it('should apply event boosts correctly', () => {
      const currentTime = new Date('2024-01-15T18:00:00Z');
      const events: Event[] = [
        {
          name: 'Test Concert',
          venue: 'Climate Pledge Arena',
          startTime: new Date('2024-01-15T19:00:00Z').toISOString(),
          endTime: new Date('2024-01-15T22:00:00Z').toISOString(),
          zoneId: 'queen-anne',
          type: 'concert',
        },
      ];

      const scores = scoringService.calculateZoneScores(currentTime, events);

      const queenAnneScore = scores.find(s => s.id === 'queen-anne');
      expect(queenAnneScore).toBeDefined();
      expect(queenAnneScore!.factors.events).toBeGreaterThan(0);
    });

    it('should apply weather boosts for rain', () => {
      const currentTime = new Date('2024-01-15T12:00:00Z');
      const weather: WeatherConditions = {
        temperature: 55,
        description: 'light rain',
        isRaining: true,
        rainPrediction: 'Currently raining',
      };

      const scores = scoringService.calculateZoneScores(currentTime, [], weather);

      scores.forEach(score => {
        expect(score.factors.weather).toBeGreaterThan(0);
      });
    });

    it('should apply flight boosts only to SeaTac', () => {
      const currentTime = new Date('2024-01-15T12:00:00Z');
      const flights: FlightArrival[] = [
        {
          flightNumber: 'AA123',
          arrivalTime: new Date('2024-01-15T12:30:00Z').toISOString(),
          origin: 'LAX',
          terminal: 'A',
        },
      ];

      const scores = scoringService.calculateZoneScores(currentTime, [], null, flights);

      const seatacScore = scores.find(s => s.id === 'seatac');
      const downtownScore = scores.find(s => s.id === 'downtown');

      expect(seatacScore!.factors.flights).toBeGreaterThan(0);
      expect(downtownScore!.factors.flights).toBe(0);
    });

    it('should cap total score at 100', () => {
      const currentTime = new Date('2024-01-15T12:00:00Z');
      
      // Create extreme conditions that would push score over 100
      const events: Event[] = [
        {
          name: 'Huge Concert',
          venue: 'Climate Pledge Arena',
          startTime: new Date('2024-01-15T12:30:00Z').toISOString(),
          endTime: new Date('2024-01-15T15:00:00Z').toISOString(),
          zoneId: 'queen-anne',
          type: 'concert',
        },
      ];

      const weather: WeatherConditions = {
        temperature: 55,
        description: 'heavy rain',
        isRaining: true,
        rainPrediction: 'Currently raining',
      };

      const scores = scoringService.calculateZoneScores(currentTime, events, weather);

      scores.forEach(score => {
        expect(score.score).toBeLessThanOrEqual(100);
      });
    });
  });

  describe('determineTopPick', () => {
    it('should return a top pick with highest score', () => {
      const mockScores = [
        {
          id: 'zone1',
          name: 'Zone 1',
          score: 85,
          trend: 'rising' as const,
          estimatedHourlyRate: 40,
          factors: {
            baseline: 50,
            events: 15,
            weather: 10,
            flights: 5,
            traffic: 5,
          },
          coordinates: { lat: 47.6, lng: -122.3 },
        },
        {
          id: 'zone2',
          name: 'Zone 2',
          score: 70,
          trend: 'stable' as const,
          estimatedHourlyRate: 35,
          factors: {
            baseline: 50,
            events: 10,
            weather: 5,
            flights: 3,
            traffic: 2,
          },
          coordinates: { lat: 47.7, lng: -122.4 },
        },
      ];

      const topPick = scoringService.determineTopPick(mockScores as any, [], []);

      expect(topPick).toBeDefined();
      expect(topPick.zoneId).toBe('zone1');
      expect(topPick.score).toBe(85);
      expect(typeof topPick.reason).toBe('string');
    });

    it('should return default when no scores provided', () => {
      const topPick = scoringService.determineTopPick([], [], []);

      expect(topPick).toBeDefined();
      expect(topPick.zoneId).toBe('downtown');
      expect(topPick.score).toBe(50);
    });
  });

  describe('generateForecast', () => {
    it('should generate forecast for specified hours', () => {
      const forecast = scoringService.generateForecast(4);

      expect(forecast).toBeDefined();
      expect(Array.isArray(forecast)).toBe(true);
      expect(forecast.length).toBe(4);

      forecast.forEach((point, index) => {
        expect(point).toHaveProperty('time');
        expect(point).toHaveProperty('hour');
        expect(point).toHaveProperty('topZones');
        expect(Array.isArray(point.topZones)).toBe(true);
        expect(point.topZones.length).toBeLessThanOrEqual(3);
      });
    });

    it('should handle different hour counts', () => {
      const forecast3 = scoringService.generateForecast(3);
      const forecast6 = scoringService.generateForecast(6);

      expect(forecast3.length).toBe(3);
      expect(forecast6.length).toBe(6);
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty events array', () => {
      const currentTime = new Date();
      const scores = scoringService.calculateZoneScores(currentTime, []);

      expect(scores).toBeDefined();
      scores.forEach(score => {
        expect(score.factors.events).toBe(0);
      });
    });

    it('should handle null weather', () => {
      const currentTime = new Date();
      const scores = scoringService.calculateZoneScores(currentTime, [], null);

      expect(scores).toBeDefined();
      scores.forEach(score => {
        expect(score.factors.weather).toBe(0);
      });
    });

    it('should handle empty flights array', () => {
      const currentTime = new Date();
      const scores = scoringService.calculateZoneScores(currentTime, [], null, []);

      expect(scores).toBeDefined();
      const seatacScore = scores.find(s => s.id === 'seatac');
      expect(seatacScore!.factors.flights).toBe(0);
    });

    it('should handle different times of day', () => {
      const morning = new Date('2024-01-15T08:00:00Z');
      const afternoon = new Date('2024-01-15T14:00:00Z');
      const evening = new Date('2024-01-15T20:00:00Z');
      const night = new Date('2024-01-15T02:00:00Z');

      const morningScores = scoringService.calculateZoneScores(morning);
      const afternoonScores = scoringService.calculateZoneScores(afternoon);
      const eveningScores = scoringService.calculateZoneScores(evening);
      const nightScores = scoringService.calculateZoneScores(night);

      // Scores should vary by time of day
      expect(morningScores).toBeDefined();
      expect(afternoonScores).toBeDefined();
      expect(eveningScores).toBeDefined();
      expect(nightScores).toBeDefined();
    });
  });
});



