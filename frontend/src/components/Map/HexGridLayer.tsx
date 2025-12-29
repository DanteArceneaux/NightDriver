import { useMemo } from 'react';
import { Polygon, Tooltip } from 'react-leaflet';
import { cellToBoundary, latLngToCell, gridDisk } from 'h3-js';
import type { ZoneScore, Event } from '../../types';
import allZonesGeoJSON from '../../data/allZones.json';

// H3 Resolution: 8 (approx 0.7km edge) - Good for city blocks
const H3_RESOLUTION = 8; 

// Radius to fill for each zone (in hex rings)
const FILL_RADIUS = 2; 

interface HexGridLayerProps {
  zones: ZoneScore[];
  events?: Event[]; // Add events prop to calculate blast radius
  onZoneClick?: (zone: ZoneScore) => void;
}

function getHexStyle(score: number) {
  let fillColor = '#3b82f6'; 
  let fillOpacity = 0.5;

  if (score >= 85) {
    fillColor = '#ff0055'; // Neon Pink
    fillOpacity = 0.8;
  } else if (score >= 70) {
    fillColor = '#d946ef'; // Neon Fuchsia
    fillOpacity = 0.7;
  } else if (score >= 55) {
    fillColor = '#f59e0b'; // Neon Amber
    fillOpacity = 0.6;
  } else if (score >= 40) {
    fillColor = '#06b6d4'; // Neon Cyan
    fillOpacity = 0.5;
  } else {
    fillColor = '#3b82f6';
    fillOpacity = 0.3;
  }

  return {
    fillColor,
    fillOpacity,
    stroke: false,
    weight: 0,
  };
}

// Helper to find polygon centroid
function getPolygonCentroid(coordinates: number[][]): [number, number] {
  let latSum = 0;
  let lngSum = 0;
  coordinates.forEach(coord => {
    lngSum += coord[0];
    latSum += coord[1];
  });
  return [latSum / coordinates.length, lngSum / coordinates.length];
}

export function HexGridLayer({ zones, events = [], onZoneClick }: HexGridLayerProps) {
  // We need a way to look up venue coordinates. 
  const KEY_VENUES: Record<string, [number, number]> = {
    'lumen field': [47.5952, -122.3316],
    't-mobile park': [47.5914, -122.3325],
    'climate pledge arena': [47.6220, -122.3540],
  };

  const hexData = useMemo(() => {
    const hexMap = new Map<string, { score: number; zoneName: string; zoneId: string }>();
    const zoneScoreMap = new Map(zones.map(z => [z.id, z]));

    // 1. Identify Active Event Hotspots
    const activeEventCenters: [number, number][] = [];
    const now = new Date();
    
    events.forEach(event => {
      const start = new Date(event.startTime);
      const end = new Date(event.endTime);
      // Active if starting within 1 hour or currently happening
      if (now >= new Date(start.getTime() - 3600000) && now <= end) {
         const venueName = event.venue.toLowerCase();
         // Find coords
         const coords = Object.entries(KEY_VENUES).find(([k]) => venueName.includes(k))?.[1];
         if (coords) {
           activeEventCenters.push(coords);
         }
      }
    });

    (allZonesGeoJSON as any).features.forEach((feature: any) => {
      const zoneId = feature.properties.id;
      const zoneData = zoneScoreMap.get(zoneId);
      
      if (!zoneData) return;

      try {
        const rawCoords = feature.geometry.coordinates[0];
        const [centerLat, centerLng] = getPolygonCentroid(rawCoords);
        const centerHex = latLngToCell(centerLat, centerLng, H3_RESOLUTION);
        const hexes = gridDisk(centerHex, FILL_RADIUS);

        hexes.forEach((h3Index: string) => {
          const boundary = cellToBoundary(h3Index);
          const hexLat = boundary[0][0];
          const hexLng = boundary[0][1];
          
          let score = zoneData.score;
          
          // Apply "Blast Radius" Boost
          // If this hex is close to an active event, Force Surge to 100
          for (const [evtLat, evtLng] of activeEventCenters) {
             // Rough distance check (pythagorean on lat/lng is fine for short distances)
             // 1 deg lat ~ 111km. 0.0045 deg ~ 500m.
             const dLat = hexLat - evtLat;
             const dLng = hexLng - evtLng;
             const distDeg = Math.sqrt(dLat*dLat + dLng*dLng);
             
             if (distDeg < 0.006) { // Approx 600-700m radius
                score = Math.max(score, 98); // FORCE SURGE
             }
          }

          const existing = hexMap.get(h3Index);
          if (!existing || score > existing.score) {
            hexMap.set(h3Index, {
              score: score,
              zoneName: zoneData.name,
              zoneId: zoneData.id
            });
          }
        });
      } catch (err) {
        console.warn(`HexGridLayer: Error processing ${zoneId}`, err);
      }
    });

    return Array.from(hexMap.entries());
  }, [zones, events]);

  return (
    <>
      {hexData.map(([h3Index, data]) => {
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
                e.target.setStyle({ fillOpacity: 0.9 });
              },
              mouseout: (e) => {
                e.target.setStyle({ fillOpacity: style.fillOpacity });
              }
            }}
          >
           <Tooltip sticky direction="top" className="custom-tooltip">
             <div className="text-sm font-bold">
               <div className="text-white">{data.zoneName}</div>
               <div className="text-theme-primary">Score: {data.score}</div>
               {data.score > 95 && (
                 <div className="text-neon-pink text-xs uppercase tracking-wider animate-pulse">
                   Event Surge!
                 </div>
               )}
             </div>
           </Tooltip>
          </Polygon>
        );
      })}
    </>
  );
}
