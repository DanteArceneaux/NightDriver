import { ZonesResponse, Forecast, Conditions } from '../types';
import { generateMockZones, generateMockForecast, generateMockConditions } from './mockData';

// API base URL - uses Vite's proxy in development, direct URL in production
// The Vite dev server proxies /api requests to the backend (http://localhost:3001)
const API_BASE = '/api';

// Backend URL for when we need direct connection (e.g., WebSocket)
export const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001';

// Check if we're likely running on a static host (Vercel/Netlify) without a backend
export const isStaticHost = typeof window !== 'undefined' && 
  (window.location.hostname.includes('vercel.app') || 
   window.location.hostname.includes('netlify.app') ||
   window.location.hostname.includes('github.io'));

// Helper to get the appropriate backend URL for API calls
export function getBackendUrl(): string {
  // If a backend URL is explicitly set, use it
  if (import.meta.env.VITE_BACKEND_URL) {
    return import.meta.env.VITE_BACKEND_URL;
  }
  
  // On static hosts without a backend URL, return empty (will fail gracefully)
  if (isStaticHost) {
    return '';
  }
  
  // Default to localhost for development
  return 'http://localhost:3001';
}

// Helper to fetch with timeout
async function fetchWithTimeout(url: string, timeoutMs = 5000, options?: RequestInit): Promise<Response> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  
  try {
    const response = await fetch(url, { ...options, signal: controller.signal });
    return response;
  } finally {
    clearTimeout(timeout);
  }
}

// Export for other components to use
export { fetchWithTimeout };

export async function fetchZones(): Promise<ZonesResponse> {
  // Skip API call entirely on static hosts to avoid hanging requests
  if (isStaticHost && !import.meta.env.VITE_BACKEND_URL) {
    console.info('📦 Static hosting detected - using mock data');
    return generateMockZones();
  }
  
  try {
    const response = await fetchWithTimeout(`${API_BASE}/zones`);
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
  if (isStaticHost && !import.meta.env.VITE_BACKEND_URL) {
    return generateMockForecast();
  }
  
  try {
    const response = await fetchWithTimeout(`${API_BASE}/forecast`);
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
  if (isStaticHost && !import.meta.env.VITE_BACKEND_URL) {
    return generateMockConditions();
  }
  
  try {
    const response = await fetchWithTimeout(`${API_BASE}/conditions`);
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
  if (isStaticHost && !import.meta.env.VITE_BACKEND_URL) {
    return false; // No backend on static hosts
  }
  
  try {
    const response = await fetchWithTimeout(`${API_BASE}/health`, 3000);
    return response.ok;
  } catch {
    return false;
  }
}

