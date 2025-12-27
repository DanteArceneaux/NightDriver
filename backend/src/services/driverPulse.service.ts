import NodeCache from 'node-cache';

export type PulseType = 'airport_full' | 'surge_fake' | 'traffic_bad' | 'high_demand' | 'quiet';

export interface PulseReport {
  id: string;
  zoneId: string;
  type: PulseType;
  timestamp: string;
  expiresAt: string;
}

export class DriverPulseService {
  private pulses: NodeCache; // Stores active pulse reports

  constructor() {
    // Pulse reports expire after 30 minutes (1800 seconds)
    this.pulses = new NodeCache({ stdTTL: 1800, checkperiod: 120 });
  }

  /**
   * Report a pulse from a driver
   */
  reportPulse(zoneId: string, type: PulseType): PulseReport {
    const id = `pulse-${Date.now()}-${zoneId}`;
    const timestamp = new Date().toISOString();
    const expiresAt = new Date(Date.now() + 30 * 60 * 1000).toISOString();

    const report: PulseReport = {
      id,
      zoneId,
      type,
      timestamp,
      expiresAt,
    };

    this.pulses.set(id, report);
    console.log(`📡 Pulse reported: ${type} at ${zoneId}`);

    return report;
  }

  /**
   * Get all active pulses for a zone
   */
  getPulsesForZone(zoneId: string): PulseReport[] {
    const allKeys = this.pulses.keys();
    const pulses: PulseReport[] = [];

    for (const key of allKeys) {
      const pulse = this.pulses.get<PulseReport>(key);
      if (pulse && pulse.zoneId === zoneId) {
        pulses.push(pulse);
      }
    }

    return pulses.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }

  /**
   * Get all active pulses
   */
  getAllPulses(): PulseReport[] {
    const allKeys = this.pulses.keys();
    const pulses: PulseReport[] = [];

    for (const key of allKeys) {
      const pulse = this.pulses.get<PulseReport>(key);
      if (pulse) {
        pulses.push(pulse);
      }
    }

    return pulses.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }

  /**
   * Get score modifier based on pulses for a zone
   * Positive pulses increase score, negative pulses decrease it
   */
  getScoreModifier(zoneId: string): number {
    const pulses = this.getPulsesForZone(zoneId);
    let modifier = 0;

    for (const pulse of pulses) {
      const ageMinutes = (Date.now() - new Date(pulse.timestamp).getTime()) / (1000 * 60);
      const recencyMultiplier = Math.max(0, 1 - (ageMinutes / 30)); // Fade over 30 min

      switch (pulse.type) {
        case 'high_demand':
          modifier += 10 * recencyMultiplier;
          break;
        case 'airport_full':
        case 'traffic_bad':
          modifier -= 15 * recencyMultiplier;
          break;
        case 'surge_fake':
          modifier -= 20 * recencyMultiplier;
          break;
        case 'quiet':
          modifier -= 5 * recencyMultiplier;
          break;
      }
    }

    return Math.round(modifier);
  }

  /**
   * Clear all pulses (admin)
   */
  clearAll(): void {
    this.pulses.flushAll();
    console.log('🧹 All driver pulses cleared.');
  }
}

