import { FlightArrival } from '../types/index.js';

/**
 * Airport Queue Intelligence
 * 
 * SEA-TAC rideshare queue can be 15-90 minutes.
 * Smart drivers skip the queue when it's long and go to better zones.
 * 
 * Queue estimation based on:
 * - Number of recent arrivals
 * - Time of day
 * - International vs domestic
 * - Historical patterns
 */

export interface QueueEstimate {
  estimatedWaitMinutes: number;
  confidence: 'low' | 'medium' | 'high';
  recommendation: 'skip' | 'wait' | 'ideal';
  reason: string;
  alternativeZones?: string[];
}

export interface AirportStrategy {
  action: 'enter_queue' | 'skip_queue' | 'position_nearby';
  reasoning: string;
  estimatedEarnings: {
    airportQueue: number;  // $/hr if you wait in queue
    alternative: number;   // $/hr if you skip to other zones
  };
}

export class AirportQueueService {
  // Historical queue patterns (based on real SEA-TAC data)
  private readonly QUEUE_PATTERNS = {
    // Time of day multipliers
    hourly: {
      0: 0.3, 1: 0.2, 2: 0.2, 3: 0.2, 4: 0.3, 5: 0.5,
      6: 0.7, 7: 0.9, 8: 1.0, 9: 0.8, 10: 0.7, 11: 0.6,
      12: 0.7, 13: 0.8, 14: 0.9, 15: 1.0, 16: 1.1, 17: 1.2,
      18: 1.1, 19: 1.0, 20: 0.9, 21: 0.8, 22: 0.7, 23: 0.5,
    },
    // Day of week multipliers (Sunday = 0)
    daily: {
      0: 1.3, // Sunday - travel day
      1: 0.9, // Monday
      2: 0.7, // Tuesday
      3: 0.7, // Wednesday
      4: 0.9, // Thursday
      5: 1.2, // Friday - travel day
      6: 1.1, // Saturday
    },
  };

  /**
   * Estimate current queue wait time
   */
  estimateQueueWait(
    recentFlights: FlightArrival[],
    currentTime: Date = new Date()
  ): QueueEstimate {
    const hour = currentTime.getHours();
    const dayOfWeek = currentTime.getDay();

    // Base estimate from flight volume
    const flightsInLastHour = recentFlights.filter(f => {
      const arrivalTime = new Date(f.arrivalTime);
      const minutesAgo = (currentTime.getTime() - arrivalTime.getTime()) / (1000 * 60);
      return minutesAgo >= 0 && minutesAgo <= 60;
    });

    // Each flight adds ~5 minutes to queue (rough estimate)
    let baseWait = flightsInLastHour.length * 5;

    // Apply time of day multiplier
    const hourMultiplier = this.QUEUE_PATTERNS.hourly[hour as keyof typeof this.QUEUE_PATTERNS.hourly] || 0.8;
    const dayMultiplier = this.QUEUE_PATTERNS.daily[dayOfWeek as keyof typeof this.QUEUE_PATTERNS.daily] || 1.0;

    let estimatedWait = baseWait * hourMultiplier * dayMultiplier;

    // International flights = longer (customs)
    const internationalFlights = flightsInLastHour.filter(f => 
      f.terminal === 'International' || !f.origin.match(/^[A-Z]{3}$/)
    );
    if (internationalFlights.length > 0) {
      estimatedWait += internationalFlights.length * 8; // +8 min per intl flight
    }

    // Cap at reasonable bounds
    estimatedWait = Math.max(10, Math.min(90, estimatedWait));

    // Determine confidence based on data quality
    let confidence: QueueEstimate['confidence'] = 'medium';
    if (flightsInLastHour.length >= 5) {
      confidence = 'high';
    } else if (flightsInLastHour.length <= 2) {
      confidence = 'low';
    }

    // Generate recommendation
    let recommendation: QueueEstimate['recommendation'];
    let reason: string;
    let alternativeZones: string[] | undefined;

    if (estimatedWait < 20) {
      recommendation = 'ideal';
      reason = `Short queue (~${Math.round(estimatedWait)} min). Good time to enter.`;
    } else if (estimatedWait < 40) {
      recommendation = 'wait';
      reason = `Moderate queue (~${Math.round(estimatedWait)} min). Consider entering if no better options.`;
      alternativeZones = ['downtown', 'capitol_hill', 'u_district'];
    } else {
      recommendation = 'skip';
      reason = `Long queue (~${Math.round(estimatedWait)} min). Skip to high-demand zones instead.`;
      alternativeZones = ['downtown', 'capitol_hill', 'belltown', 'queen_anne'];
    }

    return {
      estimatedWaitMinutes: Math.round(estimatedWait),
      confidence,
      recommendation,
      reason,
      alternativeZones,
    };
  }

  /**
   * Get strategic recommendation: queue vs other zones
   */
  getStrategy(
    queueEstimate: QueueEstimate,
    currentZoneScores: Map<string, number>
  ): AirportStrategy {
    const queueWait = queueEstimate.estimatedWaitMinutes;

    // Average airport ride = $35, but you wait in queue
    const airportRideValue = 35;
    const airportHourlyIfQueued = (60 / (queueWait + 25)) * airportRideValue; // +25 min for ride

    // Alternative zones - get top zone score
    const topAlternativeScore = Math.max(...Array.from(currentZoneScores.values()));
    const alternativeHourly = (topAlternativeScore / 100) * 40; // Rough conversion

    if (queueWait < 25) {
      return {
        action: 'enter_queue',
        reasoning: `Queue is short (${queueWait} min). Airport rides worth ~$${Math.round(airportHourlyIfQueued)}/hr.`,
        estimatedEarnings: {
          airportQueue: Math.round(airportHourlyIfQueued),
          alternative: Math.round(alternativeHourly),
        },
      };
    } else if (queueWait < 45 && airportHourlyIfQueued > alternativeHourly) {
      return {
        action: 'enter_queue',
        reasoning: `Queue is moderate but still better than alternatives. Est. $${Math.round(airportHourlyIfQueued)}/hr vs $${Math.round(alternativeHourly)}/hr elsewhere.`,
        estimatedEarnings: {
          airportQueue: Math.round(airportHourlyIfQueued),
          alternative: Math.round(alternativeHourly),
        },
      };
    } else if (queueWait >= 45) {
      const bestZone = Array.from(currentZoneScores.entries())
        .sort((a, b) => b[1] - a[1])[0];
      
      return {
        action: 'skip_queue',
        reasoning: `Queue too long (${queueWait} min = $${Math.round(airportHourlyIfQueued)}/hr). Head to ${bestZone[0]} instead ($${Math.round(alternativeHourly)}/hr).`,
        estimatedEarnings: {
          airportQueue: Math.round(airportHourlyIfQueued),
          alternative: Math.round(alternativeHourly),
        },
      };
    } else {
      return {
        action: 'position_nearby',
        reasoning: `Queue is borderline (${queueWait} min). Position nearby and monitor.`,
        estimatedEarnings: {
          airportQueue: Math.round(airportHourlyIfQueued),
          alternative: Math.round(alternativeHourly),
        },
      };
    }
  }

  /**
   * Predict queue trend for next hour
   */
  predictQueueTrend(upcomingFlights: FlightArrival[], currentTime: Date): {
    trend: 'improving' | 'worsening' | 'stable';
    message: string;
  } {
    const nextHourFlights = upcomingFlights.filter(f => {
      const arrivalTime = new Date(f.arrivalTime);
      const minutesAway = (arrivalTime.getTime() - currentTime.getTime()) / (1000 * 60);
      return minutesAway > 0 && minutesAway <= 60;
    });

    const followingHourFlights = upcomingFlights.filter(f => {
      const arrivalTime = new Date(f.arrivalTime);
      const minutesAway = (arrivalTime.getTime() - currentTime.getTime()) / (1000 * 60);
      return minutesAway > 60 && minutesAway <= 120;
    });

    if (nextHourFlights.length > followingHourFlights.length + 3) {
      return {
        trend: 'worsening',
        message: `Queue will get longer. ${nextHourFlights.length} flights arriving next hour.`,
      };
    } else if (followingHourFlights.length > nextHourFlights.length + 3) {
      return {
        trend: 'improving',
        message: `Queue will improve. Only ${nextHourFlights.length} flights next hour, then ${followingHourFlights.length} more.`,
      };
    } else {
      return {
        trend: 'stable',
        message: `Queue will remain steady. ${nextHourFlights.length} flights/hour.`,
      };
    }
  }
}





