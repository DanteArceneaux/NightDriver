import { zones } from '../data/zones.js';
import { getBaselineScore } from '../data/timePatterns.js';
import { ZoneScore, TopPick, Event, WeatherConditions, FlightArrival } from '../types/index.js';

export class ScoringService {
  calculateZoneScores(
    currentTime: Date,
    events: Event[] = [],
    weather: WeatherConditions | null = null,
    flights: FlightArrival[] = [],
    trafficData: Map<string, number> = new Map()
  ): ZoneScore[] {
    const scores: ZoneScore[] = zones.map(zone => {
      const dayOfWeek = currentTime.getDay();
      const hour = currentTime.getHours();

      // Get baseline score from time patterns
      const baseline = getBaselineScore(zone.id, dayOfWeek, hour);

      // Calculate event boost
      const eventBoost = this.calculateEventBoost(zone.id, events, currentTime);

      // Calculate weather boost
      const weatherBoost = this.calculateWeatherBoost(weather);

      // Calculate flight boost (only for SeaTac)
      const flightBoost = this.calculateFlightBoost(zone.id, flights, currentTime);

      // Calculate traffic boost
      const trafficBoost = this.calculateTrafficBoost(zone.id, trafficData);

      // Total score (cap at 100)
      const totalScore = Math.min(
        100,
        baseline + eventBoost + weatherBoost + flightBoost + trafficBoost
      );

      const finalScore = Math.round(totalScore);
      const estimatedEarnings = this.calculateEstimatedEarnings(finalScore, hour, dayOfWeek);

      return {
        id: zone.id,
        name: zone.name,
        score: finalScore,
        trend: 'stable' as const, // TODO: Calculate based on historical data
        estimatedHourlyRate: estimatedEarnings,
        factors: {
          baseline: Math.round(baseline),
          events: Math.round(eventBoost),
          weather: Math.round(weatherBoost),
          flights: Math.round(flightBoost),
          traffic: Math.round(trafficBoost),
        },
        coordinates: zone.coordinates,
      };
    });

    // Sort by score descending
    return scores.sort((a, b) => b.score - a.score);
  }

  private calculateEventBoost(zoneId: string, events: Event[], currentTime: Date): number {
    let boost = 0;

    for (const event of events) {
      if (event.zoneId !== zoneId) continue;

      const eventStart = new Date(event.startTime);
      const eventEnd = new Date(event.endTime);
      const hoursUntilStart = (eventStart.getTime() - currentTime.getTime()) / (1000 * 60 * 60);
      const hoursUntilEnd = (eventEnd.getTime() - currentTime.getTime()) / (1000 * 60 * 60);

      // Type-specific scoring
      const eventType = event.type || 'other';

      // Event is happening now
      if (hoursUntilStart <= 0 && hoursUntilEnd > 0) {
        boost += eventType === 'sports' ? 10 : 15; // Lower during event for sports (people already there)
      }
      // Event ending soon (surge for rides home)
      else if (hoursUntilEnd > 0 && hoursUntilEnd <= 1) {
        if (eventType === 'sports') {
          boost += 40; // HUGE surge after sports games
        } else if (eventType === 'concert') {
          boost += 30; // Big surge after concerts
        } else if (eventType === 'conference') {
          boost += 10; // Small surge (people have cars)
        } else {
          boost += 25;
        }
      }
      // Event starting soon (people arriving)
      else if (hoursUntilStart > 0 && hoursUntilStart <= 1) {
        if (eventType === 'conference') {
          boost += 30; // High dropoff for conferences
        } else if (eventType === 'sports' || eventType === 'concert') {
          boost += 20; // Moderate for entertainment
        } else {
          boost += 15;
        }
      }
      // Event in next 2 hours
      else if (hoursUntilStart > 1 && hoursUntilStart <= 2) {
        boost += 10;
      }
    }

    return Math.min(boost, 45); // Cap event boost at 45 (raised for sports surges)
  }

  private calculateWeatherBoost(weather: WeatherConditions | null): number {
    if (!weather) return 0;

    let boost = 0;

    // Rain increases demand everywhere
    if (weather.isRaining) {
      boost += 15;
    }

    // Rain predicted soon
    if (weather.rainPrediction.includes('soon') || weather.rainPrediction.includes('within')) {
      boost += 8;
    }

    return boost;
  }

  private calculateFlightBoost(zoneId: string, flights: FlightArrival[], currentTime: Date): number {
    if (zoneId !== 'seatac') return 0;

    let boost = 0;
    const next30Min = new Date(currentTime.getTime() + 30 * 60 * 1000);
    const next60Min = new Date(currentTime.getTime() + 60 * 60 * 1000);

    for (const flight of flights) {
      const arrivalTime = new Date(flight.arrivalTime);

      // Flight arriving in next 30 minutes
      if (arrivalTime >= currentTime && arrivalTime <= next30Min) {
        boost += 8;
      }
      // Flight arriving in next 60 minutes
      else if (arrivalTime > next30Min && arrivalTime <= next60Min) {
        boost += 4;
      }
    }

    return Math.min(boost, 25); // Cap flight boost at 25
  }

  private calculateTrafficBoost(zoneId: string, trafficData: Map<string, number>): number {
    const congestionLevel = trafficData.get(zoneId) || 0;

    // Higher traffic = slightly more demand (people prefer rides over driving)
    // congestionLevel is 0-10 scale
    return congestionLevel * 0.5;
  }

  private calculateEstimatedEarnings(score: number, hour: number, dayOfWeek: number): number {
    // Base Seattle Uber rate (simplified model)
    const baseRate = 18; // $18/hr baseline

    // Score multiplier (score 0-100 maps to 0.5x-2.5x multiplier)
    const scoreMultiplier = 0.5 + (score / 100) * 2.0;

    // Time of day adjustment
    let timeMultiplier = 1.0;
    if (hour >= 17 && hour <= 19) {
      // Rush hour
      timeMultiplier = 1.3;
    } else if (hour >= 21 || hour <= 2) {
      // Late night
      timeMultiplier = 1.4;
    } else if (hour >= 7 && hour <= 9) {
      // Morning rush
      timeMultiplier = 1.2;
    }

    // Weekend adjustment
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
    const weekendMultiplier = isWeekend ? 1.2 : 1.0;

    const estimatedRate = baseRate * scoreMultiplier * timeMultiplier * weekendMultiplier;

    return Math.round(estimatedRate);
  }

  determineTopPick(scores: ZoneScore[], events: Event[], flights: FlightArrival[]): TopPick {
    if (scores.length === 0) {
      return {
        zoneId: 'downtown',
        score: 50,
        reason: 'Default recommendation',
      };
    }

    const topZone = scores[0];
    const reason = this.generateReason(topZone, events, flights);

    return {
      zoneId: topZone.id,
      score: topZone.score,
      reason,
    };
  }

  private generateReason(zone: ZoneScore, events: Event[], _flights: FlightArrival[]): string {
    const reasons: string[] = [];

    // Check for events
    const zoneEvents = events.filter(e => e.zoneId === zone.id);
    if (zoneEvents.length > 0 && zone.factors.events > 10) {
      const eventNames = zoneEvents.slice(0, 2).map(e => e.name).join(', ');
      reasons.push(`Events: ${eventNames}`);
    }

    // Check for flights
    if (zone.id === 'seatac' && zone.factors.flights > 10) {
      reasons.push(`${Math.floor(zone.factors.flights / 4)} flights arriving soon`);
    }

    // Check for weather
    if (zone.factors.weather > 10) {
      reasons.push('Rain increasing demand');
    }

    // Check for time patterns
    if (zone.factors.baseline > 30) {
      const hour = new Date().getHours();
      if (hour >= 7 && hour <= 9) {
        reasons.push('Morning commute peak');
      } else if (hour >= 17 && hour <= 19) {
        reasons.push('Evening commute peak');
      } else if (hour >= 21 || hour <= 2) {
        reasons.push('Late night surge');
      }
    }

    if (reasons.length === 0) {
      return `High demand area (Score: ${zone.score})`;
    }

    return reasons.join(' | ');
  }

  generateForecast(hours: number = 4): any[] {
    const forecast = [];
    const now = new Date();

    for (let i = 1; i <= hours; i++) {
      const futureTime = new Date(now.getTime() + i * 60 * 60 * 1000);
      const scores = this.calculateZoneScores(futureTime);
      const topZones = scores.slice(0, 3);

      forecast.push({
        time: futureTime.toISOString(),
        hour: futureTime.getHours(),
        topZones: topZones.map(z => ({
          id: z.id,
          name: z.name,
          score: z.score,
        })),
      });
    }

    return forecast;
  }
}

