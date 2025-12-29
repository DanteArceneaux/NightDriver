import { getMicroZoneById } from '../data/microZones.js';

export interface UWClassWaveWindow {
  start: string; // ISO
  end: string;   // ISO
  label: string;
  confidence: 'low' | 'medium';
}

export interface UWClassAlert {
  id: string;
  message: string;
  recommendedZoneId: string;
  window: UWClassWaveWindow;
  createdAt: string;
}

/**
 * UWClassesService (no API key required)
 *
 * Heuristic model:
 * - Weekday class-change waves typically happen multiple times per hour.
 * - For driver demand we care about the short "burst" windows where students
 *   finish a block and request rides (often to Capitol Hill, Downtown, U-Village).
 *
 * We intentionally keep the boost SMALL because campus demand is real but not
 * as strong as stadium + bar close + airport.
 */
export class UWClassesService {
  private readonly affectedZones: Record<string, number> = {
    uw_campus_west: 1.0,
    uw_campus_east: 0.85,
    the_ave: 0.8,
    greek_row: 0.7,
    u_village: 0.6,
  };

  calculateUWClassImpact(zoneId: string, currentTime: Date): number {
    const scale = this.affectedZones[zoneId];
    if (!scale) return 0;

    const day = currentTime.getDay();
    const isWeekday = day >= 1 && day <= 5;
    if (!isWeekday) return 0;

    const hour = currentTime.getHours();
    const minute = currentTime.getMinutes();

    // Campus is mainly active during the day/evening
    if (hour < 7 || hour > 19) return 0;

    // Two common "burst" windows each hour:
    // - ~:18–:35 (classes letting out / next block starting)
    // - ~:48–:05 (wrap across the hour)
    const inWaveA = minute >= 18 && minute <= 35;
    const inWaveB = minute >= 48 || minute <= 5;

    if (!inWaveA && !inWaveB) return 0;

    let base = 4; // REDUCED from 6 → 4 (33% reduction)

    // Stronger at the start/end of the academic day
    // REDUCED from +2 → +1
    if (hour >= 7 && hour <= 9) base += 1;
    if (hour >= 16 && hour <= 18) base += 1;

    return Math.round(base * scale);
  }

  getUWClassesIntelligence(currentTime: Date): {
    windows: UWClassWaveWindow[];
    alerts: UWClassAlert[];
    recommendedZones: Array<{ zoneId: string; name: string; reason: string }>;
    note: string;
  } {
    const windows = this.getNextWaveWindows(currentTime, 3).slice(0, 8);

    const alerts: UWClassAlert[] = [];
    const alertWindowMinutes = 20;
    for (const w of windows) {
      const start = new Date(w.start);
      const end = new Date(w.end);
      const minutesUntil = (start.getTime() - currentTime.getTime()) / (1000 * 60);
      const minutesUntilEnd = (end.getTime() - currentTime.getTime()) / (1000 * 60);
      const inWindow = minutesUntil <= 0 && minutesUntilEnd > 0;
      const startingSoon = minutesUntil >= 0 && minutesUntil <= alertWindowMinutes;

      if (inWindow || startingSoon) {
        alerts.push({
          id: `uw-${start.getTime()}`,
          message: `UW class-change wave ${inWindow ? 'is active now' : 'starts soon'}. Expect short burst of campus pickups.`,
          recommendedZoneId: 'uw_campus_west',
          window: w,
          createdAt: currentTime.toISOString(),
        });
      }
    }

    return {
      windows,
      alerts: alerts.slice(0, 3),
      recommendedZones: [
        { zoneId: 'uw_campus_west', name: getMicroZoneById('uw_campus_west')?.name || 'UW Campus (West)', reason: 'Core campus pickups' },
        { zoneId: 'the_ave', name: getMicroZoneById('the_ave')?.name || 'The Ave', reason: 'Restaurants + student foot traffic' },
        { zoneId: 'u_village', name: getMicroZoneById('u_village')?.name || 'U Village', reason: 'Shopping + short rides' },
      ],
      note: 'Heuristic-only. UW schedules vary by quarter; use as a repeatable weekday burst signal.',
    };
  }

  private getNextWaveWindows(currentTime: Date, hoursAhead: number): UWClassWaveWindow[] {
    const day = currentTime.getDay();
    const isWeekday = day >= 1 && day <= 5;
    if (!isWeekday) return [];

    const end = new Date(currentTime.getTime() + hoursAhead * 60 * 60 * 1000);

    // Generate wave centers at :25 and :55 each hour (approx of the two burst windows).
    const centers: Date[] = [];
    const startHour = new Date(currentTime);
    startHour.setSeconds(0, 0);

    for (let h = 0; h <= hoursAhead; h++) {
      const base = new Date(startHour.getTime() + h * 60 * 60 * 1000);
      const c1 = new Date(base); c1.setMinutes(25, 0, 0);
      const c2 = new Date(base); c2.setMinutes(55, 0, 0);
      centers.push(c1, c2);
    }

    const windows: UWClassWaveWindow[] = [];
    for (const c of centers) {
      if (c < currentTime) continue;
      if (c > end) continue;

      const start = new Date(c.getTime() - 7 * 60 * 1000);
      const endW = new Date(c.getTime() + 10 * 60 * 1000);

      windows.push({
        start: start.toISOString(),
        end: endW.toISOString(),
        label: 'UW class-change burst (estimated)',
        confidence: 'low',
      });
    }

    windows.sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime());
    return windows;
  }
}





