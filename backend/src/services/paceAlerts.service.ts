/**
 * Pace Alerts Service
 * 
 * Track earnings pace and alert if falling behind goal.
 */

export interface PaceAlert {
  status: 'ahead' | 'on_track' | 'behind' | 'critical';
  message: string;
  recommendation: string;
  projectedDailyEarnings: number;
  neededHourlyRate: number;
}

export class PaceAlertsService {
  /**
   * Calculate pace alert
   */
  calculatePace(
    currentEarnings: number,
    hoursWorked: number,
    dailyGoal: number,
    plannedTotalHours: number
  ): PaceAlert {
    const currentHourlyRate = hoursWorked > 0 ? currentEarnings / hoursWorked : 0;
    const hoursRemaining = plannedTotalHours - hoursWorked;
    const earningsNeeded = dailyGoal - currentEarnings;
    const neededHourlyRate = hoursRemaining > 0 ? earningsNeeded / hoursRemaining : 0;
    const projectedDailyEarnings = currentEarnings + (currentHourlyRate * hoursRemaining);

    let status: PaceAlert['status'];
    let message: string;
    let recommendation: string;

    const percentOfGoal = (currentEarnings / dailyGoal) * 100;

    if (projectedDailyEarnings >= dailyGoal * 1.1) {
      status = 'ahead';
      message = `🔥 Crushing it! ${percentOfGoal.toFixed(0)}% of goal. Projected: $${projectedDailyEarnings.toFixed(0)}`;
      recommendation = 'Keep current pace or take a break';
    } else if (projectedDailyEarnings >= dailyGoal * 0.95) {
      status = 'on_track';
      message = `✓ On track. ${percentOfGoal.toFixed(0)}% of goal. Projected: $${projectedDailyEarnings.toFixed(0)}`;
      recommendation = 'Maintain current effort';
    } else if (projectedDailyEarnings >= dailyGoal * 0.8) {
      status = 'behind';
      message = `⚠️ Falling behind. ${percentOfGoal.toFixed(0)}% of goal. Need $${neededHourlyRate.toFixed(0)}/hr`;
      recommendation = 'Increase pace or extend shift by 1-2 hours';
    } else {
      status = 'critical';
      message = `🚨 Significantly behind. ${percentOfGoal.toFixed(0)}% of goal. Need $${neededHourlyRate.toFixed(0)}/hr`;
      recommendation = 'Focus on high-value zones or extend shift significantly';
    }

    return {
      status,
      message,
      recommendation,
      projectedDailyEarnings,
      neededHourlyRate,
    };
  }
}

