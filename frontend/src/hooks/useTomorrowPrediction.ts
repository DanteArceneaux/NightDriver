import { useMemo } from 'react';
import type { TomorrowPrediction } from '../features/planner/types';

export function useTomorrowPrediction(): TomorrowPrediction | null {
  const DEFAULT_BEST_START_TIME = '17:00'; // Default evening rush
  const DEFAULT_ESTIMATED_LOW = 150;
  const DEFAULT_ESTIMATED_HIGH = 220;

  const WEEKEND_BEST_START_TIME = '18:00';
  const WEEKEND_ESTIMATED_LOW = 200;
  const WEEKEND_ESTIMATED_HIGH = 300;
  const WEEKEND_DINNER_RUSH_TIME = '18:00';
  const WEEKEND_DINNER_RUSH_SCORE = 75;
  const WEEKEND_BAR_PRIME_TIME = '22:00';
  const WEEKEND_BAR_PRIME_SCORE = 85;
  const WEEKEND_BAR_CLOSE_SURGE_TIME = '01:00';
  const WEEKEND_BAR_CLOSE_SURGE_SCORE = 80;

  const WEEKDAY_BEST_START_TIME = '17:00';
  const WEEKDAY_ESTIMATED_LOW = 140;
  const WEEKDAY_ESTIMATED_HIGH = 200;
  const WEEKDAY_EVENING_COMMUTE_TIME = '17:00';
  const WEEKDAY_EVENING_COMMUTE_SCORE = 70;
  const WEEKDAY_DINNER_HOUR_TIME = '19:00';
  const WEEKDAY_DINNER_HOUR_SCORE = 65;

  const SUNDAY_BEST_START_TIME = '16:00';
  const SUNDAY_ESTIMATED_LOW = 120;
  const SUNDAY_ESTIMATED_HIGH = 180;
  const SUNDAY_ERRANDS_TIME = '16:00';
  const SUNDAY_ERRANDS_SCORE = 60;
  const SUNDAY_DINNER_TIME = '18:00';
  const SUNDAY_DINNER_SCORE = 55;

  const AVERAGE_HOURLY_RATE_ASSUMPTION = 30;

  const prediction = useMemo(() => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const dayOfWeek = tomorrow.getDay();
    
    // Determine best start time based on day of week
    let bestStartTime = DEFAULT_BEST_START_TIME; 
    let estimatedLow = DEFAULT_ESTIMATED_LOW;
    let estimatedHigh = DEFAULT_ESTIMATED_HIGH;
    
    const peakHours: TomorrowPrediction['peakHours'] = [];
    
    // Weekend logic
    if (dayOfWeek === 5 || dayOfWeek === 6) { // Friday or Saturday
      bestStartTime = WEEKEND_BEST_START_TIME;
      estimatedLow = WEEKEND_ESTIMATED_LOW;
      estimatedHigh = WEEKEND_ESTIMATED_HIGH;
      
      peakHours.push(
        { time: WEEKEND_DINNER_RUSH_TIME, score: WEEKEND_DINNER_RUSH_SCORE, reason: 'Dinner rush + pre-nightlife' },
        { time: WEEKEND_BAR_PRIME_TIME, score: WEEKEND_BAR_PRIME_SCORE, reason: 'Bar/club prime time' },
        { time: WEEKEND_BAR_CLOSE_SURGE_TIME, score: WEEKEND_BAR_CLOSE_SURGE_SCORE, reason: 'Bar close surge' }
      );
    } 
    // Weekday logic
    else if (dayOfWeek >= 1 && dayOfWeek <= 4) {
      bestStartTime = WEEKDAY_BEST_START_TIME;
      estimatedLow = WEEKDAY_ESTIMATED_LOW;
      estimatedHigh = WEEKDAY_ESTIMATED_HIGH;
      
      peakHours.push(
        { time: WEEKDAY_EVENING_COMMUTE_TIME, score: WEEKDAY_EVENING_COMMUTE_SCORE, reason: 'Evening commute' },
        { time: WEEKDAY_DINNER_HOUR_TIME, score: WEEKDAY_DINNER_HOUR_SCORE, reason: 'Dinner hour' }
      );
    }
    // Sunday
    else {
      bestStartTime = SUNDAY_BEST_START_TIME;
      estimatedLow = SUNDAY_ESTIMATED_LOW;
      estimatedHigh = SUNDAY_ESTIMATED_HIGH;
      
      peakHours.push(
        { time: SUNDAY_ERRANDS_TIME, score: SUNDAY_ERRANDS_SCORE, reason: 'Sunday errands' },
        { time: SUNDAY_DINNER_TIME, score: SUNDAY_DINNER_SCORE, reason: 'Dinner time' }
      );
    }

    // Calculate recommended shift length based on estimated earnings
    const avgEarnings = (estimatedLow + estimatedHigh) / 2;
    const recommendedShiftLength = Math.ceil(avgEarnings / AVERAGE_HOURLY_RATE_ASSUMPTION); // Assuming $30/hr average

    return {
      date: tomorrow.toISOString(),
      bestStartTime,
      estimatedEarningsLow: estimatedLow,
      estimatedEarningsHigh: estimatedHigh,
      peakHours,
      events: [], // TODO: Fetch from backend
      recommendedShiftLength,
    };
  }, []);

  return prediction;
}

