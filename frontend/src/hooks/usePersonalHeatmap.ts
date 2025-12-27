import { useMemo } from 'react';
import { useHistoryStore } from '../features/history';

interface HeatmapData {
  zoneId: string;
  visits: number;
  totalEarnings: number;
  totalMinutes: number;
  averageHourlyRate: number;
  intensity: number; // 0-100 for visual representation
}

export function usePersonalHeatmap(): HeatmapData[] {
  const { shifts } = useHistoryStore();

  const heatmapData = useMemo(() => {
    const zoneMap = new Map<string, {
      visits: number;
      totalEarnings: number;
      totalMinutes: number;
    }>();

    // Aggregate data by zone
    shifts.forEach(shift => {
      shift.zonesVisited.forEach(zoneId => {
        const existing = zoneMap.get(zoneId) || {
          visits: 0,
          totalEarnings: 0,
          totalMinutes: 0,
        };

        zoneMap.set(zoneId, {
          visits: existing.visits + 1,
          totalEarnings: existing.totalEarnings + (shift.estimatedEarnings / shift.zonesVisited.length),
          totalMinutes: existing.totalMinutes + (shift.durationMinutes / shift.zonesVisited.length),
        });
      });
    });

    // Convert to array and calculate metrics
    const data: HeatmapData[] = [];
    const maxVisits = Math.max(...Array.from(zoneMap.values()).map(z => z.visits), 1);

    zoneMap.forEach((value, zoneId) => {
      const averageHourlyRate = value.totalMinutes > 0
        ? (value.totalEarnings / value.totalMinutes) * 60
        : 0;

      data.push({
        zoneId,
        visits: value.visits,
        totalEarnings: value.totalEarnings,
        totalMinutes: value.totalMinutes,
        averageHourlyRate,
        intensity: (value.visits / maxVisits) * 100,
      });
    });

    return data.sort((a, b) => b.visits - a.visits);
  }, [shifts]);

  return heatmapData;
}

