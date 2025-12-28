/**
 * Convention Center Events Service
 * 
 * Washington State Convention Center (WSCC) hosts tech conferences,
 * trade shows, and events = business travelers = better tips!
 * 
 * In production, scrape WSCC public calendar or use events API.
 */

import { WSCCConventionsService } from './wsccConventions.service.js';

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
  private wsccService: WSCCConventionsService;

  private readonly CONVENTION_PEAK_IMPACT = 25;
  private readonly CONVENTION_OFF_PEAK_IMPACT = 12;
  private readonly CAPITOL_HILL_PEAK_IMPACT = 10;
  private readonly CAPITOL_HILL_OFF_PEAK_IMPACT = 5;
  private readonly SEATAC_MORNING_IMPACT = 15;
  private readonly SEATAC_EVENING_IMPACT = 15;
  private readonly HOTEL_OVERFLOW_IMPACT = 8;

  private readonly WSCC_VENUE_KEYWORD = 'WSCC';
  private readonly CONVENTION_VENUE_KEYWORD = 'Convention';
  private readonly DEFAULT_EXPECTED_ATTENDEES = 5000;

  constructor() {
    this.wsccService = new WSCCConventionsService();
  }
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
  async getActiveConventions(currentTime: Date = new Date()): Promise<Convention[]> {
    try {
      // Try to use real WSCC service first
      const wsccConventions = await this.wsccService.getActiveConventions(currentTime);
      if (wsccConventions.length > 0) {
        // Map to our Convention interface
        return wsccConventions.map(c => ({
          name: c.name,
          venue: c.venue.includes('WSCC') || c.venue.includes('Convention') ? 'WSCC' as const : 'Other' as const,
          startDate: c.startDate,
          endDate: c.endDate,
          expectedAttendees: c.expectedAttendance || this.DEFAULT_EXPECTED_ATTENDEES,
          type: (c.category?.toLowerCase() === 'gaming' ? 'tech' : 
                 c.category?.toLowerCase() === 'entertainment' ? 'other' :
                 c.category?.toLowerCase() === 'auto' ? 'trade' : 'other') as any,
          peakTimes: ['08:00-09:00', '12:00-13:00', '17:00-18:00'],
          notes: c.description || '',
        }));
      }
      
      // Fallback to mock data
      return this.getMockConventions();
    } catch (error) {
      console.error('Error fetching conventions:', error);
      return this.getMockConventions();
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
          impact += this.isConventionPeakTime(currentTime) ? this.CONVENTION_PEAK_IMPACT : this.CONVENTION_OFF_PEAK_IMPACT;
        } else if (zoneId === 'capitol_hill_madison') {
          // Nearby overflow (people going to dinner/drinks after sessions)
          impact += this.isConventionPeakTime(currentTime) ? this.CAPITOL_HILL_PEAK_IMPACT : this.CAPITOL_HILL_OFF_PEAK_IMPACT;
        }
        // Airport benefits during arrival/departure
        else if (zoneId === 'seatac') {
          const hour = currentTime.getHours();
          if (hour >= 7 && hour <= 9) impact += this.SEATAC_MORNING_IMPACT; // Morning arrivals
          if (hour >= 16 && hour <= 19) impact += this.SEATAC_EVENING_IMPACT; // Evening departures
        }
        // Hotels benefit
        else if (zoneId === 'belltown_hotels' || zoneId === 'pier66_cruise_terminal' || zoneId === 'waterfront_piers') {
          impact += this.HOTEL_OVERFLOW_IMPACT;
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

