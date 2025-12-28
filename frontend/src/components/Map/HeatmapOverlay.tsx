import { Circle, Popup } from 'react-leaflet';
import { DollarSign, MapPin, Clock } from 'lucide-react';
import { usePersonalHeatmap } from '../../hooks/usePersonalHeatmap';
import type { ZoneScore } from '../../types';

interface HeatmapOverlayProps {
  enabled: boolean;
  zones: ZoneScore[];
}

export function HeatmapOverlay({ enabled, zones }: HeatmapOverlayProps) {
  const heatmapData = usePersonalHeatmap();
  const zoneByIdMap = new Map(zones.map(zone => [zone.id, zone]));

  if (!enabled || heatmapData.length === 0) {
    return null;
  }

  const getHeatmapColor = (intensity: number): string => {
    // Gradient from blue (low) to red (high)
    if (intensity >= 80) return '#ef4444'; // red
    if (intensity >= 60) return '#f97316'; // orange
    if (intensity >= 40) return '#eab308'; // yellow
    if (intensity >= 20) return '#22c55e'; // green
    return '#3b82f6'; // blue
  };

  const formatDuration = (minutes: number): string => {
    const hours = Math.floor(minutes / 60);
    const mins = Math.round(minutes % 60);
    return `${hours}h ${mins}m`;
  };

  return (
    <>
      {heatmapData.map((data) => {
        const zone = zoneByIdMap.get(data.zoneId);
        if (!zone) return null;

        const color = getHeatmapColor(data.intensity);
        const radius = 500 + (data.intensity * 10); // Base 500m, up to 1.5km

        return (
          <Circle
            key={`heatmap-${data.zoneId}`}
            center={[zone.coordinates.lat, zone.coordinates.lng]}
            radius={radius}
            pathOptions={{
              color: color,
              fillColor: color,
              fillOpacity: 0.2 + (data.intensity / 200), // 0.2 to 0.7 opacity
              weight: 2,
              opacity: 0.6,
            }}
          >
            <Popup>
              <div className="p-2">
                <div className="font-bold text-base mb-2 flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-purple-500" />
                  {zone.name}
                </div>
                <div className="space-y-1 text-sm">
                  <div className="flex items-center gap-2">
                    <span className="text-gray-600">Visits:</span>
                    <span className="font-bold">{data.visits}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="w-3 h-3 text-blue-500" />
                    <span className="text-gray-600">Time:</span>
                    <span className="font-bold">{formatDuration(data.totalMinutes)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <DollarSign className="w-3 h-3 text-green-500" />
                    <span className="text-gray-600">Avg Rate:</span>
                    <span className="font-bold">${Math.round(data.averageHourlyRate)}/hr</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-gray-600">Total Earned:</span>
                    <span className="font-bold text-green-600">${Math.round(data.totalEarnings)}</span>
                  </div>
                </div>
              </div>
            </Popup>
          </Circle>
        );
      })}
    </>
  );
}

