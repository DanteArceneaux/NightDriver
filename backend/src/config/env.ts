import dotenv from 'dotenv';

dotenv.config();

export interface ApiConfig {
  key: string;
  enabled: boolean;
}

export interface AppConfig {
  port: number;
  nodeEnv: string;
  apis: {
    weather: ApiConfig;
    ticketmaster: ApiConfig;
    flights: ApiConfig;
    traffic: ApiConfig;
  };
}

// Support both old and new env var names for flights
function getFlightsApiKey(): string {
  return process.env.AVIATIONSTACK_API_KEY || process.env.AERODATABOX_API_KEY || '';
}

function isValidApiKey(key: string | undefined): boolean {
  return !!key && key !== 'your_key_here' && key.length > 10;
}

export const config: AppConfig = {
  port: parseInt(process.env.PORT || '3001', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  apis: {
    weather: {
      key: process.env.OPENWEATHER_API_KEY || '',
      enabled: isValidApiKey(process.env.OPENWEATHER_API_KEY),
    },
    ticketmaster: {
      key: process.env.TICKETMASTER_API_KEY || '',
      enabled: isValidApiKey(process.env.TICKETMASTER_API_KEY),
    },
    flights: {
      key: getFlightsApiKey(),
      enabled: isValidApiKey(getFlightsApiKey()),
    },
    traffic: {
      key: process.env.TOMTOM_API_KEY || '',
      enabled: isValidApiKey(process.env.TOMTOM_API_KEY),
    },
  },
};

export function logApiStatus(): void {
  console.log('\n🔑 API Key Status:');
  console.log(`  Weather: ${config.apis.weather.enabled ? '✓ Active' : '✗ (using mock data)'}`);
  console.log(`  Events: ${config.apis.ticketmaster.enabled ? '✓ Active' : '✗ (using mock data)'}`);
  console.log(`  Flights: ${config.apis.flights.enabled ? '✓ Active' : '✗ (using mock data)'}`);
  console.log(`  Traffic: ${config.apis.traffic.enabled ? '✓ Active' : '✗ (using mock data)'}`);
}

