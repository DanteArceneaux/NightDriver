import { useMemo } from 'react';
import { Polygon, Tooltip } from 'react-leaflet';
import { cellToBoundary, latLngToCell, gridDisk } from 'h3-js';
import type { ZoneScore } from '../../types';
import allZonesGeoJSON from '../../data/allZones.json';

// H3 Resolution: 8 (approx 0.7km edge) - Good for city blocks
const H3_RESOLUTION = 8; 

// Radius to fill for each zone (in hex rings)
// Adjust based on typical zone size
const FILL_RADIUS = 2; 

interface HexGridLayerProps {
  zones: ZoneScore[];
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

export function HexGridLayer({ zones, onZoneClick }: HexGridLayerProps) {
  const hexData = useMemo(() => {
    const hexMap = new Map<string, { score: number; zoneName: string; zoneId: string }>();
    const zoneScoreMap = new Map(zones.map(z => [z.id, z]));

    (allZonesGeoJSON as any).features.forEach((feature: any) => {
      const zoneId = feature.properties.id;
      const zoneData = zoneScoreMap.get(zoneId);
      
      if (!zoneData) return;

      try {
        // Robust Method: Centroid + Radial Fill
        // 1. Get Centroid
        // GeoJSON coordinates are [lng, lat]
        const rawCoords = feature.geometry.coordinates[0];
        const [centerLat, centerLng] = getPolygonCentroid(rawCoords);

        // 2. Get Center Hex
        const centerHex = latLngToCell(centerLat, centerLng, H3_RESOLUTION);

        // 3. Fill neighbors (create a cluster of hexes)
        const hexes = gridDisk(centerHex, FILL_RADIUS);

        hexes.forEach((h3Index: string) => {
          const existing = hexMap.get(h3Index);
          // Overwrite if this zone has a higher score
          if (!existing || zoneData.score > existing.score) {
            hexMap.set(h3Index, {
              score: zoneData.score,
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
  }, [zones]);

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
             </div>
           </Tooltip>
          </Polygon>
        );
      })}
    </>
  );
}
