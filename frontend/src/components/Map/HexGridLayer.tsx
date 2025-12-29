import { useMemo } from 'react';
import { Polygon, Tooltip } from 'react-leaflet';
import { cellToBoundary, polygonToCells } from 'h3-js';
import type { ZoneScore } from '../../types';
import allZonesGeoJSON from '../../data/allZones.json';

// H3 Resolution: 9 is good for neighborhood blocks (~170m edge)
// 10 is very fine (~66m edge).
const H3_RESOLUTION = 9; 

interface HexGridLayerProps {
  zones: ZoneScore[];
  onZoneClick?: (zone: ZoneScore) => void;
}

// Re-using the color logic but optimized for hexes
function getHexStyle(score: number) {
  // Smooth opacity curve
  // < 40: Very transparent (0.1 - 0.2)
  // 40-60: Medium (0.3 - 0.5)
  // > 60: Solid (0.6 - 0.8)
  
  let fillColor = '#3b82f6'; // Blue
  let fillOpacity = 0.1;

  if (score >= 85) {
    fillColor = '#ff0055'; // Neon Pink
    fillOpacity = 0.6;
  } else if (score >= 70) {
    fillColor = '#d946ef'; // Neon Fuchsia
    fillOpacity = 0.5;
  } else if (score >= 55) {
    fillColor = '#f59e0b'; // Neon Amber
    fillOpacity = 0.45;
  } else if (score >= 40) {
    fillColor = '#06b6d4'; // Neon Cyan
    fillOpacity = 0.3;
  } else {
    // Low score
    fillColor = '#3b82f6';
    fillOpacity = 0.1;
  }

  return {
    fillColor,
    fillOpacity,
    stroke: false, // Ensure seamless look
    weight: 0,
  };
}

export function HexGridLayer({ zones, onZoneClick }: HexGridLayerProps) {
  // 1. Compute the Hex Grid from the Zones
  // We use useMemo to avoid recalculating on every render unless zones change
  const hexData = useMemo(() => {
    const hexMap = new Map<string, { score: number; zoneName: string; zoneId: string }>();
    
    // Create a map for fast score lookup
    const zoneScoreMap = new Map(zones.map(z => [z.id, z]));

    (allZonesGeoJSON as any).features.forEach((feature: any) => {
      const zoneId = feature.properties.id;
      const zoneData = zoneScoreMap.get(zoneId);
      
      if (!zoneData) return; // Skip if no score data

      // GeoJSON is [lng, lat], H3 needs [lat, lng] for polygonToCells
      const coordinates = feature.geometry.coordinates[0].map((coord: number[]) => [coord[1], coord[0]]);
      
      // Get all hexes in this polygon
      const hexes = polygonToCells(coordinates, H3_RESOLUTION, true);

      hexes.forEach((h3Index: string) => {
        // If hex is already there, take the MAX score (handle overlap)
        const existing = hexMap.get(h3Index);
        if (!existing || zoneData.score > existing.score) {
          hexMap.set(h3Index, {
            score: zoneData.score,
            zoneName: zoneData.name,
            zoneId: zoneData.id
          });
        }
      });
    });

    return Array.from(hexMap.entries());
  }, [zones]);

  return (
    <>
      {hexData.map(([h3Index, data]) => {
        // cellToBoundary returns [[lat, lng], ...]
        const boundary = cellToBoundary(h3Index);
        const style = getHexStyle(data.score);

        return (
          <Polygon
            key={h3Index}
            positions={boundary}
            pathOptions={style}
            eventHandlers={{
              click: () => {
                const z = zones.find(z => z.id === data.zoneId);
                if (z && onZoneClick) onZoneClick(z);
              },
              mouseover: (e) => {
                e.target.setStyle({
                  fillOpacity: 0.8, // Highlight on hover
                });
              },
              mouseout: (e) => {
                e.target.setStyle({
                  fillOpacity: style.fillOpacity,
                });
              }
            }}
          >
           {/* Only show tooltip for high value cells to reduce DOM load if needed, 
               but for now we include it for all */}
           <Tooltip sticky direction="top" className="custom-tooltip">
             <div className="text-sm font-bold">
               <div className="text-white">{data.zoneName}</div>
               <div className="text-theme-primary">Score: {data.score}</div>
             </div>
           </Tooltip>
          </Polygon>
        );
      })}
    </>
  );
}
