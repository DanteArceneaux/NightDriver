import type { Coordinates } from '../types';

export function openGoogleMaps(coords: Coordinates): void {
  const url = `https://www.google.com/maps/dir/?api=1&destination=${coords.lat},${coords.lng}`;
  window.open(url, '_blank');
}

export function openWaze(coords: Coordinates): void {
  const url = `https://waze.com/ul?ll=${coords.lat},${coords.lng}&navigate=yes`;
  window.open(url, '_blank');
}

export function openAppleMaps(coords: Coordinates): void {
  const url = `maps://maps.apple.com/?daddr=${coords.lat},${coords.lng}`;
  window.open(url, '_blank');
}

export function openNavigation(coords: Coordinates, app: 'google' | 'waze' | 'apple' = 'google'): void {
  switch (app) {
    case 'google':
      openGoogleMaps(coords);
      break;
    case 'waze':
      openWaze(coords);
      break;
    case 'apple':
      openAppleMaps(coords);
      break;
  }
}

// Detect if user is on iOS
export function isIOS(): boolean {
  return /iPad|iPhone|iPod/.test(navigator.userAgent);
}

// Get default navigation app based on platform
export function getDefaultNavigationApp(): 'google' | 'waze' | 'apple' {
  return isIOS() ? 'apple' : 'google';
}

