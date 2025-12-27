import { useEffect, useState } from 'react';
import type { ZoneScore, Coordinates } from '../types';
import { calculateDistance, estimateDriveTime, calculateEfficiency } from '../lib/distance';
import { useShiftStore } from '../features/shift/store';

export interface MoveRecommendation {
  shouldMove: boolean;
  targetZone: ZoneScore | null;
  reason: string;
  efficiencyGain: number; // Percentage improvement
  distance: number;
  driveTime: number;
}

export function useMoveRecommendation(
  zones: ZoneScore[],
  driverLocation: Coordinates | null
): MoveRecommendation | null {
  const [recommendation, setRecommendation] = useState<MoveRecommendation | null>(null);
  const { currentZoneId, currentGoal } = useShiftStore();

  useEffect(() => {
    if (!driverLocation || zones.length === 0) {
      setRecommendation(null);
      return;
    }

    // Find current zone
    const currentZone = currentZoneId
      ? zones.find(z => z.id === currentZoneId)
      : null;

    if (!currentZone) {
      setRecommendation(null);
      return;
    }

    // Calculate efficiency for all zones
    const zonesWithEfficiency = zones.map(zone => {
      const distance = calculateDistance(driverLocation, zone.coordinates);
      const driveTime = estimateDriveTime(distance);
      const efficiency = calculateEfficiency(zone.score, driveTime);
      
      return {
        zone,
        distance,
        driveTime,
        efficiency,
      };
    });

    // Apply goal-based weighting
    const weightedZones = zonesWithEfficiency.map(item => {
      let adjustedEfficiency = item.efficiency;
      
      if (currentGoal === 'max_earnings') {
        // Heavily favor high scores, less weight on distance
        adjustedEfficiency = item.zone.score * 0.8 + item.efficiency * 0.2;
      } else if (currentGoal === 'short_distance') {
        // Heavily favor nearby zones
        const distancePenalty = Math.max(0, 100 - item.distance * 10);
        adjustedEfficiency = distancePenalty * 0.7 + item.efficiency * 0.3;
      }
      // 'balanced' uses raw efficiency
      
      return {
        ...item,
        adjustedEfficiency,
      };
    });

    // Sort by adjusted efficiency
    weightedZones.sort((a, b) => b.adjustedEfficiency - a.adjustedEfficiency);

    const bestZone = weightedZones[0];
    const currentEfficiency = calculateEfficiency(
      currentZone.score,
      estimateDriveTime(calculateDistance(driverLocation, currentZone.coordinates))
    );

    // Threshold: recommend move if 20% better efficiency
    const efficiencyGain = ((bestZone.adjustedEfficiency - currentEfficiency) / currentEfficiency) * 100;

    if (bestZone.zone.id !== currentZone.id && efficiencyGain >= 20) {
      // Generate reason
      let reason = '';
      if (bestZone.zone.score > currentZone.score + 15) {
        reason = `${bestZone.zone.name} has ${bestZone.zone.score - currentZone.score} points higher demand`;
      } else if (bestZone.distance < 2) {
        reason = `${bestZone.zone.name} is very close with better demand`;
      } else {
        reason = `${bestZone.zone.name} offers ${efficiencyGain.toFixed(0)}% better efficiency`;
      }

      setRecommendation({
        shouldMove: true,
        targetZone: bestZone.zone,
        reason,
        efficiencyGain,
        distance: bestZone.distance,
        driveTime: bestZone.driveTime,
      });
    } else {
      setRecommendation({
        shouldMove: false,
        targetZone: null,
        reason: 'Stay in current zone',
        efficiencyGain: 0,
        distance: 0,
        driveTime: 0,
      });
    }
  }, [zones, driverLocation, currentZoneId, currentGoal]);

  return recommendation;
}

