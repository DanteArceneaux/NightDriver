import { useMemo } from 'react';
import type { TomorrowPrediction } from '../features/planner/types';

export function useTomorrowPrediction(): TomorrowPrediction | null {
  const prediction = useMemo(() => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const dayOfWeek = tomorrow.getDay();
    
    // Determine best start time based on day of week
    let bestStartTime = '17:00'; // Default evening rush
    let estimatedLow = 150;
    let estimatedHigh = 220;
    
    const peakHours: TomorrowPrediction['peakHours'] = [];
    
    // Weekend logic
    if (dayOfWeek === 5 || dayOfWeek === 6) { // Friday or Saturday
      bestStartTime = '18:00';
      estimatedLow = 200;
      estimatedHigh = 300;
      
      peakHours.push(
        { time: '18:00', score: 75, reason: 'Dinner rush + pre-nightlife' },
        { time: '22:00', score: 85, reason: 'Bar/club prime time' },
        { time: '01:00', score: 80, reason: 'Bar close surge' }
      );
    } 
    // Weekday logic
    else if (dayOfWeek >= 1 && dayOfWeek <= 4) {
      bestStartTime = '17:00';
      estimatedLow = 140;
      estimatedHigh = 200;
      
      peakHours.push(
        { time: '17:00', score: 70, reason: 'Evening commute' },
        { time: '19:00', score: 65, reason: 'Dinner hour' }
      );
    }
    // Sunday
    else {
      bestStartTime = '16:00';
      estimatedLow = 120;
      estimatedHigh = 180;
      
      peakHours.push(
        { time: '16:00', score: 60, reason: 'Sunday errands' },
        { time: '18:00', score: 55, reason: 'Dinner time' }
      );
    }

    // Calculate recommended shift length based on estimated earnings
    const avgEarnings = (estimatedLow + estimatedHigh) / 2;
    const recommendedShiftLength = Math.ceil(avgEarnings / 30); // Assuming $30/hr average

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

