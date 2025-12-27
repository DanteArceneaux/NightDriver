export type DriverGoal = 'balanced' | 'max_earnings' | 'short_distance';

export interface ShiftState {
  isActive: boolean;
  startTime: string | null;
  currentGoal: DriverGoal;
  currentZoneId: string | null;
  estimatedEarnings: number;
}

export interface ShiftSummary {
  duration: number; // minutes
  estimatedEarnings: number;
  zonesVisited: string[];
}

