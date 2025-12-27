import { ZonesResponse, Forecast, Conditions } from '../types';
import { generateMockZones, generateMockForecast, generateMockConditions } from './mockData';

// Use /api which redirects to Netlify Functions in production
// Falls back to mock data on static hosts like GitHub Pages
const API_BASE = '/api';

export async function fetchZones(): Promise<ZonesResponse> {
  try {
    const response = await fetch(`${API_BASE}/zones`);
    if (!response.ok) {
      throw new Error('Failed to fetch zones');
    }
    return response.json();
  } catch {
    // Fallback to mock data for static hosting
    return generateMockZones();
  }
}

export async function fetchForecast(): Promise<Forecast> {
  try {
    const response = await fetch(`${API_BASE}/forecast`);
    if (!response.ok) {
      throw new Error('Failed to fetch forecast');
    }
    return response.json();
  } catch {
    // Fallback to mock data for static hosting
    return generateMockForecast();
  }
}

export async function fetchConditions(): Promise<Conditions> {
  try {
    const response = await fetch(`${API_BASE}/conditions`);
    if (!response.ok) {
      throw new Error('Failed to fetch conditions');
    }
    return response.json();
  } catch {
    // Fallback to mock data for static hosting
    return generateMockConditions();
  }
}

