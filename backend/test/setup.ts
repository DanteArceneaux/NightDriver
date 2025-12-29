import { vi } from 'vitest';

// Mock environment variables
process.env.NODE_ENV = 'test';
process.env.PORT = '3001';
process.env.OPENWEATHER_API_KEY = 'test-weather-key';
process.env.TICKETMASTER_API_KEY = 'test-ticketmaster-key';
process.env.AERODATABOX_API_KEY = 'test-flights-key';
process.env.TOMTOM_API_KEY = 'test-traffic-key';

// Mock console methods to reduce noise in tests
vi.spyOn(console, 'log').mockImplementation(() => {});
vi.spyOn(console, 'error').mockImplementation(() => {});
vi.spyOn(console, 'warn').mockImplementation(() => {});
vi.spyOn(console, 'info').mockImplementation(() => {});

// Reset mocks before each test
beforeEach(() => {
  vi.clearAllMocks();
});


