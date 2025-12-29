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

export interface DriverSupplyEstimate {
  estimatedDrivers: number;
  confidence: 'high' | 'medium' | 'low';
  source: 'heuristic' | 'crowdsourced';
  modifier: number;
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
    // Optional extra breakdowns (backend may include these; UI can selectively display)
    cruise?: number;
    conventions?: number;
    barClose?: number;
    deadZone?: number;
    microMeta?: number;
    ferries?: number;
    hotelCheckout?: number;
    hospitalShifts?: number;
    uwClasses?: number;
    pulse?: number;
    // Legacy/test-only
    surge?: number;
  };
  coordinates: Coordinates;
  driverSupply?: DriverSupplyEstimate; // v9.1: Estimated driver competition
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
  type?: 'sports' | 'concert' | 'conference' | 'festival' | 'other';
  attendees?: number;
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

export interface SurgeAlert {
  zoneId: string;
  zoneName: string;
  multiplier: number;
  timestamp: string;
}

