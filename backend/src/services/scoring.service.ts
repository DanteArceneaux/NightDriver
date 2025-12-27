import { zones as legacyZones } from '../data/zones.js';
import { getBaselineScore } from '../data/timePatterns.js';
import type { Zone } from '../types/index.js';
import { ZoneScore, TopPick, Event, WeatherConditions, FlightArrival } from '../types/index.js';
import { CruiseShipsService } from './cruiseShips.service.js';
import { ConventionsService } from './conventions.service.js';
import { WeatherSurgeService } from './weatherSurge.service.js';
import { getBarCloseSurgeImpact } from '../data/barCloseTimes.js';
import { getDeadZonePenalty } from '../data/deadZones.js';
import { microZones, type MicroZone } from '../data/microZones.js';
import { FerriesService } from './ferries.service.js';

export class ScoringService {
  private cruiseShipsService: CruiseShipsService;
  private conventionsService: ConventionsService;
  private weatherSurgeService: WeatherSurgeService;
  private ferriesService: FerriesService;

  /**
   * Micro-zone metadata map (fast lookup)
   */
  private microZoneById: Map<string, MicroZone>;

  /**
   * Zones used for scoring:
   * - Micro-zones for Seattle core (high precision)
   * - Legacy zones for suburbs (kept for coverage)
   */
  private scoringZones: Zone[];

  constructor() {
    this.cruiseShipsService = new CruiseShipsService();
    this.conventionsService = new ConventionsService();
    this.weatherSurgeService = new WeatherSurgeService();
    this.ferriesService = new FerriesService();

    this.microZoneById = new Map(microZones.map(z => [z.id, z]));
    this.scoringZones = this.buildScoringZones();
  }

  private buildScoringZones(): Zone[] {
    // Any legacy zone whose ID exists in microZones is replaced (avoid duplicates).
    // This keeps the system future-proof as we add more micro-zones over time.
    const replacedLegacyZoneIds = new Set<string>(microZones.map(z => z.id));

    const legacyOnlyZones = legacyZones.filter(z => !replacedLegacyZoneIds.has(z.id));

    // Micro-zones first so they show up at top of any non-sorted lists
    return [...microZones, ...legacyOnlyZones];
  }

  calculateZoneScores(
    currentTime: Date,
    events: Event[] = [],
    weather: WeatherConditions | null = null,
    flights: FlightArrival[] = [],
    trafficData: Map<string, number> = new Map()
  ): ZoneScore[] {
    const scores: ZoneScore[] = this.scoringZones.map(zone => {
      const dayOfWeek = currentTime.getDay();
      const hour = currentTime.getHours();

      // Get baseline score from either micro-zone peak hours or legacy time patterns
      const baseline = this.getBaselineForZone(zone.id, dayOfWeek, hour);

      // Calculate event boost
      const eventBoost = this.calculateEventBoost(zone.id, events, currentTime);

      // Calculate weather boost
      const weatherBoost = this.calculateWeatherBoost(weather);

      // Calculate flight boost (only for SeaTac)
      const flightBoost = this.calculateFlightBoost(zone.id, flights, currentTime);

      // Calculate traffic boost
      const trafficBoost = this.calculateTrafficBoost(zone.id, trafficData);

      // 🚢 NEW: Calculate cruise ship impact
      const cruiseBoost = this.cruiseShipsService.calculateCruiseSurgeImpact(zone.id, currentTime);

      // 🏢 NEW: Calculate convention center impact
      const conventionBoost = this.conventionsService.calculateConventionImpact(zone.id, currentTime);

      // 🍺 NEW: Calculate bar close surge (micro-zones use metadata; legacy zones use macro mapping)
      const microMeta = this.microZoneById.get(zone.id);
      const barCloseBoost = microMeta?.barCloseSurge
        ? this.getMicroBarCloseBoost(microMeta.barCloseSurge, currentTime)
        : getBarCloseSurgeImpact(zone.id, currentTime);

      // ⚠️ NEW: Apply dead zone penalty
      const deadZonePenalty = getDeadZonePenalty(zone.id, currentTime);

      // ⛴️ NEW: Ferry wave impact (heuristic)
      const ferryBoost = this.ferriesService.calculateFerryImpact(zone.id, currentTime);

      // 🌧️ NEW: Apply weather surge multiplier
      const weatherMultiplier = weather ? this.weatherSurgeService.calculateSurgeMultiplier(weather) : 1.0;

      // 🎯 Micro-zone modifiers: value, competition, rider quality
      const microZoneMetaBoost = microMeta ? this.getMicroZoneMetaBoost(microMeta) : 0;

      // Total score (apply multiplier, then cap at 100)
      let totalScore = baseline + eventBoost + weatherBoost + flightBoost + trafficBoost + 
                       cruiseBoost + conventionBoost + barCloseBoost + deadZonePenalty + ferryBoost +
                       microZoneMetaBoost;
      
      // Apply weather multiplier
      totalScore = totalScore * weatherMultiplier;
      
      // Cap at 100
      totalScore = Math.min(100, Math.max(0, totalScore));

      const finalScore = Math.round(totalScore);
      const estimatedEarnings = this.calculateEstimatedEarnings(finalScore, hour, dayOfWeek, zone.id);

      return {
        id: zone.id,
        name: zone.name,
        score: finalScore,
        trend: 'stable' as const, // TODO: Calculate based on historical data
        estimatedHourlyRate: estimatedEarnings,
        factors: {
          baseline: Math.round(baseline),
          events: Math.round(eventBoost),
          weather: Math.round(weatherBoost * weatherMultiplier),
          flights: Math.round(flightBoost),
          traffic: Math.round(trafficBoost),
          cruise: Math.round(cruiseBoost),
          conventions: Math.round(conventionBoost),
          barClose: Math.round(barCloseBoost),
          deadZone: Math.round(deadZonePenalty),
          microMeta: Math.round(microZoneMetaBoost),
          ferries: Math.round(ferryBoost),
        },
        coordinates: zone.coordinates,
      };
    });

    // Sort by score descending
    return scores.sort((a, b) => b.score - a.score);
  }

  /**
   * Baseline demand:
   * - Micro-zones: driven by their defined peak hours (more granular than legacy patterns)
   * - Legacy zones: use existing timePatterns model
   */
  private getBaselineForZone(zoneId: string, dayOfWeek: number, hour: number): number {
    const micro = this.microZoneById.get(zoneId);
    if (!micro) {
      return getBaselineScore(zoneId, dayOfWeek, hour);
    }

    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
    const peaks = isWeekend ? micro.peakHours.weekend : micro.peakHours.weekday;

    // Event-dependent zones (stadiums/arenas) use low baseline and rely on events boost
    if (!peaks || peaks.length === 0) return 10;

    // Exact peak hour
    if (peaks.includes(hour)) return 35;

    // Near peak (within 1 hour)
    const nearPeak = peaks.some(h => this.hourDistance(h, hour) <= 1);
    if (nearPeak) return 22;

    // Slight bump for high-value pickup zones during typical hotel/airport cycles
    if (micro.averageRideValue >= 25 && (hour >= 5 && hour <= 8)) return 18;
    if (micro.averageRideValue >= 25 && (hour >= 16 && hour <= 19)) return 18;

    return 10;
  }

  private hourDistance(a: number, b: number): number {
    const diff = Math.abs(a - b);
    return Math.min(diff, 24 - diff);
  }

  /**
   * Micro-zone metadata boost:
   * - Favor zones with higher average ride value
   * - Favor zones with lower competitor density (less competition = higher $/hr)
   * - Penalize zones with poor rider quality (safety/ratings/time cost)
   */
  private getMicroZoneMetaBoost(micro: MicroZone): number {
    let boost = 0;

    // Ride value contribution (conservative)
    if (micro.averageRideValue >= 30) boost += 6;
    else if (micro.averageRideValue >= 24) boost += 4;
    else if (micro.averageRideValue >= 18) boost += 2;
    else if (micro.averageRideValue <= 12) boost -= 2;

    // Competition (lower is better)
    const competition = micro.competitorDensity;
    if (competition === 'very_low') boost += 4;
    else if (competition === 'low') boost += 2;
    else if (competition === 'high') boost -= 2;
    else if (competition === 'very_high') boost -= 4;

    // Rider quality (avoid problem zones late-night unless they truly surge)
    const rq = micro.riderQuality;
    if (rq === 'excellent') boost += 2;
    else if (rq === 'medium') boost -= 1;
    else if (rq === 'poor') boost -= 3;

    return boost;
  }

  /**
   * Bar close surge boost for micro-zones that explicitly opt-in with `barCloseSurge`.
   * Window: ~1:45am to ~2:30am local time.\n   */
  private getMicroBarCloseBoost(intensity: NonNullable<MicroZone['barCloseSurge']>, currentTime: Date): number {
    const hour = currentTime.getHours();
    const minute = currentTime.getMinutes();

    // Minutes from midnight; adjust post-midnight times into next-day range for easy comparison
    let t = hour * 60 + minute;
    if (t < 3 * 60) t += 24 * 60;

    // 1:45am - 2:30am window (in adjusted space)
    const windowStart = (24 + 1) * 60 + 45;
    const windowEnd = (24 + 2) * 60 + 30;

    if (t < windowStart || t > windowEnd) return 0;

    // Conservative boosts so we don't blow past 100 when combined with events/weather
    const boosts: Record<NonNullable<MicroZone['barCloseSurge']>, number> = {
      low: 10,
      medium: 18,
      high: 28,
      extreme: 40,
    };

    return boosts[intensity];
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

  private calculateEstimatedEarnings(score: number, hour: number, dayOfWeek: number, zoneId?: string): number {
    // Base Seattle Uber rate (simplified model)
    let baseRate = 18; // $18/hr baseline

    // Micro-zone adjustment: average ride value influences hourly potential
    // This is intentionally conservative so we don't wildly inflate estimates.
    if (zoneId) {
      const micro = this.microZoneById.get(zoneId);
      if (micro) {
        if (micro.averageRideValue >= 28) baseRate += 4; // airports/hotels
        else if (micro.averageRideValue >= 20) baseRate += 2; // high value zones
        else if (micro.averageRideValue <= 12) baseRate -= 1; // short/low value rides
      }
    }

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

