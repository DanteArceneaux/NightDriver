import { ZoneScore } from '../types/index.js';

export interface SurgeAlert {
  zoneId: string;
  zoneName: string;
  oldScore: number;
  newScore: number;
  scoreDiff: number;
  timestamp: string;
  reason: string;
}

export class SurgeService {
  private previousScores: Map<string, number> = new Map();
  private surgeThreshold = 20; // Minimum score increase to trigger alert

  detectSurges(currentScores: ZoneScore[]): SurgeAlert[] {
    const surges: SurgeAlert[] = [];

    for (const zone of currentScores) {
      const previousScore = this.previousScores.get(zone.id) || zone.score;
      const scoreDiff = zone.score - previousScore;

      if (scoreDiff >= this.surgeThreshold) {
        surges.push({
          zoneId: zone.id,
          zoneName: zone.name,
          oldScore: previousScore,
          newScore: zone.score,
          scoreDiff,
          timestamp: new Date().toISOString(),
          reason: this.generateSurgeReason(zone, scoreDiff),
        });
      }

      // Update previous scores
      this.previousScores.set(zone.id, zone.score);
    }

    return surges;
  }

  private generateSurgeReason(zone: ZoneScore, scoreDiff: number): string {
    const reasons: string[] = [];

    // Check which factors contributed most to the surge
    if (zone.factors.events >= 15) {
      reasons.push('Major event activity');
    }
    if (zone.factors.weather >= 10) {
      reasons.push('Weather change');
    }
    if (zone.factors.flights >= 15) {
      reasons.push('High flight arrivals');
    }
    if (zone.factors.baseline >= 35) {
      reasons.push('Peak time pattern');
    }

    if (reasons.length === 0) {
      return `Score jumped +${scoreDiff} points`;
    }

    return reasons.join(' + ');
  }

  setSurgeThreshold(threshold: number): void {
    this.surgeThreshold = threshold;
  }

  reset(): void {
    this.previousScores.clear();
  }
}

