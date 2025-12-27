import { ZonesResponse, Forecast, Conditions } from '../types';

const API_BASE = '/api';

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

