import { getMicroZoneById } from '../data/microZones.js';

export interface HotelCheckoutWindow {
  start: string; // ISO
  end: string;   // ISO
  label: string;
  confidence: 'medium';
}

export interface HotelCheckoutAlert {
  id: string;
  message: string;
  recommendedZoneId: string;
  window: HotelCheckoutWindow;
  createdAt: string;
}

/**
 * HotelCheckoutService (no API key required)
 *
 * Heuristic model:
 * - Downtown hotel checkout wave: ~10:30am–12:30pm
 * - Airport hotel / early flight run wave: ~5:00am–8:30am
 *
 * This is consistently useful for drivers because it creates clustered pickup demand
 * with longer average rides (airport runs, luggage trips).
 */
export class HotelCheckoutService {
  private readonly affectedZones: Record<string, number> = {
    downtown_hotel_row_union: 1.0,
    belltown_hotels: 0.85,
    pier66_cruise_terminal: 0.55,
    waterfront_piers: 0.45,
    seatac_airport_hotels: 1.0,
    seatac: 0.5,
  };

  calculateHotelCheckoutImpact(zoneId: string, currentTime: Date): number {
    const scale = this.affectedZones[zoneId];
    if (!scale) return 0;

    const minutes = this.minutesSinceMidnight(currentTime);
    const day = currentTime.getDay();
    const isWeekend = day === 0 || day === 6;

    // Downtown checkout wave: 10:30–12:30
    const downtownWave = this.inMinutesRange(minutes, 10 * 60 + 30, 12 * 60 + 30);
    // Airport hotel early wave: 5:00–8:30
    const airportWave = this.inMinutesRange(minutes, 5 * 60, 8 * 60 + 30);

    let boost = 0;

    if (downtownWave) {
      // Stronger in hotel-heavy zones, mild spillover to nearby waterfront/cruise
      boost += 14 * scale;
    }

    if (airportWave) {
      // Focused on airport hotel cluster
      // Use a lower base so we don't swamp flight signals
      boost += 10 * scale;
    }

    if (boost > 0 && isWeekend) {
      // Weekend leisure travel slightly increases the checkout wave
      boost += 2 * scale;
    }

    return Math.round(boost);
  }

  getHotelCheckoutIntelligence(currentTime: Date): {
    windows: HotelCheckoutWindow[];
    alerts: HotelCheckoutAlert[];
    recommendedZones: Array<{ zoneId: string; name: string; reason: string }>;
    note: string;
  } {
    const windows = this.getWindowsForDay(currentTime);

    const alerts: HotelCheckoutAlert[] = [];
    const alertWindowMinutes = 45;
    for (const w of windows) {
      const minutesUntil = (new Date(w.start).getTime() - currentTime.getTime()) / (1000 * 60);
      const minutesUntilEnd = (new Date(w.end).getTime() - currentTime.getTime()) / (1000 * 60);
      const inWindow = minutesUntil <= 0 && minutesUntilEnd > 0;
      const startingSoon = minutesUntil >= 0 && minutesUntil <= alertWindowMinutes;

      if (inWindow || startingSoon) {
        const label = w.label.toLowerCase().includes('airport')
          ? 'Airport hotel wave'
          : 'Downtown hotel checkout wave';

        const recommendedZoneId = w.label.toLowerCase().includes('airport')
          ? 'seatac_airport_hotels'
          : 'downtown_hotel_row_union';

        alerts.push({
          id: `hotel-${new Date(w.start).getTime()}`,
          message: `${label} ${inWindow ? 'is active now' : 'starts soon'}. Expect clustered luggage pickups + longer rides.`,
          recommendedZoneId,
          window: w,
          createdAt: currentTime.toISOString(),
        });
      }
    }

    const downtownName = getMicroZoneById('downtown_hotel_row_union')?.name || 'Downtown Hotel Row';
    const belltownName = getMicroZoneById('belltown_hotels')?.name || 'Belltown Hotels';
    const airportHotelsName = getMicroZoneById('seatac_airport_hotels')?.name || 'SeaTac Airport Hotels';

    return {
      windows,
      alerts: alerts.slice(0, 3),
      recommendedZones: [
        { zoneId: 'downtown_hotel_row_union', name: downtownName, reason: 'Primary downtown checkout cluster' },
        { zoneId: 'belltown_hotels', name: belltownName, reason: 'Secondary hotel cluster + spillover pickups' },
        { zoneId: 'seatac_airport_hotels', name: airportHotelsName, reason: 'Early airport runs + luggage pickups' },
      ],
      note: 'Heuristic-only. Real checkout timing varies by hotel; use as a repeatable daily pattern signal.',
    };
  }

  private getWindowsForDay(currentTime: Date): HotelCheckoutWindow[] {
    const base = new Date(currentTime);
    base.setSeconds(0, 0);

    // Today at 10:30–12:30
    const downtownStart = this.atLocalTime(base, 10, 30);
    const downtownEnd = this.atLocalTime(base, 12, 30);

    // Today at 05:00–08:30
    const airportStart = this.atLocalTime(base, 5, 0);
    const airportEnd = this.atLocalTime(base, 8, 30);

    return [
      {
        start: airportStart.toISOString(),
        end: airportEnd.toISOString(),
        label: 'Airport hotels → airport runs (estimated)',
        confidence: 'medium',
      },
      {
        start: downtownStart.toISOString(),
        end: downtownEnd.toISOString(),
        label: 'Downtown hotel checkout wave (estimated)',
        confidence: 'medium',
      },
    ];
  }

  private minutesSinceMidnight(d: Date): number {
    return d.getHours() * 60 + d.getMinutes();
  }

  private inMinutesRange(value: number, start: number, end: number): boolean {
    return value >= start && value <= end;
  }

  private atLocalTime(baseDay: Date, hour: number, minute: number): Date {
    const d = new Date(baseDay);
    d.setHours(hour, minute, 0, 0);
    return d;
  }
}




