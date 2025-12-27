import { ZonesResponse, Forecast, Conditions } from '../types';

// Use environment variable for production, fallback to local for dev
const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

export async function fetchZones(): Promise<ZonesResponse> {
  const response = await fetch(`${API_BASE}/zones`);
  if (!response.ok) {
    throw new Error('Failed to fetch zones');
  }
  return response.json();
}

export async function fetchForecast(): Promise<Forecast> {
  const response = await fetch(`${API_BASE}/forecast`);
  if (!response.ok) {
    throw new Error('Failed to fetch forecast');
  }
  return response.json();
}

export async function fetchConditions(): Promise<Conditions> {
  const response = await fetch(`${API_BASE}/conditions`);
  if (!response.ok) {
    throw new Error('Failed to fetch conditions');
  }
  return response.json();
}

