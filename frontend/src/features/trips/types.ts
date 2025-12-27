export interface LoggedTrip {
  id: string;
  timestamp: string;
  zoneId: string;
  actualEarnings: number;
  durationMinutes: number;
  distance?: number;
  note?: string;
}

export interface ZonePerformance {
  zoneId: string;
  trips: number;
  totalEarnings: number;
  averageEarnings: number;
  actualHourlyRate: number;
}

