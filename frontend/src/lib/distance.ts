import { Coordinates } from '../types';

/**
 * Calculate distance between two points using Haversine formula
 * @returns distance in kilometers
 */
export function calculateDistance(from: Coordinates, to: Coordinates): number {
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

  return distance;
}

function toRad(degrees: number): number {
  return degrees * (Math.PI / 180);
}

/**
 * Estimate drive time in minutes
 * Assumes average city speed of 30 km/h
 */
export function estimateDriveTime(distanceKm: number): number {
  const avgSpeedKmh = 30; // Seattle city driving
  const timeHours = distanceKm / avgSpeedKmh;
  return Math.round(timeHours * 60);
}

/**
 * Calculate efficiency score (score per minute of drive time)
 */
export function calculateEfficiency(score: number, driveTimeMin: number): number {
  if (driveTimeMin === 0) return score;
  return score / driveTimeMin;
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

