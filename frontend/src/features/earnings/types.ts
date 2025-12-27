export interface GoalProgress {
  dailyGoal: number;
  currentEarnings: number;
  percentComplete: number;
  pacePerHour: number;
  estimatedTimeToGoal: number; // minutes
  isOnPace: boolean;
}

export interface QuickEarnings {
  amount: number;
  timestamp: string;
}

export interface DailyGoal {
  amount: number;
  startTime: string;
  earnings: QuickEarnings[];
}
