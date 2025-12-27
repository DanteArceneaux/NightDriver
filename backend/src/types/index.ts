export interface Coordinates {
  lat: number;
  lng: number;
}

export interface Zone {
  id: string;
  name: string;
  coordinates: Coordinates;
  demandDrivers: string[];
  stagingSpot?: Coordinates; // Recommended safe parking/waiting location
}

export interface ZoneScore {
  id: string;
  name: string;
  score: number;
  trend: 'rising' | 'falling' | 'stable';
  estimatedHourlyRate?: number;
  factors: {
    baseline: number;
    events: number;
    weather: number;
    flights: number;
    traffic: number;
  };
  coordinates: Coordinates;
}

export interface TopPick {
  zoneId: string;
  score: number;
  reason: string;
}

export interface ZonesResponse {
  timestamp: string;
  topPick: TopPick;
  zones: ZoneScore[];
}

export interface Event {
  name: string;
  venue: string;
  startTime: string;
  endTime: string;
  zoneId: string;
  attendees?: number;
  type?: 'sports' | 'concert' | 'conference' | 'festival' | 'other';
  imageUrl?: string;
  url?: string;
}

export interface WeatherConditions {
  temperature: number;
  description: string;
  isRaining: boolean;
  rainPrediction: string;
}

export interface FlightArrival {
  flightNumber: string;
  arrivalTime: string;
  origin: string;
  terminal: string;
}

export interface Conditions {
  weather: WeatherConditions;
  events: Event[];
  flights: FlightArrival[];
  lastUpdated: string;
}

export interface ForecastPoint {
  time: string;
  hour: number;
  topZones: Array<{ id: string; name: string; score: number }>;
}

export interface Forecast {
  points: ForecastPoint[];
}

export interface TimePattern {
  hour: number;
  dayOfWeek: number; // 0-6, Sunday = 0
  score: number;
}

