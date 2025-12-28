import { getMicroZoneById } from '../data/microZones.js';

export interface HospitalShiftWindow {
  start: string; // ISO
  end: string;   // ISO
  label: string;
  confidence: 'medium';
}

export interface HospitalShiftAlert {
  id: string;
  message: string;
  recommendedZoneId: string;
  window: HospitalShiftWindow;
  createdAt: string;
}

/**
 * HospitalShiftsService (no API key required)
 *
 * Heuristic model:
 * - Many hospitals run 12h shifts (common changes ~07:00 and ~19:00)
 * - Some departments run 8h shifts (common changes ~07:00, ~15:00, ~23:00)
 * - Demand spike comes from:
 *   - Incoming staff drop-offs (arrivals)
 *   - Outgoing staff pickups (departures)
 *
 * We keep boosts conservative and localized to hospital micro-zones.
 */
export class HospitalShiftsService {
  private readonly affectedZones: Record<string, number> = {
    harborview_medical: 1.0,
    swedish_first_hill: 0.9,
    first_hill_hospitals: 0.85,
    virginia_mason: 0.75,
    uw_campus_east: 0.7,
  };

  /**
   * Returns a numeric score impact for a zone at a given time.
   */
  calculateHospitalShiftImpact(zoneId: string, currentTime: Date): number {
    const scale = this.affectedZones[zoneId];
    if (!scale) return 0;

    const active = this.getActiveShiftWindows(currentTime);
    if (active.length === 0) return 0;

    // Prefer the strongest window if multiple overlap (rare)
    const base = active.some(w => w.label.includes('Major')) ? 12 : 9;
    return Math.round(base * scale);
  }

  getHospitalShiftIntelligence(currentTime: Date): {
    windows: HospitalShiftWindow[];
    alerts: HospitalShiftAlert[];
    recommendedZones: Array<{ zoneId: string; name: string; reason: string }>;
    note: string;
  } {
    const windows = this.getWindowsAroundNow(currentTime, 12);

    const alerts: HospitalShiftAlert[] = [];
    const alertWindowMinutes = 35;
    for (const w of windows) {
      const start = new Date(w.start);
      const end = new Date(w.end);
      const minutesUntil = (start.getTime() - currentTime.getTime()) / (1000 * 60);
      const minutesUntilEnd = (end.getTime() - currentTime.getTime()) / (1000 * 60);
      const inWindow = minutesUntil <= 0 && minutesUntilEnd > 0;
      const startingSoon = minutesUntil >= 0 && minutesUntil <= alertWindowMinutes;

      if (inWindow || startingSoon) {
        // Choose best recommended zone (Harborview tends to be most reliable volume)
        const recommendedZoneId = 'harborview_medical';
        alerts.push({
          id: `hospital-${start.getTime()}`,
          message: `Hospital shift-change wave ${inWindow ? 'is active now' : 'starts soon'}. Expect clustered staff pickups/dropoffs.`,
          recommendedZoneId,
          window: w,
          createdAt: currentTime.toISOString(),
        });
      }
    }

    return {
      windows,
      alerts: alerts.slice(0, 3),
      recommendedZones: [
        {
          zoneId: 'harborview_medical',
          name: getMicroZoneById('harborview_medical')?.name || 'Harborview Medical Center',
          reason: 'High-volume hospital with consistent shift timing',
        },
        {
          zoneId: 'swedish_first_hill',
          name: getMicroZoneById('swedish_first_hill')?.name || 'Swedish First Hill',
          reason: 'Reliable staff movement + visitor traffic',
        },
        {
          zoneId: 'virginia_mason',
          name: getMicroZoneById('virginia_mason')?.name || 'Virginia Mason',
          reason: 'Smaller but still steady staff flow',
        },
      ],
      note: 'Heuristic-only. Shift timing varies by department; use as a repeatable daily positioning pattern.',
    };
  }

  private getActiveShiftWindows(currentTime: Date): HospitalShiftWindow[] {
    const windows = this.getWindowsAroundNow(currentTime, 6);
    const now = currentTime.getTime();
    return windows.filter(w => {
      const start = new Date(w.start).getTime();
      const end = new Date(w.end).getTime();
      return now >= start && now <= end;
    });
  }

  private getWindowsAroundNow(currentTime: Date, hoursAhead: number): HospitalShiftWindow[] {
    const base = new Date(currentTime);
    base.setSeconds(0, 0);

    // Common shift change centers (local time)
    // Major = most hospitals (12h): 07:00, 19:00
    // Secondary = some 8h: 15:00, 23:00
    const centers: Array<{ hour: number; minute: number; label: string }> = [
      { hour: 7, minute: 0, label: 'Major shift change (07:00)' },
      { hour: 15, minute: 0, label: 'Secondary shift change (15:00)' },
      { hour: 19, minute: 0, label: 'Major shift change (19:00)' },
      { hour: 23, minute: 0, label: 'Secondary shift change (23:00)' },
    ];

    const end = new Date(currentTime.getTime() + hoursAhead * 60 * 60 * 1000);

    // Build windows for "today" and "tomorrow" so we always cover the lookahead range.
    const days = [0, 1];
    const windows: HospitalShiftWindow[] = [];

    for (const dayOffset of days) {
      for (const c of centers) {
        const center = this.atLocalTimeWithDayOffset(base, dayOffset, c.hour, c.minute);
        if (center > end) continue;

        // Window: 25 min before to 40 min after center
        const start = new Date(center.getTime() - 25 * 60 * 1000);
        const endW = new Date(center.getTime() + 40 * 60 * 1000);

        // Only include windows within a reasonable range around now (avoid huge lists)
        const tooOld = endW.getTime() < currentTime.getTime() - 60 * 60 * 1000;
        if (tooOld) continue;

        windows.push({
          start: start.toISOString(),
          end: endW.toISOString(),
          label: c.label,
          confidence: 'medium',
        });
      }
    }

    // Sort by start time
    windows.sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime());
    return windows;
  }

  private atLocalTimeWithDayOffset(baseDay: Date, dayOffset: number, hour: number, minute: number): Date {
    const d = new Date(baseDay);
    d.setDate(d.getDate() + dayOffset);
    d.setHours(hour, minute, 0, 0);
    return d;
  }
}




