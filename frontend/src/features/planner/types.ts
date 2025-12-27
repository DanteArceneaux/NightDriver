export interface TomorrowPrediction {
  date: string;
  bestStartTime: string; // HH:MM format
  estimatedEarningsLow: number;
  estimatedEarningsHigh: number;
  peakHours: Array<{
    time: string;
    score: number;
    reason: string;
  }>;
  events: Array<{
    name: string;
    time: string;
    impact: 'high' | 'medium' | 'low';
  }>;
  recommendedShiftLength: number; // hours
}

