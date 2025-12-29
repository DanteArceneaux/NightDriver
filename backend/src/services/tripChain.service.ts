import type { Zone, ZoneScore, Coordinates } from '../types/index.js';
import { microZones } from '../data/microZones.js';
import { zones as legacyZones } from '../data/zones.js';

export interface TripChainRecommendation {
  zoneId: string;
  name: string;
  score: number;
  estimatedHourlyRate?: number;
  distanceMiles?: number;
  estimatedDriveMinutes?: number;
  reason: string;
}

/**
 * TripChainService
 *
 * Purpose: "What zone should I end up in next?"
 *
 * Without full origin→destination trip telemetry, we rely on:
 * - Micro-zone metadata (`typicalDestinations`, `nearbyMicroZones`)
 * - Current live scores (including pulses)
 * - A distance penalty (so we don't recommend a high score 12 miles away)
 */
export class TripChainService {
  getRecommendations(fromZoneId: string, liveZones: ZoneScore[], limit: number = 3): TripChainRecommendation[] {
    const fromMeta = this.getZoneMetaById(fromZoneId);
    if (!fromMeta) return [];

    const candidates = this.getCandidateZoneIds(fromMeta);

    const liveById = new Map(liveZones.map(z => [z.id, z]));
    const fromCoords = fromMeta.coordinates;

    const recs: TripChainRecommendation[] = [];
    for (const id of candidates) {
      if (id === fromZoneId) continue;
      const z = liveById.get(id);
      if (!z) continue;

      const distanceMiles = this.haversineMiles(fromCoords, z.coordinates);
      const estimatedDriveMinutes = Math.ceil((distanceMiles / 30) * 60); // simple city avg

      // Rank: high score with a small distance penalty
      const chainValue = z.score - distanceMiles * 2;

      const reasonParts: string[] = [];
      const micro = this.getMicroZone(fromZoneId);
      if (micro?.typicalDestinations?.includes(id)) reasonParts.push('Typical destination');
      if (micro?.nearbyMicroZones?.includes(id)) reasonParts.push('Nearby micro-zone');
      reasonParts.push(`Score ${z.score}`);

      recs.push({
        zoneId: z.id,
        name: z.name,
        score: z.score,
        estimatedHourlyRate: z.estimatedHourlyRate,
        distanceMiles: parseFloat(distanceMiles.toFixed(2)),
        estimatedDriveMinutes,
        reason: reasonParts.join(' • '),
        // @ts-ignore - used only for sorting, removed before return
        _chainValue: chainValue,
      } as any);
    }

    recs.sort((a: any, b: any) => (b._chainValue ?? 0) - (a._chainValue ?? 0));

    // Remove internal sort key
    return recs.slice(0, limit).map((r: any) => {
      const { _chainValue, ...rest } = r;
      return rest as TripChainRecommendation;
    });
  }

  private getCandidateZoneIds(fromMeta: Zone): string[] {
    const micro = this.getMicroZone(fromMeta.id);
    const out: string[] = [];

    if (micro?.typicalDestinations?.length) out.push(...micro.typicalDestinations);
    if (micro?.nearbyMicroZones?.length) out.push(...micro.nearbyMicroZones);

    // Fallback: if no micro metadata, use current downtown/core set as common chain targets.
    if (out.length === 0) {
      out.push(
        'retail_core',
        'capitol_hill_pike_pine',
        'belltown_hotels',
        'downtown_hotel_row_union',
        'seatac'
      );
    }

    // De-dupe while preserving order
    return Array.from(new Set(out));
  }

  private getZoneMetaById(zoneId: string): Zone | undefined {
    return microZones.find(z => z.id === zoneId) || legacyZones.find(z => z.id === zoneId);
  }

  private getMicroZone(zoneId: string): any | undefined {
    return microZones.find(z => z.id === zoneId);
  }

  private haversineMiles(a: Coordinates, b: Coordinates): number {
    const R = 3959; // miles
    const dLat = this.toRad(b.lat - a.lat);
    const dLng = this.toRad(b.lng - a.lng);
    const aa =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRad(a.lat)) * Math.cos(this.toRad(b.lat)) *
      Math.sin(dLng / 2) * Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(aa), Math.sqrt(1 - aa));
    return R * c;
  }

  private toRad(deg: number): number {
    return deg * (Math.PI / 180);
  }
}






