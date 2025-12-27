import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, CircleMarker, Marker, Tooltip, useMap } from 'react-leaflet';
import L from 'leaflet';
import { ZoneScore, Event } from '../../types';
import { fetchConditions } from '../../lib/api';
import { useTheme } from '../../features/theme';
import 'leaflet/dist/leaflet.css';

interface SeattleMapProps {
  zones: ZoneScore[];
  onZoneClick?: (zone: ZoneScore) => void;
}

// Venue coordinates for major Seattle venues
const VENUE_COORDINATES: Record<string, { lat: number; lng: number }> = {
  'lumen field': { lat: 47.5952, lng: -122.3316 },
  't-mobile park': { lat: 47.5914, lng: -122.3325 },
  'climate pledge arena': { lat: 47.6220, lng: -122.3540 },
  'paramount theatre': { lat: 47.6129, lng: -122.3331 },
  'moore theatre': { lat: 47.6116, lng: -122.3398 },
  'showbox': { lat: 47.6085, lng: -122.3401 },
  'neumos': { lat: 47.6193, lng: -122.3204 },
  'neptune theatre': { lat: 47.6609, lng: -122.3127 },
  'pike place': { lat: 47.6097, lng: -122.3419 },
  'seattle center': { lat: 47.6205, lng: -122.3540 },
};

function getColorForScore(score: number): { fill: string; stroke: string; glow: string } {
  if (score >= 80) return { 
    fill: '#ff0055', 
    stroke: '#aa00ff', 
    glow: 'rgba(255, 0, 85, 0.6)' 
  }; // Neon pink/purple (surge)
  if (score >= 60) return { 
    fill: '#ffaa00', 
    stroke: '#ff0055', 
    glow: 'rgba(255, 170, 0, 0.5)' 
  }; // Neon orange/pink (hot)
  if (score >= 40) return { 
    fill: '#00ffee', 
    stroke: '#3b82f6', 
    glow: 'rgba(0, 255, 238, 0.4)' 
  }; // Neon cyan (warm)
  return { 
    fill: '#3b82f6', 
    stroke: '#1e40af', 
    glow: 'rgba(59, 130, 246, 0.3)' 
  }; // Blue (cool)
}

// Get venue coordinates from venue name
function getVenueCoordinates(venueName: string): { lat: number; lng: number } | null {
  const lowerVenue = venueName.toLowerCase();
  for (const [key, coords] of Object.entries(VENUE_COORDINATES)) {
    if (lowerVenue.includes(key)) {
      return coords;
    }
  }
  return null;
}

// Create custom event icon with urgency ring
function createEventIcon(emoji: string, isUrgent: boolean, themeId: string) {
  const ringColor = themeId === 'pro' 
    ? 'rgba(59, 130, 246, 0.8)'  // Pro: blue
    : themeId === 'hud'
    ? 'rgba(168, 85, 247, 0.9)'  // HUD: purple
    : 'rgba(255, 170, 0, 0.9)';   // Neon: orange
    
  const glowColor = themeId === 'pro'
    ? 'rgba(59, 130, 246, 0.5)'
    : themeId === 'hud'
    ? 'rgba(236, 72, 153, 0.6)'
    : 'rgba(255, 0, 85, 0.6)';

  return L.divIcon({
    className: 'custom-event-marker',
    html: `
      <div style="position: relative; width: 48px; height: 48px; display: flex; align-items: center; justify-content: center;">
        ${isUrgent ? `
          <div class="animate-pulse" style="
            position: absolute;
            width: 40px;
            height: 40px;
            border: 3px solid ${ringColor};
            border-radius: 50%;
            box-shadow: 0 0 15px ${glowColor};
          "></div>
        ` : ''}
        <div style="
          font-size: 32px;
          text-shadow: 0 0 10px ${glowColor};
          filter: drop-shadow(0 3px 6px rgba(0, 0, 0, 0.6));
          position: relative;
          z-index: 10;
        ">
          ${emoji}
        </div>
      </div>
    `,
    iconSize: [48, 48],
    iconAnchor: [24, 24],
  });
}

function getEventEmoji(type?: string): string {
  switch (type) {
    case 'sports':
      return '⚽';
    case 'concert':
      return '🎵';
    case 'conference':
      return '💼';
    case 'festival':
      return '🎉';
    default:
      return '🎫';
  }
}

// Component to add pulsing animation style to map
function MapStyleInjector() {
  useMap(); // Just to ensure component is within MapContainer
  
  useEffect(() => {
    // Inject pulsing animation CSS
    const style = document.createElement('style');
    style.innerHTML = `
      @keyframes pulse-marker {
        0%, 100% { 
          r: attr(data-base-radius); 
          opacity: 0.8; 
        }
        50% { 
          opacity: 1; 
        }
      }
      .pulse-marker {
        animation: pulse-marker 2s ease-in-out infinite;
      }
      .leaflet-tooltip {
        background: rgba(10, 14, 39, 0.95) !important;
        border: 1px solid rgba(0, 255, 238, 0.3) !important;
        border-radius: 8px !important;
        backdrop-filter: blur(10px);
        box-shadow: 0 4px 20px rgba(0, 0, 0, 0.5);
      }
      .leaflet-tooltip-top:before {
        border-top-color: rgba(10, 14, 39, 0.95) !important;
      }
      .custom-event-marker {
        background: transparent;
        border: none;
      }
    `;
    document.head.appendChild(style);
    
    return () => {
      document.head.removeChild(style);
    };
  }, []);
  
  return null;
}

export function SeattleMap({ zones, onZoneClick }: SeattleMapProps) {
  // Center map between Marysville (north) and Spanaway (south), Seattle (west) and Sammamish (east)
  const center: [number, number] = [47.5500, -122.2000]; // Adjusted to show full metro area
  const zoom = 9; // Zoomed out to show from Marysville to Spanaway
  const [events, setEvents] = useState<Event[]>([]);
  const { id: themeId } = useTheme();

  useEffect(() => {
    const loadEvents = async () => {
      try {
        const conditions = await fetchConditions();
        setEvents(conditions.events);
      } catch (error) {
        console.error('Failed to load events for map:', error);
      }
    };
    loadEvents();
  }, []);

  return (
    <div className="w-full h-full rounded-2xl overflow-hidden shadow-2xl border border-white/10">
      <MapContainer
        center={center}
        zoom={zoom}
        className="w-full h-full"
        zoomControl={true}
        style={{ background: '#0a0e27' }}
      >
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/dark_nolabels/{z}/{x}/{y}{r}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        />
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/dark_only_labels/{z}/{x}/{y}{r}.png"
          attribution=''
        />
        <MapStyleInjector />

        {/* Zone Markers */}
        {zones.map((zone) => {
          const colors = getColorForScore(zone.score);
          const baseRadius = 12 + (zone.score / 100) * 13;

          return (
            <CircleMarker
              key={zone.id}
              center={[zone.coordinates.lat, zone.coordinates.lng]}
              radius={baseRadius}
              pathOptions={{
                fillColor: colors.fill,
                color: colors.stroke,
                weight: 3,
                opacity: 0.9,
                fillOpacity: 0.7,
                className: zone.score >= 80 ? 'pulse-marker' : '',
              }}
              eventHandlers={{
                click: () => onZoneClick?.(zone),
              }}
            >
              <Tooltip 
                direction="top" 
                offset={[0, -10]} 
                opacity={1}
                className="custom-tooltip"
              >
                <div className="text-sm">
                  <div className="font-bold text-white text-base mb-1">{zone.name}</div>
                  <div className="text-neon-cyan font-bold text-lg mb-2">Score: {zone.score}</div>
                  <div className="text-xs text-gray-300 space-y-1">
                    <div className="text-gray-400">Base: {zone.factors.baseline}</div>
                    {zone.factors.events > 0 && (
                      <div className="text-neon-orange">🎵 Events: +{zone.factors.events}</div>
                    )}
                    {zone.factors.weather > 0 && (
                      <div className="text-blue-400">🌧️ Weather: +{zone.factors.weather}</div>
                    )}
                    {zone.factors.flights > 0 && (
                      <div className="text-neon-green">✈️ Flights: +{zone.factors.flights}</div>
                    )}
                  </div>
                </div>
              </Tooltip>
            </CircleMarker>
          );
        })}

        {/* Event Markers */}
        {events.map((event, idx) => {
          const coords = getVenueCoordinates(event.venue);
          if (!coords) return null;

          const now = new Date();
          const start = new Date(event.startTime);
          const end = new Date(event.endTime);
          const minsUntilStart = (start.getTime() - now.getTime()) / (1000 * 60);
          const minsUntilEnd = (end.getTime() - now.getTime()) / (1000 * 60);
          
          // Urgent if ending in <2h or starting in <2h
          const isUrgent = (minsUntilEnd > 0 && minsUntilEnd < 120) || (minsUntilStart > 0 && minsUntilStart < 120);
          const isLive = minsUntilStart < 0 && minsUntilEnd > 0;
          
          let statusText = '';
          if (isLive) {
            statusText = minsUntilEnd < 60 ? `Ends in ${Math.floor(minsUntilEnd)}m` : `Live Now`;
          } else if (minsUntilStart > 0 && minsUntilStart < 120) {
            const hours = Math.floor(minsUntilStart / 60);
            const mins = Math.floor(minsUntilStart % 60);
            statusText = hours === 0 ? `Starts in ${mins}m` : `Starts in ${hours}h`;
          }

          return (
            <Marker
              key={`event-${idx}`}
              position={[coords.lat, coords.lng]}
              icon={createEventIcon(getEventEmoji(event.type), isUrgent, themeId)}
            >
              <Tooltip direction="top" offset={[0, -24]} opacity={1}>
                <div className="text-sm max-w-xs">
                  <div className="font-bold text-white text-base mb-1">{event.name}</div>
                  <div className="text-neon-orange text-xs mb-1">{event.venue}</div>
                  <div className="text-gray-300 text-xs mb-1">
                    {new Date(event.startTime).toLocaleTimeString('en-US', { 
                      hour: 'numeric', 
                      minute: '2-digit' 
                    })}
                  </div>
                  {statusText && (
                    <div className={`font-bold text-xs mt-1 ${
                      isLive ? 'text-neon-green' : 'text-neon-orange'
                    }`}>
                      {statusText}
                    </div>
                  )}
                  {event.imageUrl && (
                    <img
                      src={event.imageUrl}
                      alt={event.name}
                      className="w-full h-20 object-cover rounded mt-2"
                      onError={(e) => e.currentTarget.style.display = 'none'}
                    />
                  )}
                </div>
              </Tooltip>
            </Marker>
          );
        })}
      </MapContainer>
    </div>
  );
}

