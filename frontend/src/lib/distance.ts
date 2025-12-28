import { Coordinates } from '../types';

// Cache for memoized distance calculations
const distanceCache = new Map<string, number>();
const driveTimeCache = new Map<number, number>();
const efficiencyCache = new Map<string, number>();

/**
 * Calculate distance between two points using Haversine formula with memoization
 * @returns distance in kilometers
 */
export function calculateDistance(from: Coordinates, to: Coordinates): number {
  // Create cache key
  const cacheKey = `${from.lat},${from.lng},${to.lat},${to.lng}`;
  
  // Check cache
  if (distanceCache.has(cacheKey)) {
    return distanceCache.get(cacheKey)!;
  }
  
  // Calculate distance
  const R = 6371; // Earth's radius in km
  const dLat = toRad(to.lat - from.lat);
  const dLon = toRad(to.lng - from.lng);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(from.lat)) *
      Math.cos(toRad(to.lat)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;
  
  // Cache result
  distanceCache.set(cacheKey, distance);
  
  // Limit cache size to prevent memory leaks (LRU-like behavior)
  if (distanceCache.size > 1000) {
    const firstKey = distanceCache.keys().next().value;
    if (firstKey) {
      distanceCache.delete(firstKey);
    }
  }
  
  return distance;
}

function toRad(degrees: number): number {
  return degrees * (Math.PI / 180);
}

/**
 * Estimate drive time in minutes with memoization
 * Assumes average city speed of 30 km/h
 */
export function estimateDriveTime(distanceKm: number): number {
  // Check cache
  if (driveTimeCache.has(distanceKm)) {
    return driveTimeCache.get(distanceKm)!;
  }
  
  // Calculate drive time
  const avgSpeedKmh = 30; // Seattle city driving
  const timeHours = distanceKm / avgSpeedKmh;
  const driveTime = Math.round(timeHours * 60);
  
  // Cache result
  driveTimeCache.set(distanceKm, driveTime);
  
  // Limit cache size
  if (driveTimeCache.size > 1000) {
    const firstKey = driveTimeCache.keys().next().value;
    if (firstKey) {
      driveTimeCache.delete(firstKey);
    }
  }
  
  return driveTime;
}

/**
 * Calculate efficiency score (score per minute of drive time) with memoization
 */
export function calculateEfficiency(score: number, driveTimeMin: number): number {
  if (driveTimeMin === 0) return score;
  
  const cacheKey = `${score},${driveTimeMin}`;
  
  // Check cache
  if (efficiencyCache.has(cacheKey)) {
    return efficiencyCache.get(cacheKey)!;
  }
  
  // Calculate efficiency
  const efficiency = score / driveTimeMin;
  
  // Cache result
  efficiencyCache.set(cacheKey, efficiency);
  
  // Limit cache size
  if (efficiencyCache.size > 1000) {
    const firstKey = efficiencyCache.keys().next().value;
    if (firstKey) {
      efficiencyCache.delete(firstKey);
    }
  }
  
  return efficiency;
}

/**
 * Format distance for display
 */
export function formatDistance(km: number): string {
  if (km < 1) {
    return `${Math.round(km * 1000)} m`;
  }
  return `${km.toFixed(1)} km`;
}

/**
 * Format drive time for display
 */
export function formatDriveTime(minutes: number): string {
  if (minutes < 1) return '< 1 min';
  if (minutes < 60) return `${minutes} min`;
  
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours}h ${mins}m`;
}

/**
 * Batch calculate distances for multiple zones from a single location
 * More efficient than calling calculateDistance multiple times
 */
export function calculateDistancesBatch(
  from: Coordinates, 
  toList: Coordinates[]
): number[] {
  const results: number[] = [];
  
  for (const to of toList) {
    results.push(calculateDistance(from, to));
  }
  
  return results;
}

/**
 * Batch calculate efficiencies for multiple zones
 */
export function calculateEfficienciesBatch(
  scores: number[],
  distances: number[]
): number[] {
  const results: number[] = [];
  
  for (let i = 0; i < scores.length; i++) {
    const driveTime = estimateDriveTime(distances[i]);
    results.push(calculateEfficiency(scores[i], driveTime));
  }
  
  return results;
}

/**
 * Clear all distance caches (useful for testing or memory management)
 */
export function clearDistanceCaches(): void {
  distanceCache.clear();
  driveTimeCache.clear();
  efficiencyCache.clear();
}

