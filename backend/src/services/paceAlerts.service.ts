export interface PaceAlert {
  status: 'ahead' | 'on_track' | 'behind';
  currentHourlyRate: number;
  requiredHourlyRate: number;
  difference: number;
  message: string;
}

export class PaceAlertsService {
  /**
   * Calculate earnings pace relative to goal
   */
  calculatePace(
    currentEarnings: number,
    hoursWorked: number,
    dailyGoal: number,
    plannedTotalHours: number
  ): PaceAlert {
    const currentHourlyRate = hoursWorked > 0 ? Math.round(currentEarnings / hoursWorked) : 0;
    const remainingGoal = Math.max(0, dailyGoal - currentEarnings);
    const remainingHours = Math.max(0.1, plannedTotalHours - hoursWorked);
    const requiredHourlyRate = Math.round(remainingGoal / remainingHours);

    let status: PaceAlert['status'] = 'on_track';
    let message = '';
    const difference = currentHourlyRate - requiredHourlyRate;

    if (currentEarnings >= dailyGoal) {
      status = 'ahead';
      message = "GOAL REACHED! You're in pure profit mode now.";
    } else if (difference > 5) {
      status = 'ahead';
      message = `You're \$${difference}/hr ahead of pace. Keep it up!`;
    } else if (difference < -5) {
      status = 'behind';
      message = `You're \$${Math.abs(difference)}/hr behind. Target higher score zones.`;
    } else {
      status = 'on_track';
      message = "You're right on track to hit your daily goal.";
    }

    return {
      status,
      currentHourlyRate,
      requiredHourlyRate,
      difference,
      message,
    };
  }
}
