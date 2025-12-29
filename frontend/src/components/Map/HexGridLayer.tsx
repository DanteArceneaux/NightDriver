import { useMemo } from 'react';
import { Polygon, Tooltip } from 'react-leaflet';
import { cellToBoundary, polygonToCells, latLngToCell } from 'h3-js';
import type { ZoneScore } from '../../types';
import allZonesGeoJSON from '../../data/allZones.json';

// H3 Resolution: 8 is better for city-wide visibility (~0.7km edge)
// 9 was too fine (~170m) and hard to see at zoom 9-11
const H3_RESOLUTION = 8; 

interface HexGridLayerProps {
  zones: ZoneScore[];
  onZoneClick?: (zone: ZoneScore) => void;
}

// Uber-like color scale
function getHexStyle(score: number) {
  let fillColor = '#3b82f6'; // Blue
  let fillOpacity = 0.4; // Higher base opacity

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
    // Low score
    fillColor = '#3b82f6';
    fillOpacity = 0.3;
  }

  return {
    fillColor,
    fillOpacity,
    stroke: false, // Seamless
    weight: 0,
  };
}

export function HexGridLayer({ zones, onZoneClick }: HexGridLayerProps) {
  const hexData = useMemo(() => {
    const hexMap = new Map<string, { score: number; zoneName: string; zoneId: string }>();
    const zoneScoreMap = new Map(zones.map(z => [z.id, z]));

    (allZonesGeoJSON as any).features.forEach((feature: any) => {
      const zoneId = feature.properties.id;
      const zoneData = zoneScoreMap.get(zoneId);
      
      if (!zoneData) return;

      // GeoJSON [lng, lat] -> H3 [lat, lng]
      const coordinates = feature.geometry.coordinates[0].map((coord: number[]) => [coord[1], coord[0]]);
      
      try {
        let hexes = polygonToCells(coordinates, H3_RESOLUTION, true);
        
        // Fallback for small zones that might get missed by H3 grid center-point check
        if (hexes.length === 0) {
           const centerLat = coordinates[0][0];
           const centerLng = coordinates[0][1];
           hexes = [latLngToCell(centerLat, centerLng, H3_RESOLUTION)];
        }

        hexes.forEach((h3Index: string) => {
          const existing = hexMap.get(h3Index);
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
