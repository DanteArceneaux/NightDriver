import { useEffect, useState, useRef } from 'react';
import { MapContainer, TileLayer, CircleMarker, Marker, Tooltip, useMap, Polyline, Circle } from 'react-leaflet';
import { motion } from 'framer-motion';
import { Map as MapIcon, Satellite, TrendingUp, Navigation2, Gauge, Crosshair } from 'lucide-react';
import L from 'leaflet';
import { ZoneScore, Event } from '../../types';
import { fetchConditions } from '../../lib/api';
import { SafeStorage } from '../../lib/safeStorage';
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

type GeoStatus = 'loading' | 'active' | 'denied' | 'unsupported' | 'timeout' | 'unavailable';
type LocationSource = 'gps' | 'network' | 'cached';

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

// Create custom current position icon with Tesla emblem
function createCurrentPositionIcon() {
  return L.divIcon({
    className: 'current-position-marker',
    html: `
      <div style="position: relative; width: 56px; height: 56px; display: flex; align-items: center; justify-content: center;">
        <!-- Outer pulsing ring -->
        <div style="
          position: absolute;
          width: 56px;
          height: 56px;
          border: 3px solid #e82127;
          border-radius: 50%;
          animation: teslaPulse 2s ease-in-out infinite;
        "></div>
        <!-- Inner solid circle background -->
        <div style="
          position: absolute;
          width: 44px;
          height: 44px;
          background: linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%);
          border-radius: 50%;
          border: 2px solid #e82127;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.5), inset 0 1px 0 rgba(255,255,255,0.1);
        "></div>
        <!-- Tesla "T" Logo -->
        <svg width="28" height="28" viewBox="0 0 100 100" style="position: relative; z-index: 10;">
          <!-- Tesla T shape -->
          <path d="M50 10 L50 90 M20 10 L80 10" 
                stroke="#e82127" 
                stroke-width="14" 
                stroke-linecap="round" 
                fill="none"/>
          <!-- Highlight on T -->
          <path d="M50 10 L50 85" 
                stroke="url(#teslaGradient)" 
                stroke-width="8" 
                stroke-linecap="round" 
                fill="none"/>
          <defs>
            <linearGradient id="teslaGradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" style="stop-color:#ff4444"/>
              <stop offset="100%" style="stop-color:#cc0000"/>
            </linearGradient>
          </defs>
        </svg>
      </div>
      <style>
        @keyframes teslaPulse {
          0%, 100% { 
            transform: scale(1); 
            opacity: 0.7;
            box-shadow: 0 0 0 0 rgba(232, 33, 39, 0.4);
          }
          50% { 
            transform: scale(1.15); 
            opacity: 1;
            box-shadow: 0 0 20px 5px rgba(232, 33, 39, 0.3);
          }
        }
      </style>
    `,
    iconSize: [56, 56],
    iconAnchor: [28, 28],
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
  const [geoStatus, setGeoStatus] = useState<GeoStatus>('loading');
  const [locationSource, setLocationSource] = useState<LocationSource | null>(null);

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
    // Avoid starting multiple watches if something causes rerenders
    if (watchIdRef.current !== null) return;

    const isMobile = /iPhone|iPad|iPod|Android|Mobi/i.test(navigator.userAgent);
    console.log('🔍 Geolocation setup starting...', { isMobile });

    if (!navigator.geolocation) {
      console.error('❌ Geolocation is not supported by this browser');
      setGeoStatus('unsupported');
      return;
    }

    // Try to hydrate from last known location (automatic, no user action)
    try {
      const raw = SafeStorage.getItem('lastKnownPosition');
      if (raw) {
        const cached = JSON.parse(raw) as Partial<LivePosition>;
        if (typeof cached.lat === 'number' && typeof cached.lng === 'number') {
          setLivePosition({
            lat: cached.lat,
            lng: cached.lng,
            accuracy: typeof cached.accuracy === 'number' ? cached.accuracy : 10000,
            speed: null,
            heading: null,
            timestamp: typeof cached.timestamp === 'number' ? cached.timestamp : Date.now(),
          });
          setLocationSource('cached');
        }
      }
    } catch {
      // ignore
    }

    const persistLastKnown = (pos: LivePosition) => {
      SafeStorage.setItem(
        'lastKnownPosition',
        JSON.stringify({ lat: pos.lat, lng: pos.lng, accuracy: pos.accuracy, timestamp: pos.timestamp })
      );
    };

    const applyPosition = (pos: LivePosition, source: LocationSource, resetTrail: boolean) => {
      setGeoStatus('active');
      setLocationSource(source);
      setLivePosition(pos);
      if (resetTrail) {
        setPositionHistory([[pos.lat, pos.lng]]);
      } else {
        setPositionHistory((prev) => [...prev, [pos.lat, pos.lng] as [number, number]].slice(-50));
      }
      persistLastKnown(pos);
    };

    const fetchNetworkLocation = async (): Promise<LivePosition | null> => {
      try {
        // Free, no-key IP geolocation (approximate). CORS-friendly.
        const res = await fetch('https://ipwho.is/?fields=success,latitude,longitude,message');
        const data = await res.json();
        if (!data?.success) {
          console.warn('⚠️ Network location lookup failed:', data?.message);
          return null;
        }
        const lat = Number(data.latitude);
        const lng = Number(data.longitude);
        if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
        return {
          lat,
          lng,
          // IP-based location is coarse; keep this modest so the circle isn't absurd.
          accuracy: 10000,
          speed: null,
          heading: null,
          timestamp: Date.now(),
        };
      } catch (e) {
        console.warn('⚠️ Network location lookup error:', e);
        return null;
      }
    };

    // First, check permission state if available
    const checkPermission = async (): Promise<boolean> => {
      // Safari iOS may not support Permissions API
      if ('permissions' in navigator) {
        try {
          const result = await navigator.permissions.query({ name: 'geolocation' as PermissionName });
          console.log('🔐 Permission state:', result.state);
          if (result.state === 'denied') {
            setGeoStatus('denied');
            return false;
          }
        } catch {
          // proceed
        }
      }
      return true;
    };

    const startWatch = () => {
      // Start continuous updates; if it succeeds later, it will overwrite network/cached location.
      watchIdRef.current = navigator.geolocation.watchPosition(
        (position) => {
          const pos: LivePosition = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
            accuracy: position.coords.accuracy,
            speed: position.coords.speed,
            heading: position.coords.heading,
            timestamp: position.timestamp,
          };
          applyPosition(pos, 'gps', false);
        },
        (error) => {
          console.warn('⚠️ watchPosition error:', { code: error.code, message: error.message });
        },
        {
          enableHighAccuracy: true, // Always try for GPS on mobile/desktop
          maximumAge: 5000, // Reduced from 10s to 5s for fresher data
          timeout: 15000, // Give it 15 seconds to lock on
        }
      );
    };

    const startTracking = async () => {
      const canProceed = await checkPermission();
      if (!canProceed) return;

      setGeoStatus('loading');
      console.log('📍 Requesting initial position...');

      // Start watch immediately; in some environments watchPosition returns sooner than getCurrentPosition.
      startWatch();

      navigator.geolocation.getCurrentPosition(
        (position) => {
          const pos: LivePosition = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
            accuracy: position.coords.accuracy,
            speed: position.coords.speed,
            heading: position.coords.heading,
            timestamp: position.timestamp,
          };
          console.log('✅ Initial position received');
          applyPosition(pos, 'gps', true);
        },
        async (error) => {
          console.warn('⚠️ getCurrentPosition error:', { code: error.code, message: error.message });

          if (error.code === 1) {
            // Permission denied
            setGeoStatus('denied');
            return;
          }

          if (error.code === 3) {
            setGeoStatus('timeout');
          } else if (error.code === 2) {
            setGeoStatus('unavailable');
          } else {
            setGeoStatus('unavailable');
          }

          // Automatic fallback: approximate network (IP-based) location.
          const networkPos = await fetchNetworkLocation();
          if (networkPos) {
            console.log('🌐 Using network (IP) location fallback');
            applyPosition(networkPos, 'network', true);
          }
        },
        {
          enableHighAccuracy: true, // Always try for high accuracy (GPS)
          maximumAge: isMobile ? 5000 : 30000, // mobile needs fresh, desktop can use older
          timeout: 10000, // Reduced from 15s to 10s for initial lock
        }
      );
    };

    startTracking();

    return () => {
      if (watchIdRef.current !== null) {
        console.log('🛑 Stopping geolocation watch');
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
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
      {/* Geolocation Status / Source Indicator */}
      {livePosition && locationSource && livePosition.speed === null && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className={`absolute top-4 left-4 z-[1000] backdrop-blur-lg rounded-xl px-4 py-2 shadow-2xl border ${
            locationSource === 'gps'
              ? 'bg-green-600/90 border-green-400'
              : locationSource === 'network'
              ? 'bg-amber-600/90 border-amber-300'
              : 'bg-slate-700/90 border-slate-400'
          }`}
          title={
            locationSource === 'gps'
              ? 'GPS-based location'
              : locationSource === 'network'
              ? 'Approximate network/IP location'
              : 'Last known location'
          }
        >
          <div className="text-white text-xs font-bold flex items-center gap-2">
            <span className="uppercase tracking-wider">
              {locationSource === 'gps' ? 'GPS' : locationSource === 'network' ? 'Network' : 'Last known'}
            </span>
            <span className="opacity-90">±{Math.round(livePosition.accuracy)}m</span>
          </div>
        </motion.div>
      )}

      {geoStatus === 'loading' && !livePosition && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="absolute top-4 left-4 z-[1000] bg-yellow-600/95 backdrop-blur-lg border-2 border-yellow-400 rounded-xl px-4 py-3 shadow-2xl max-w-xs"
        >
          <div className="text-white text-sm">
            <div className="flex items-center gap-2 font-bold mb-1">
              <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
              <span>Getting location…</span>
            </div>
            <div className="text-xs opacity-90">
              If GPS is slow, we’ll automatically fall back to a network-based location.
            </div>
          </div>
        </motion.div>
      )}

      {(geoStatus === 'timeout' || geoStatus === 'unavailable') && !livePosition && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="absolute top-4 left-4 z-[1000] bg-amber-600/95 backdrop-blur-lg border-2 border-amber-300 rounded-xl px-4 py-3 shadow-2xl max-w-xs"
        >
          <div className="text-white text-sm">
            <div className="font-bold mb-1">⏱️ Location taking too long</div>
            <div className="text-xs opacity-90 mb-3">
              We’re trying GPS and network fallback. On Windows, make sure <span className="font-bold">Location Services</span> are enabled.
            </div>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => window.location.reload()}
              className="w-full bg-white text-amber-700 font-bold py-2 px-3 rounded-lg text-xs"
            >
              Retry
            </motion.button>
          </div>
        </motion.div>
      )}

      {geoStatus === 'denied' && !livePosition && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="absolute top-4 left-4 z-[1000] bg-red-600/95 backdrop-blur-lg border-2 border-red-400 rounded-xl px-4 py-3 shadow-2xl max-w-xs"
        >
          <div className="text-white text-sm">
            <div className="font-bold mb-2">❌ Location permission blocked</div>
            <div className="text-xs opacity-90 mb-3">
              1) Click <span className="font-bold">🔒 lock icon</span> → <span className="font-bold">Site settings</span><br/>
              2) Set <span className="font-bold">Location</span> to <span className="font-bold">Allow</span><br/>
              3) Refresh the page
            </div>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => window.location.reload()}
              className="w-full bg-white text-red-700 font-bold py-2 px-3 rounded-lg text-xs"
            >
              Refresh
            </motion.button>
          </div>
        </motion.div>
      )}

      {geoStatus === 'unsupported' && !livePosition && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="absolute top-4 left-4 z-[1000] bg-gray-600/95 backdrop-blur-lg border-2 border-gray-400 rounded-xl px-4 py-3 shadow-2xl"
        >
          <div className="text-white text-sm font-bold">
            ⚠️ Geolocation not supported
          </div>
        </motion.div>
      )}

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
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setShouldCenterOnPosition(true)}
          className="absolute bottom-4 right-4 z-[1000] bg-gradient-to-r from-red-600 to-red-700 backdrop-blur-lg border-2 border-red-400 rounded-2xl px-4 py-3 shadow-2xl hover:from-red-500 hover:to-red-600 transition-all flex items-center gap-2"
          title="Center on my Tesla"
        >
          <Crosshair className="w-5 h-5 text-white" />
          <span className="text-white font-bold text-sm">Center</span>
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

