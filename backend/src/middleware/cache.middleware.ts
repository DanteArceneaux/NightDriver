import NodeCache from 'node-cache';

// Create cache instances with different TTLs for different data types
export const weatherCache = new NodeCache({ stdTTL: 900 }); // 15 minutes
export const eventsCache = new NodeCache({ stdTTL: 1800 }); // 30 minutes
export const flightsCache = new NodeCache({ stdTTL: 600 }); // 10 minutes
export const trafficCache = new NodeCache({ stdTTL: 300 }); // 5 minutes
export const scoresCache = new NodeCache({ stdTTL: 300 }); // 5 minutes

export function getCached<T>(cache: NodeCache, key: string): T | undefined {
  return cache.get<T>(key);
}

export function setCache<T>(cache: NodeCache, key: string, value: T): void {
  cache.set(key, value);
}

export function clearAllCaches(): void {
  weatherCache.flushAll();
  eventsCache.flushAll();
  flightsCache.flushAll();
  trafficCache.flushAll();
  scoresCache.flushAll();
}

