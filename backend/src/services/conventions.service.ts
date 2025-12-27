/**
 * Convention Center Events Service
 * 
 * Washington State Convention Center (WSCC) hosts tech conferences,
 * trade shows, and events = business travelers = better tips!
 * 
 * In production, scrape WSCC public calendar or use events API.
 */

export interface Convention {
  name: string;
  venue: 'WSCC' | 'Other';
  startDate: string;
  endDate: string;
  expectedAttendees: number;
  type: 'tech' | 'trade' | 'medical' | 'education' | 'other';
  peakTimes: string[]; // ["08:00-09:00", "17:00-18:00"]
  notes: string;
}

export class ConventionsService {
  // Mock convention schedule (in production, scrape WSCC calendar)
  private getMockConventions(): Convention[] {
    const now = new Date();
    const conventions: Convention[] = [];

    // Check if today is a weekday
    const dayOfWeek = now.getDay();
    const isWeekday = dayOfWeek >= 1 && dayOfWeek <= 5;

    if (!isWeekday) return [];

    // Sample conventions (rotate based on day)
    const sampleConventions = [
      {
        name: 'Seattle Tech Summit',
        type: 'tech' as const,
        expectedAttendees: 5000,
        notes: 'Tech professionals. Airport rides, Bellevue hotels.',
      },
      {
        name: 'Pacific Northwest Medical Conference',
        type: 'medical' as const,
        expectedAttendees: 3000,
        notes: 'Doctors/nurses. Professional, tip well.',
      },
      {
        name: 'Northwest Trade Show',
        type: 'trade' as const,
        expectedAttendees: 8000,
        notes: 'Large event. Morning/evening surges.',
      },
    ];

    // Simulate a convention this week
    if (dayOfWeek <= 3) {
      const convention = sampleConventions[dayOfWeek % sampleConventions.length];
      
      const startDate = new Date(now);
      startDate.setDate(now.getDate() - dayOfWeek + 1); // Monday
      startDate.setHours(8, 0, 0, 0);

      const endDate = new Date(startDate);
      endDate.setDate(startDate.getDate() + 2); // Wednesday
      endDate.setHours(17, 0, 0, 0);

      conventions.push({
        ...convention,
        venue: 'WSCC',
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        peakTimes: ['08:00-09:00', '12:00-13:00', '17:00-18:00'],
      });
    }

    return conventions;
  }

  /**
   * Get active conventions today
   */
  async getActiveConventions(): Promise<Convention[]> {
    try {
      // In production: scrape WSCC calendar or call API
      return this.getMockConventions();
    } catch (error) {
      console.error('Error fetching conventions:', error);
      return [];
    }
  }

  /**
   * Check if we're in a peak convention time
   */
  isConventionPeakTime(currentTime: Date = new Date()): boolean {
    const conventions = this.getMockConventions();
    if (conventions.length === 0) return false;

    const hour = currentTime.getHours();
    const minute = currentTime.getMinutes();
    const timeStr = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;

    for (const convention of conventions) {
      const now = currentTime.getTime();
      const start = new Date(convention.startDate).getTime();
      const end = new Date(convention.endDate).getTime();

      if (now >= start && now <= end) {
        // Check if current time is in peak times
        for (const peakTime of convention.peakTimes) {
          const [startTime, endTime] = peakTime.split('-');
          if (timeStr >= startTime && timeStr <= endTime) {
            return true;
          }
        }
      }
    }

    return false;
  }

  /**
   * Calculate convention surge impact
   */
  calculateConventionImpact(zoneId: string, currentTime: Date): number {
    const conventions = this.getMockConventions();
    if (conventions.length === 0) return 0;

    let impact = 0;

    for (const convention of conventions) {
      const now = currentTime.getTime();
      const start = new Date(convention.startDate).getTime();
      const end = new Date(convention.endDate).getTime();

      if (now >= start && now <= end) {
        // Downtown zones benefit most
        if (
          zoneId === 'convention_center' ||
          zoneId === 'financial_district' ||
          zoneId === 'retail_core' ||
          zoneId === 'downtown_hotel_row_union'
        ) {
          impact += this.isConventionPeakTime(currentTime) ? 25 : 12;
        } else if (zoneId === 'capitol_hill_madison') {
          // Nearby overflow (people going to dinner/drinks after sessions)
          impact += this.isConventionPeakTime(currentTime) ? 10 : 5;
        }
        // Airport benefits during arrival/departure
        else if (zoneId === 'seatac') {
          const hour = currentTime.getHours();
          if (hour >= 7 && hour <= 9) impact += 15; // Morning arrivals
          if (hour >= 16 && hour <= 19) impact += 15; // Evening departures
        }
        // Hotels benefit
        else if (zoneId === 'belltown_hotels' || zoneId === 'pier66_cruise_terminal' || zoneId === 'waterfront_piers') {
          impact += 8;
        }
      }
    }

    return impact;
  }

  /**
   * Get convention alerts
   */
  async getConventionAlerts(): Promise<string[]> {
    const conventions = await this.getActiveConventions();
    const alerts: string[] = [];
    const now = new Date();

    for (const convention of conventions) {
      const start = new Date(convention.startDate);
      const end = new Date(convention.endDate);

      if (now >= start && now <= end) {
        if (this.isConventionPeakTime(now)) {
          alerts.push(
            `🏢 ${convention.name} peak time! Position at Convention Center / Downtown Hotel Row for business travelers.`
          );
        }
      }
    }

    return alerts;
  }
}

