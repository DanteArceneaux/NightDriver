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

export interface ZoneScoreFactors {
  baseline: number;
  events: number;
  weather: number;
  flights: number;
  traffic: number;
  // v4.0+ (optional extra signal breakdowns)
  cruise?: number;
  conventions?: number;
  barClose?: number;
  deadZone?: number;
  microMeta?: number;
  ferries?: number;
  hotelCheckout?: number;
  hospitalShifts?: number;
  uwClasses?: number;
  // pulse removed - was fake/unused data
}

export interface ZoneScore {
  id: string;
  name: string;
  score: number;
  trend: 'rising' | 'falling' | 'stable';
  estimatedHourlyRate?: number;
  factors: ZoneScoreFactors;
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

export interface SurgeWindow {
  start: string;
  end: string;
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
  // Enhanced duration data
  durationMinutes?: number;
  surgeWindows?: {
    preSurge: SurgeWindow;
    postSurge: SurgeWindow;
  };
}

export interface LiveSportsGame {
  id: string;
  name: string;
  shortName: string;
  venue: string;
  startTime: string;
  status: 'scheduled' | 'in_progress' | 'halftime' | 'delayed' | 'final' | 'postponed';
  period: string;
  clock: string;
  homeTeam: string;
  awayTeam: string;
  homeScore: number;
  awayScore: number;
  isSeattleTeam: boolean;
  estimatedEndTime: string;
  actualEndTime?: string;
  nearingEnd: boolean;
  surgeAlert?: string;
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
  status?: string; // 'Scheduled', 'In Flight', 'Landed', 'Cancelled', etc.
  carrier?: string; // Airline name
}

export interface DriverSupplyEstimate {
  estimatedDrivers: number; // Number of estimated drivers available in the zone
  confidence: 'high' | 'medium' | 'low'; // How reliable is this estimate
  source: 'heuristic' | 'crowdsourced'; // How the estimate was derived
  modifier: number; // The score modifier based on supply/demand imbalance
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

