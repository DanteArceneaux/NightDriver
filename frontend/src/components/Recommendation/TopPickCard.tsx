import { motion, useMotionValue, useTransform, animate } from 'framer-motion';
import { useEffect, useState } from 'react';
import { Music, CloudRain, Plane, Navigation as NavIcon, Zap, Clock, Calendar, Map } from 'lucide-react';
import { TopPick, ZoneScore, Coordinates, Event } from '../../types';
import { calculateDistance, estimateDriveTime, calculateEfficiency, formatDistance, formatDriveTime } from '../../lib/distance';
import { fetchConditions } from '../../lib/api';
import { openNavigation, getDefaultNavigationApp } from '../../lib/navigation';

interface TopPickCardProps {
  topPick: TopPick;
  zone?: ZoneScore;
  driverLocation?: Coordinates | null;
}

function getScoreTheme(score: number) {
  if (score >= 80) return {
    gradient: 'bg-gradient-to-br from-neon-pink/30 via-neon-purple/20 to-transparent',
    glow: 'glow-pink',
    text: 'text-neon-pink',
    border: 'border-neon-pink/50',
    label: 'SURGE ZONE'
  };
  if (score >= 60) return {
    gradient: 'bg-gradient-to-br from-neon-orange/25 via-neon-pink/15 to-transparent',
    glow: '',
    text: 'text-neon-orange',
    border: 'border-neon-orange/50',
    label: 'HOT ZONE'
  };
  return {
    gradient: 'bg-gradient-to-br from-neon-cyan/20 via-blue-500/10 to-transparent',
    glow: '',
    text: 'text-neon-cyan',
    border: 'border-neon-cyan/50',
    label: 'ACTIVE ZONE'
  };
}

function getTimeUntilEnd(endTime: string): string {
  const now = new Date();
  const end = new Date(endTime);
  const diffMs = end.getTime() - now.getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMins / 60);
  
  if (diffMs < 0) return 'Ended';
  if (diffHours === 0) return `Ends in ${diffMins}m`;
  return `Ends in ${diffHours}h ${diffMins % 60}m`;
}

function getEventIcon(type?: string): string {
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

export function TopPickCard({ topPick, zone, driverLocation }: TopPickCardProps) {
  const theme = getScoreTheme(topPick.score);
  const [displayScore, setDisplayScore] = useState(0);
  const [events, setEvents] = useState<Event[]>([]);

  // Animated score counter
  useEffect(() => {
    const controls = animate(displayScore, topPick.score, {
      duration: 1.5,
      ease: "easeOut",
      onUpdate: (value) => setDisplayScore(Math.round(value))
    });
    return controls.stop;
  }, [topPick.score]);

  // Fetch events for this zone
  useEffect(() => {
    const loadEvents = async () => {
      try {
        const conditions = await fetchConditions();
        const zoneEvents = conditions.events.filter(e => e.zoneId === topPick.zoneId);
        setEvents(zoneEvents);
      } catch (error) {
        console.error('Failed to load events:', error);
      }
    };
    loadEvents();
  }, [topPick.zoneId]);

  // Calculate distance and efficiency if driver location available
  let distance: number | null = null;
  let driveTime: number | null = null;
  let efficiency: number | null = null;

  if (driverLocation && zone) {
    distance = calculateDistance(driverLocation, zone.coordinates);
    driveTime = estimateDriveTime(distance);
    efficiency = calculateEfficiency(topPick.score, driveTime);
  }

  // Get active boost factors
  const boosts = [];
  if (zone?.factors.events > 0) boosts.push({ icon: Music, label: 'Concert', value: zone.factors.events });
  if (zone?.factors.weather > 0) boosts.push({ icon: CloudRain, label: 'Rain', value: zone.factors.weather });
  if (zone?.factors.flights > 0) boosts.push({ icon: Plane, label: 'Flights', value: zone.factors.flights });

  return (
    <motion.div
      initial={{ scale: 0.9, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ duration: 0.5, type: "spring" }}
      className={`relative overflow-hidden rounded-3xl border-2 ${theme.border} ${theme.glow}`}
    >
      {/* Animated Background Gradient */}
      <div className={`absolute inset-0 ${theme.gradient}`} />
      <div className="absolute inset-0 glass-strong" />
      
      {/* Content */}
      <div className="relative p-8">
        {/* Header Label */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <NavIcon className={`w-5 h-5 ${theme.text}`} />
            <span className="text-xs font-bold tracking-widest text-gray-400 uppercase">
              {driverLocation ? 'Best For You' : theme.label}
            </span>
          </div>
          <div className="flex items-center gap-2">
            {/* Navigation Button */}
            {zone && (
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => openNavigation(zone.coordinates, getDefaultNavigationApp())}
                className="flex items-center gap-2 px-4 py-2 bg-neon-cyan/20 hover:bg-neon-cyan/30 border border-neon-cyan/50 rounded-xl text-neon-cyan font-bold text-xs transition-all"
              >
                <Map className="w-4 h-4" />
                NAVIGATE
              </motion.button>
            )}
            {topPick.score >= 80 && (
              <motion.div
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ repeat: Infinity, duration: 2 }}
                className="text-neon-pink text-xs font-bold px-3 py-1 rounded-full bg-neon-pink/20 border border-neon-pink/50"
              >
                🔥 SURGE
              </motion.div>
            )}
          </div>
        </div>

        {/* Main Content: Zone Name + Score */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex-1">
            <h3 className="text-4xl md:text-5xl font-black text-white leading-tight tracking-tight mb-2">
              {zone?.name || topPick.zoneId.replace('_', ' ').toUpperCase()}
            </h3>
            
            {/* Estimated Earnings */}
            {zone?.estimatedHourlyRate && (
              <div className="flex items-center gap-2 mb-2">
                <span className="text-2xl font-black text-neon-green">
                  ~${zone.estimatedHourlyRate}/hr
                </span>
                <span className="text-sm text-gray-400">estimated</span>
              </div>
            )}
            
            {/* Distance and Drive Time */}
            {distance !== null && driveTime !== null && (
              <div className="flex items-center gap-3 text-sm text-gray-300 font-medium">
                <span className="flex items-center gap-1">
                  📍 {formatDistance(distance)}
                </span>
                <span className="text-gray-600">•</span>
                <span className="flex items-center gap-1">
                  🚗 {formatDriveTime(driveTime)}
                </span>
                {efficiency !== null && efficiency > 2 && (
                  <>
                    <span className="text-gray-600">•</span>
                    <span className="flex items-center gap-1 text-neon-green font-bold">
                      <Zap className="w-4 h-4" />
                      {efficiency.toFixed(1)}
                    </span>
                  </>
                )}
              </div>
            )}
          </div>

          {/* Giant Animated Score */}
          <motion.div 
            className={`text-7xl md:text-8xl font-black ${theme.text} tabular-nums`}
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.3, type: "spring", stiffness: 200 }}
          >
            {displayScore}
          </motion.div>
        </div>

        {/* Reason */}
        <p className="text-gray-200 text-lg leading-relaxed mb-6 font-medium">
          {topPick.reason}
        </p>

        {/* Active Events Section */}
        {events.length > 0 && (
          <div className="mb-6 p-4 rounded-2xl bg-neon-orange/10 border border-neon-orange/30">
            <div className="flex items-center gap-2 mb-3">
              <Calendar className="w-5 h-5 text-neon-orange" />
              <h4 className="text-sm font-bold text-neon-orange uppercase tracking-wide">
                Active Events
              </h4>
            </div>
            <div className="space-y-2">
              {events.slice(0, 2).map((event, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.6 + idx * 0.1 }}
                  className="glass-strong rounded-xl p-3 border border-white/10"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-2 flex-1 min-w-0">
                      <span className="text-2xl flex-shrink-0">{getEventIcon(event.type)}</span>
                      <div className="min-w-0 flex-1">
                        <div className="font-bold text-white text-sm mb-1 truncate">
                          {event.name}
                        </div>
                        <div className="text-xs text-gray-400">{event.venue}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 px-2 py-1 bg-neon-green/20 border border-neon-green/50 rounded-full text-xs font-bold text-neon-green whitespace-nowrap">
                      <Clock className="w-3 h-3" />
                      {getTimeUntilEnd(event.endTime)}
                    </div>
                  </div>
                </motion.div>
              ))}
              {events.length > 2 && (
                <div className="text-xs text-gray-400 text-center pt-1">
                  +{events.length - 2} more event{events.length - 2 !== 1 ? 's' : ''}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Active Boosts (Pills) */}
        {boosts.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {boosts.map((boost, idx) => (
              <motion.div
                key={idx}
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.5 + idx * 0.1 }}
                className="flex items-center gap-2 px-4 py-2 rounded-full glass text-sm font-semibold"
              >
                <boost.icon className="w-4 h-4 text-neon-orange" />
                <span className="text-white">{boost.label}</span>
                <span className="text-neon-orange">+{boost.value}</span>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
}

