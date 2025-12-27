import { getMicroZoneById } from '../data/microZones.js';

export interface FerryWaveWindow {
  start: string; // ISO
  end: string;   // ISO
  label: string; // human readable
  confidence: 'low' | 'medium';
}

export interface FerrySurgeAlert {
  id: string;
  message: string;
  recommendedZoneId: string;
  window: FerryWaveWindow;
  createdAt: string;
}

/**
 * FerriesService (no API key required)
 *
 * Real WSF schedules change by route/season. For v4.0 we use a conservative
 * heuristic model that is still useful for driver positioning:
 * - "Waves" tend to hit at predictable cadences (roughly every ~30 minutes)
 * - Stronger commuter peaks weekday mornings/evenings
 * - Weekend midday tourist waves
 *
 * IMPORTANT: We keep boosts conservative to avoid destabilizing the overall score.
 */
export class FerriesService {
  private readonly terminalZoneId = 'colman_dock_ferry';

  /**
   * Zones that commonly benefit from ferry waves.
   * (Pickups flow into downtown + hotel corridors quickly.)
   */
  private readonly affectedZones: Record<string, number> = {
    colman_dock_ferry: 1.0,
    waterfront_piers: 0.65,
    pioneer_square_north: 0.55,
    pioneer_square_south: 0.45,
    financial_district: 0.4,
    belltown_hotels: 0.35,
  };

  /**
   * Returns a numeric score impact for a given zone at a given time.
   */
  calculateFerryImpact(zoneId: string, currentTime: Date): number {
    const scale = this.affectedZones[zoneId];
    if (!scale) return 0;

    const inWave = this.isInFerryWaveWindow(currentTime);
    if (!inWave) return 0;

    const baseWaveBoost = 12; // conservative baseline
    const peakBoost = this.getCommuterPeakBoost(currentTime);
    const weekendBoost = this.getWeekendTouristBoost(currentTime);

    const raw = (baseWaveBoost + peakBoost + weekendBoost) * scale;
    return Math.round(raw);
  }

  /**
   * Money-makers endpoint helper: return alerts + the next few predicted wave windows.
   */
  getFerryIntelligence(currentTime: Date, hoursAhead: number = 3): {
    terminalZoneId: string;
    terminalName: string;
    currentImpact: number;
    nextWaves: FerryWaveWindow[];
    alerts: FerrySurgeAlert[];
    note: string;
  } {
    const terminal = getMicroZoneById(this.terminalZoneId);
    const terminalName = terminal?.name || 'Colman Dock (Ferries)';

    const nextWaves = this.getNextWaveWindows(currentTime, hoursAhead).slice(0, 6);

    // If a wave is starting soon, create an alert.
    const alerts: FerrySurgeAlert[] = [];
    const alertWindowMinutes = 45;
    for (const wave of nextWaves) {
      const minutesUntil = (new Date(wave.start).getTime() - currentTime.getTime()) / (1000 * 60);
      if (minutesUntil >= 0 && minutesUntil <= alertWindowMinutes) {
        alerts.push({
          id: `ferry-${new Date(wave.start).getTime()}`,
          message: `Ferry wave expected soon. Stage near ${terminalName} ~10 min early for high-volume pickups.`,
          recommendedZoneId: this.terminalZoneId,
          window: wave,
          createdAt: currentTime.toISOString(),
        });
      }
    }

    return {
      terminalZoneId: this.terminalZoneId,
      terminalName,
      currentImpact: this.calculateFerryImpact(this.terminalZoneId, currentTime),
      nextWaves,
      alerts: alerts.slice(0, 3),
      note: 'Heuristic-only (no WSDOT live feed). Use as positioning signal, not an exact timetable.',
    };
  }

  private isInFerryWaveWindow(currentTime: Date): boolean {
    // Waves roughly align to the half-hour with a small offset.
    // Example wave centers: :05 and :35.
    const windows = this.getWaveCentersAround(currentTime, 2).map(center => ({
      start: new Date(center.getTime() - 6 * 60 * 1000),
      end: new Date(center.getTime() + 12 * 60 * 1000),
    }));

    return windows.some(w => currentTime >= w.start && currentTime <= w.end);
  }

  private getCommuterPeakBoost(currentTime: Date): number {
    const day = currentTime.getDay();
    const isWeekend = day === 0 || day === 6;
    if (isWeekend) return 0;

    const hour = currentTime.getHours();
    // Weekday commute bands (stronger ferry usage)
    if (hour >= 6 && hour <= 8) return 6;
    if (hour >= 16 && hour <= 18) return 6;
    return 0;
  }

  private getWeekendTouristBoost(currentTime: Date): number {
    const day = currentTime.getDay();
    const isWeekend = day === 0 || day === 6;
    if (!isWeekend) return 0;

    const hour = currentTime.getHours();
    if (hour >= 10 && hour <= 14) return 5;
    return 0;
  }

  private getNextWaveWindows(currentTime: Date, hoursAhead: number): FerryWaveWindow[] {
    const centers: Date[] = [];
    const end = new Date(currentTime.getTime() + hoursAhead * 60 * 60 * 1000);

    // Start from the next half-hour boundary, then add 30m steps.
    const next = this.nextHalfHourBoundary(currentTime);
    // Use a small offset so "wave" isn't exactly on the boundary.
    next.setMinutes(next.getMinutes() + 5);

    for (let t = new Date(next); t <= end; t = new Date(t.getTime() + 30 * 60 * 1000)) {
      centers.push(t);
    }

    return centers.map(center => {
      const start = new Date(center.getTime() - 6 * 60 * 1000);
      const endW = new Date(center.getTime() + 12 * 60 * 1000);
      return {
        start: start.toISOString(),
        end: endW.toISOString(),
        label: 'Ferry wave (estimated)',
        confidence: 'low',
      };
    });
  }

  private getWaveCentersAround(currentTime: Date, hoursSpan: number): Date[] {
    const centers: Date[] = [];
    const start = new Date(currentTime.getTime() - hoursSpan * 60 * 60 * 1000);
    const end = new Date(currentTime.getTime() + hoursSpan * 60 * 60 * 1000);

    // Align to half-hour boundaries with +5m offset (:05 / :35).
    const first = this.nextHalfHourBoundary(start);
    first.setMinutes(first.getMinutes() + 5);

    for (let t = new Date(first); t <= end; t = new Date(t.getTime() + 30 * 60 * 1000)) {
      centers.push(t);
    }

    // Also include one wave just before start (edge case)
    const before = new Date(first.getTime() - 30 * 60 * 1000);
    centers.push(before);

    return centers;
  }

  private nextHalfHourBoundary(d: Date): Date {
    const t = new Date(d);
    t.setSeconds(0, 0);
    const m = t.getMinutes();
    const add = m < 30 ? 30 - m : 60 - m;
    t.setMinutes(m + add);
    return t;
  }
}


