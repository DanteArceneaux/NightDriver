export interface CompletedShift {
  id: string;
  startTime: string;
  endTime: string;
  durationMinutes: number;
  estimatedEarnings: number;
  zonesVisited: string[];
  goal: 'balanced' | 'max_earnings' | 'short_distance';
  // Metrics
  totalDistanceDriven?: number;
  averageScore?: number;
  peakScore?: number;
}

export interface WeeklyStats {
  weekStartDate: string;
  totalShifts: number;
  totalMinutes: number;
  totalEarnings: number;
  averageShiftLength: number;
  bestShift?: CompletedShift;
}

