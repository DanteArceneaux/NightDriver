import type { Zone } from '../types';

export const zones: Zone[] = [
  // This is a client-side copy for quick lookups
  // The authoritative source is backend/src/data/zones.ts
  // This file is updated by the backend data
  
  // For now, we'll fetch zones from the API
  // But we can add a static copy here if needed for offline support
];

export function getZoneById(zoneId: string, zonesData: Zone[]): Zone | undefined {
  return zonesData.find(z => z.id === zoneId);
}

