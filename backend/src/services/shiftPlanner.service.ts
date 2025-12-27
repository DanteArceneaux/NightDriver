import type { Coordinates } from '../types/index.js';

export interface ShiftPlanSegment {
  startTime: string;
  endTime: string;
  zoneId: string;
  zoneName: string;
  coordinates: Coordinates;
  expectedScore: number;
  activity: 'drive' | 'charge' | 'break';
  reason: string;
  estimatedEarnings?: number;
}

export interface ShiftPlan {
  startTime: string;
  endTime: string;
  totalHours: number;
  segments: ShiftPlanSegment[];
  estimatedTotalEarnings: number;
  chargeStops: number;
  breakTime: number;
}

export interface ShiftPlannerInput {
  startTime: Date;
  endTime: Date;
  startingLocation: Coordinates;
  vehicleType?: 'ev' | 'gas';
  currentBatteryPercent?: number; // For EVs
  goals?: Array<'max_earnings' | 'work_life_balance' | 'avoid_long_drives'>;
}

/**
 * AI Shift Planner - optimizes your shift routing for max earnings
 */
export class ShiftPlannerService {
  /**
   * Generate optimal shift plan
   */
  async planShift(input: ShiftPlannerInput): Promise<ShiftPlan> {
    const segments: ShiftPlanSegment[] = [];
    let currentTime = new Date(input.startTime);
    const endTime = new Date(input.endTime);
    const totalHours = (endTime.getTime() - currentTime.getTime()) / (1000 * 60 * 60);

    let currentBattery = input.currentBatteryPercent || 100;
    const isEV = input.vehicleType === 'ev';

    // Determine segment durations (typically 1.5-2 hour blocks)
    const segmentDurationMinutes = 90;

    while (currentTime < endTime) {
      const remainingMinutes = (endTime.getTime() - currentTime.getTime()) / (1000 * 60);
      if (remainingMinutes < 30) break; // Don't plan < 30 min segments

      const hour = currentTime.getHours();
      const dayOfWeek = currentTime.getDay();

      // Check if we need a break (every 4 hours)
      const hoursWorked = (currentTime.getTime() - input.startTime.getTime()) / (1000 * 60 * 60);
      if (hoursWorked > 0 && hoursWorked % 4 < 0.1) {
        const breakSegment = this.createBreakSegment(currentTime);
        segments.push(breakSegment);
        currentTime = new Date(breakSegment.endTime);
        continue;
      }

      // Check if EV needs charging
      if (isEV && currentBattery < 20) {
        const chargeSegment = this.createChargeSegment(currentTime, segments[segments.length - 1]?.coordinates || input.startingLocation);
        segments.push(chargeSegment);
        currentTime = new Date(chargeSegment.endTime);
        currentBattery = 80; // Assume charge to 80%
        continue;
      }

      // Find optimal zone for this time slot
      const optimalZone = this.findOptimalZone(hour, dayOfWeek, currentTime);
      
      const segmentEnd = new Date(currentTime.getTime() + Math.min(segmentDurationMinutes, remainingMinutes) * 60 * 1000);
      
      const segment: ShiftPlanSegment = {
        startTime: currentTime.toISOString(),
        endTime: segmentEnd.toISOString(),
        zoneId: optimalZone.id,
        zoneName: optimalZone.name,
        coordinates: optimalZone.coordinates,
        expectedScore: optimalZone.score,
        activity: 'drive',
        reason: optimalZone.reason,
        estimatedEarnings: this.estimateEarningsForSegment(optimalZone.score, segmentDurationMinutes),
      };

      segments.push(segment);
      currentTime = segmentEnd;

      // Deduct battery for driving (rough estimate: 1% per 3 miles, assume 15 mph avg)
      if (isEV) {
        const miles = (segmentDurationMinutes / 60) * 15;
        currentBattery -= miles / 3;
      }
    }

    const estimatedTotalEarnings = segments
      .filter(s => s.activity === 'drive')
      .reduce((sum, s) => sum + (s.estimatedEarnings || 0), 0);

    return {
      startTime: input.startTime.toISOString(),
      endTime: input.endTime.toISOString(),
      totalHours,
      segments,
      estimatedTotalEarnings,
      chargeStops: segments.filter(s => s.activity === 'charge').length,
      breakTime: segments.filter(s => s.activity === 'break').reduce((sum, s) => {
        const start = new Date(s.startTime);
        const end = new Date(s.endTime);
        return sum + (end.getTime() - start.getTime()) / (1000 * 60);
      }, 0),
    };
  }

  /**
   * Find the optimal zone for a specific time
   */
  private findOptimalZone(
    hour: number,
    _dayOfWeek: number,
    _currentTime: Date
  ): { id: string; name: string; coordinates: Coordinates; score: number; reason: string } {

    // Time-based zone prioritization
    // Morning rush (7am-9am)
    if (hour >= 7 && hour <= 9) {
      return {
        id: 'seatac',
        name: 'SeaTac Airport',
        coordinates: { lat: 47.4502, lng: -122.3088 },
        score: 85,
        reason: 'Morning flight arrivals, high demand',
      };
    }

    // Lunch (11am-1pm)
    if (hour >= 11 && hour <= 13) {
      return {
        id: 'retail_core',
        name: 'Downtown Retail Core',
        coordinates: { lat: 47.6101, lng: -122.3351 },
        score: 75,
        reason: 'Lunch crowd, office workers',
      };
    }

    // Evening rush (5pm-7pm)
    if (hour >= 17 && hour <= 19) {
      return {
        id: 'slu_amazon',
        name: 'South Lake Union',
        coordinates: { lat: 47.6264, lng: -122.3369 },
        score: 88,
        reason: 'Tech workers leaving office, peak surge',
      };
    }

    // Dinner time (7pm-9pm)
    if (hour >= 19 && hour <= 21) {
      return {
        id: 'capitol_hill_pike_pine',
        name: 'Capitol Hill Pike/Pine',
        coordinates: { lat: 47.6134, lng: -122.3200 },
        score: 80,
        reason: 'Dinner reservations, bar pre-game',
      };
    }

    // Late night (10pm-2am)
    if (hour >= 22 || hour <= 2) {
      if (hour >= 1 && hour <= 2) {
        // Bar close surge
        return {
          id: 'capitol_hill_pike_pine',
          name: 'Capitol Hill Pike/Pine',
          coordinates: { lat: 47.6134, lng: -122.3200 },
          score: 95,
          reason: 'BAR CLOSE SURGE - position now!',
        };
      }
      return {
        id: 'belltown_bars',
        name: 'Belltown Bars',
        coordinates: { lat: 47.6138, lng: -122.3450 },
        score: 82,
        reason: 'Nightlife hot spot, steady demand',
      };
    }

    // Default to downtown
    return {
      id: 'retail_core',
      name: 'Downtown',
      coordinates: { lat: 47.6101, lng: -122.3351 },
      score: 65,
      reason: 'Central location, consistent demand',
    };
  }

  /**
   * Create a break segment
   */
  private createBreakSegment(currentTime: Date): ShiftPlanSegment {
    const endTime = new Date(currentTime.getTime() + 15 * 60 * 1000); // 15 min break

    return {
      startTime: currentTime.toISOString(),
      endTime: endTime.toISOString(),
      zoneId: 'break',
      zoneName: 'Break Time',
      coordinates: { lat: 47.6062, lng: -122.3321 }, // Downtown default
      expectedScore: 0,
      activity: 'break',
      reason: '15-minute rest break (required after 4 hours)',
      estimatedEarnings: 0,
    };
  }

  /**
   * Create a charging segment
   */
  private createChargeSegment(currentTime: Date, _nearLocation: Coordinates): ShiftPlanSegment {
    const endTime = new Date(currentTime.getTime() + 20 * 60 * 1000); // 20 min charge

    // Find nearest supercharger (hardcoded for now)
    const supercharger = {
      id: 'tesla-sc-capitol-hill',
      name: 'Tesla Supercharger - Capitol Hill',
      coordinates: { lat: 47.6205, lng: -122.3213 },
    };

    return {
      startTime: currentTime.toISOString(),
      endTime: endTime.toISOString(),
      zoneId: supercharger.id,
      zoneName: supercharger.name,
      coordinates: supercharger.coordinates,
      expectedScore: 0,
      activity: 'charge',
      reason: 'EV charging stop (20% → 80%)',
      estimatedEarnings: 0,
    };
  }

  /**
   * Estimate earnings for a segment based on score and duration
   */
  private estimateEarningsForSegment(score: number, durationMinutes: number): number {
    const baseRate = 18; // $18/hr baseline
    const scoreMultiplier = 0.5 + (score / 100) * 2.0; // 0.5x to 2.5x
    const hourlyRate = baseRate * scoreMultiplier;
    return Math.round((hourlyRate * durationMinutes) / 60);
  }
}

