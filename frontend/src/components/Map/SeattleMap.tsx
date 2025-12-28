import { useEffect, useState, useRef } from 'react';
import { MapContainer, TileLayer, CircleMarker, Marker, Tooltip, useMap, Polyline, Circle } from 'react-leaflet';
import { motion } from 'framer-motion';
import { Map as MapIcon, Satellite, TrendingUp, Navigation2, Gauge, Crosshair } from 'lucide-react';
import L from 'leaflet';
import { ZoneScore, Event } from '../../types';
import { fetchConditions } from '../../lib/api';
import { useTheme } from '../../features/theme';
import { HeatmapOverlay } from './HeatmapOverlay';
import 'leaflet/dist/leaflet.css';

interface SeattleMapProps {
  zones: ZoneScore[];
  onZoneClick?: (zone: ZoneScore) => void;
}

interface LivePosition {
  lat: number;
  lng: number;
  accuracy: number;
  speed: number | null; // m/s
  heading: number | null; // degrees
  timestamp: number;
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

// Component to handle map resize and add styling
function MapResizeHandler() {
  const map = useMap();
  
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
      .current-position-marker {
        background: transparent;
        border: none;
      }
    `;
    document.head.appendChild(style);
    
    // Set up ResizeObserver to handle container size changes
    const container = map.getContainer();
    let resizeTimeout: NodeJS.Timeout | null = null;
    
    const resizeObserver = new ResizeObserver(() => {
      // Throttle invalidateSize calls with requestAnimationFrame
      if (resizeTimeout) {
        clearTimeout(resizeTimeout);
      }
      
      resizeTimeout = setTimeout(() => {
        requestAnimationFrame(() => {
          map.invalidateSize();
        });
      }, 100); // Debounce 100ms to avoid excessive calls during drag
    });
    
    resizeObserver.observe(container);
    
    // Also call invalidateSize after a short delay to handle initial render
    const initialTimeout = setTimeout(() => {
      map.invalidateSize();
    }, 200);
    
    return () => {
      if (resizeTimeout) clearTimeout(resizeTimeout);
      clearTimeout(initialTimeout);
      resizeObserver.disconnect();
      document.head.removeChild(style);
    };
  }, [map]);
  
  return null;
}

// Component to handle centering on current position
function CenterOnPositionHandler({ 
  position, 
  shouldCenter,
  onCentered 
}: { 
  position: LivePosition | null; 
  shouldCenter: boolean;
  onCentered: () => void;
}) {
  const map = useMap();

  useEffect(() => {
    if (shouldCenter && position) {
      map.setView([position.lat, position.lng], 15, {
        animate: true,
        duration: 0.5,
      });
      // Reset the flag after centering
      setTimeout(() => onCentered(), 500);
    }
  }, [shouldCenter, position, map, onCentered]);

  return null;
}

// Create custom current position icon (Tesla-like car) - Memoized to prevent flashing
// Note: We don't rotate the icon itself anymore, just use a static icon
function createCurrentPositionIcon() {
  return L.divIcon({
    className: 'current-position-marker',
    html: `
      <div style="position: relative; width: 48px; height: 48px; display: flex; align-items: center; justify-content: center;">
        <!-- Pulsing background (smooth animation via CSS) -->
        <div style="
          position: absolute;
          width: 40px;
          height: 40px;
          border: 2px solid #ef4444;
          border-radius: 50%;
          background: rgba(239, 68, 68, 0.1);
          animation: pulseGlow 2s ease-in-out infinite;
        "></div>
        <!-- Tesla-style car icon -->
        <svg width="32" height="32" viewBox="0 0 24 24" style="position: relative; z-index: 10; filter: drop-shadow(0 2px 6px rgba(0, 0, 0, 0.8));">
          <!-- Car body -->
          <path d="M18.92 6.01C18.72 5.42 18.16 5 17.5 5H6.5c-.66 0-1.21.42-1.42 1.01L3 12v8c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1h12v1c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-8l-2.08-5.99z" fill="#ef4444" stroke="#dc2626" stroke-width="1"/>
          <!-- Windshield -->
          <path d="M6.5 7h11l1.5 4H5l1.5-4z" fill="#fca5a5" opacity="0.8"/>
          <!-- Left wheel -->
          <circle cx="7.5" cy="16" r="1.5" fill="#1f2937" stroke="#4b5563" stroke-width="0.5"/>
          <!-- Right wheel -->
          <circle cx="16.5" cy="16" r="1.5" fill="#1f2937" stroke="#4b5563" stroke-width="0.5"/>
          <!-- Tesla "T" badge (front of car) -->
          <g transform="translate(12, 8)">
            <rect x="-1" y="-1.5" width="2" height="1" fill="white" opacity="0.9"/>
            <rect x="-0.5" y="-0.5" width="1" height="2" fill="white" opacity="0.9"/>
          </g>
        </svg>
      </div>
      <style>
        @keyframes pulseGlow {
          0%, 100% { 
            transform: scale(1); 
            opacity: 0.6; 
          }
          50% { 
            transform: scale(1.1); 
            opacity: 0.9; 
          }
        }
      </style>
    `,
    iconSize: [48, 48],
    iconAnchor: [24, 24],
  });
}

export function SeattleMap({ zones, onZoneClick }: SeattleMapProps) {
  // Center map between Marysville (north) and Spanaway (south), Seattle (west) and Sammamish (east)
  const center: [number, number] = [47.5500, -122.2000]; // Adjusted to show full metro area
  const zoom = 9; // Zoomed out to show from Marysville to Spanaway
  const [events, setEvents] = useState<Event[]>([]);
  const { id: themeId } = useTheme();
  const [mapLayer, setMapLayer] = useState<'dark' | 'satellite'>('dark');
  const [showHeatmap, setShowHeatmap] = useState(false);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const [livePosition, setLivePosition] = useState<LivePosition | null>(null);
  const [positionHistory, setPositionHistory] = useState<Array<[number, number]>>([]);
  const watchIdRef = useRef<number | null>(null);
  const [shouldCenterOnPosition, setShouldCenterOnPosition] = useState(false);

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

  // Track live position
  useEffect(() => {
    if (!navigator.geolocation) {
      console.warn('Geolocation is not supported by this browser');
      return;
    }

    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        const newPos: LivePosition = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          accuracy: position.coords.accuracy,
          speed: position.coords.speed, // m/s, null if unavailable
          heading: position.coords.heading, // degrees, null if unavailable
          timestamp: position.timestamp,
        };

        console.log('📍 Position update:', {
          lat: newPos.lat.toFixed(6),
          lng: newPos.lng.toFixed(6),
          speed: newPos.speed ? `${(newPos.speed * 2.237).toFixed(1)} mph` : 'N/A',
          heading: newPos.heading ? `${newPos.heading.toFixed(0)}°` : 'N/A',
        });

        setLivePosition(newPos);

        // Add to history trail (keep last 50 points)
        setPositionHistory(prev => {
          const updated = [...prev, [newPos.lat, newPos.lng] as [number, number]];
          return updated.slice(-50);
        });
      },
      (error) => {
        console.error('Geolocation error:', error);
      },
      {
        enableHighAccuracy: true,
        maximumAge: 1000,
        timeout: 5000,
      }
    );

    watchIdRef.current = watchId;

    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
    };
  }, []);

  // Theme-aware button styles
  const getActiveButtonClass = () => {
    if (themeId === 'hud') {
      return 'bg-purple-600/80 text-white border-2 border-purple-400 shadow-[0_0_15px_rgba(168,85,247,0.6)]';
    }
    if (themeId === 'pro') {
      return 'bg-blue-600/80 text-white border-2 border-blue-400 shadow-lg';
    }
    return 'bg-theme-primary/30 text-theme-primary border-2 border-theme-primary/50 shadow-[0_0_15px_rgba(0,255,238,0.4)]';
  };

  const getInactiveButtonClass = () => {
    if (themeId === 'hud') {
      return 'bg-gray-900/60 border-2 border-purple-600/40 text-purple-300 hover:border-purple-500';
    }
    if (themeId === 'pro') {
      return 'bg-slate-800/60 border border-slate-600 text-slate-300 hover:border-slate-500';
    }
    return 'bg-black/60 text-gray-400 border border-white/20 hover:bg-black/80';
  };

  // Convert m/s to mph
  const speedMph = livePosition?.speed ? livePosition.speed * 2.237 : 0;

  return (
    <div ref={mapContainerRef} className="w-full h-full rounded-2xl overflow-hidden shadow-2xl border border-white/10 relative">
      {/* Speed Widget */}
      {livePosition && livePosition.speed !== null && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="absolute top-4 left-4 z-[1000] bg-gray-900/95 backdrop-blur-lg border-2 border-cyan-500/50 rounded-2xl p-4 shadow-2xl min-w-[120px]"
        >
          <div className="flex items-center gap-3">
            <Gauge className="w-6 h-6 text-cyan-400" />
            <div>
              <div className="text-3xl font-black text-white tabular-nums">
                {speedMph.toFixed(0)}
              </div>
              <div className="text-xs text-gray-400 font-medium uppercase tracking-wide">
                mph
              </div>
            </div>
          </div>
          {livePosition.heading !== null && (
            <div className="mt-2 flex items-center gap-2 text-xs text-gray-400">
              <Navigation2 
                className="w-4 h-4 text-cyan-400" 
                style={{ transform: `rotate(${livePosition.heading}deg)` }}
              />
              <span>{livePosition.heading.toFixed(0)}°</span>
            </div>
          )}
        </motion.div>
      )}

      {/* Center on Position Button */}
      {livePosition && (
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={() => setShouldCenterOnPosition(true)}
          className="absolute bottom-4 right-4 z-[1000] bg-gray-900/95 backdrop-blur-lg border-2 border-cyan-500/50 rounded-full p-4 shadow-2xl hover:border-cyan-400 transition-all"
          title="Center on my location"
        >
          <Crosshair className="w-6 h-6 text-cyan-400" />
        </motion.button>
      )}

      {/* Map Controls */}
      <div className="absolute top-4 right-4 z-[1000] flex flex-col gap-2">
        {/* Map Layer Toggle */}
        <div className="flex gap-2">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setMapLayer('dark')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-sm transition-all ${
              mapLayer === 'dark' ? getActiveButtonClass() : getInactiveButtonClass()
            }`}
          >
            <MapIcon className="w-4 h-4" />
            <span className={themeId === 'hud' ? 'uppercase tracking-wider' : ''}>Dark</span>
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setMapLayer('satellite')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-sm transition-all ${
              mapLayer === 'satellite' ? getActiveButtonClass() : getInactiveButtonClass()
            }`}
          >
            <Satellite className="w-4 h-4" />
            <span className={themeId === 'hud' ? 'uppercase tracking-wider' : ''}>Satellite</span>
          </motion.button>
        </div>
        
        {/* Heatmap Toggle */}
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setShowHeatmap(!showHeatmap)}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-sm transition-all ${
            showHeatmap ? getActiveButtonClass() : getInactiveButtonClass()
          }`}
        >
          <TrendingUp className="w-4 h-4" />
          <span className={themeId === 'hud' ? 'uppercase tracking-wider' : ''}>My History</span>
        </motion.button>
      </div>

      <MapContainer
        center={center}
        zoom={zoom}
        className="w-full h-full"
        zoomControl={true}
        style={{ background: mapLayer === 'dark' ? '#0a0e27' : '#000' }}
      >
        {/* Dark Mode Tiles */}
        {mapLayer === 'dark' && (
          <>
            <TileLayer
              url="https://{s}.basemaps.cartocdn.com/dark_nolabels/{z}/{x}/{y}{r}.png"
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            />
            <TileLayer
              url="https://{s}.basemaps.cartocdn.com/dark_only_labels/{z}/{x}/{y}{r}.png"
              attribution=''
            />
          </>
        )}

        {/* Satellite Tiles */}
        {mapLayer === 'satellite' && (
          <>
            <TileLayer
              url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
              attribution='Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community'
              maxZoom={19}
            />
            <TileLayer
              url="https://{s}.basemaps.cartocdn.com/dark_only_labels/{z}/{x}/{y}{r}.png"
              attribution=''
              opacity={0.8}
            />
          </>
        )}

        <MapResizeHandler />
        <CenterOnPositionHandler 
          position={livePosition} 
          shouldCenter={shouldCenterOnPosition}
          onCentered={() => setShouldCenterOnPosition(false)}
        />

        {/* Personal Heatmap Overlay */}
        <HeatmapOverlay enabled={showHeatmap} zones={zones} />

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
                  <div className="text-theme-primary font-bold text-lg mb-2">Score: {zone.score}</div>
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

        {/* Current Position Trail */}
        {positionHistory.length > 1 && (
          <Polyline
            positions={positionHistory}
            pathOptions={{
              color: '#0ea5e9',
              weight: 4,
              opacity: 0.7,
              dashArray: '10, 10',
            }}
          />
        )}

        {/* Current Position Marker */}
        {livePosition && (
          <>
            {/* Accuracy Circle */}
            <Circle
              center={[livePosition.lat, livePosition.lng]}
              radius={livePosition.accuracy}
              pathOptions={{
                color: '#0ea5e9',
                fillColor: '#0ea5e9',
                fillOpacity: 0.1,
                weight: 1,
                opacity: 0.5,
              }}
            />
            {/* Position Marker */}
            <Marker
              position={[livePosition.lat, livePosition.lng]}
              icon={createCurrentPositionIcon()}
            >
              <Tooltip direction="top" offset={[0, -20]} opacity={1} permanent={false}>
                <div className="text-sm">
                  <div className="font-bold text-cyan-400 mb-1">Your Location</div>
                  <div className="text-xs text-gray-300">
                    {livePosition.speed !== null ? (
                      <div>Speed: {speedMph.toFixed(1)} mph</div>
                    ) : (
                      <div>Speed: Unavailable</div>
                    )}
                    <div className="text-gray-400 mt-1">
                      Accuracy: ±{livePosition.accuracy.toFixed(0)}m
                    </div>
                  </div>
                </div>
              </Tooltip>
            </Marker>
          </>
        )}
      </MapContainer>
    </div>
  );
}

