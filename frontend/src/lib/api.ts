import { ZonesResponse, Forecast, Conditions } from '../types';
import { generateMockZones, generateMockForecast, generateMockConditions } from './mockData';

// API base URL - uses Vite's proxy in development, direct URL in production
// The Vite dev server proxies /api requests to the backend (http://localhost:3001)
const API_BASE = '/api';

// Backend URL for when we need direct connection (e.g., WebSocket)
export const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001';

export async function fetchZones(): Promise<ZonesResponse> {
  try {
    const response = await fetch(`${API_BASE}/zones`);
    if (!response.ok) {
      throw new Error('Failed to fetch zones');
    }
    return response.json();
  } catch (error) {
    console.warn('API unavailable, using mock data:', error);
    // Fallback to mock data for static hosting or when backend is down
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
  } catch (error) {
    console.warn('API unavailable, using mock data:', error);
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
  } catch (error) {
    console.warn('API unavailable, using mock data:', error);
    // Fallback to mock data for static hosting
    return generateMockConditions();
  }
}

// Health check to verify backend connection
export async function checkBackendHealth(): Promise<boolean> {
  try {
    const response = await fetch(`${API_BASE}/health`);
    return response.ok;
  } catch {
    return false;
  }
}

