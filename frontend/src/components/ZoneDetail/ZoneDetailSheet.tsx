import { motion, AnimatePresence } from 'framer-motion';
import { X, Map, Music, CloudRain, Plane, TrendingUp, MapPin, Clock, ParkingCircle } from 'lucide-react';
import type { ZoneScore, Coordinates, Zone } from '../../types';
import { calculateDistance, estimateDriveTime, calculateEfficiency } from '../../lib/distance';
import { openGoogleMaps, openWaze, openAppleMaps } from '../../lib/navigation';
import { useTheme } from '../../features/theme';

interface ZoneDetailSheetProps {
  zone: ZoneScore | null;
  onClose: () => void;
  driverLocation?: Coordinates | null;
  allZones?: Zone[]; // Full zone data with staging spots
}

function getScoreColor(score: number): string {
  if (score >= 80) return 'text-neon-pink';
  if (score >= 60) return 'text-neon-orange';
  if (score >= 40) return 'text-theme-primary';
  return 'text-blue-400';
}

function getScoreBg(score: number): string {
  if (score >= 80) return 'bg-neon-pink/20 border-neon-pink/50';
  if (score >= 60) return 'bg-neon-orange/20 border-neon-orange/50';
  if (score >= 40) return 'bg-theme-primary/20 border-theme-primary/50';
  return 'bg-blue-500/20 border-blue-500/50';
}

export function ZoneDetailSheet({ zone, onClose, driverLocation, allZones }: ZoneDetailSheetProps) {
  const { tokens } = useTheme();
  
  if (!zone) return null;

  const scoreColor = getScoreColor(zone.score);
  const scoreBg = getScoreBg(zone.score);

  // Get full zone data including staging spot
  const fullZoneData = allZones?.find(z => z.id === zone.id);
  const stagingSpot = fullZoneData?.stagingSpot;

  // Calculate distance and efficiency
  let distance: number | null = null;
  let driveTime: number | null = null;
  let efficiency: number | null = null;

  if (driverLocation) {
    distance = calculateDistance(driverLocation, zone.coordinates);
    driveTime = estimateDriveTime(distance);
    efficiency = calculateEfficiency(zone.score, driveTime);
  }

  return (
    <AnimatePresence>
      {zone && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
          />

          {/* Sheet */}
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="fixed bottom-0 left-0 right-0 z-50 max-h-[80vh] overflow-y-auto"
          >
            <div className={`${tokens.cardBg} rounded-t-3xl border-t border-l border-r ${tokens.cardBorder} p-6 ${tokens.shadow}`}>
              {/* Header */}
              <div className="flex items-start justify-between mb-6">
                <div className="flex-1">
                  <h2 className="text-3xl font-black text-white mb-2">
                    {zone.name}
                  </h2>
                  <div className="flex items-center gap-2 text-sm text-gray-400">
                    <MapPin className="w-4 h-4" />
                    <span>{zone.coordinates.lat.toFixed(4)}, {zone.coordinates.lng.toFixed(4)}</span>
                  </div>
                </div>

                {/* Close Button */}
                <button
                  onClick={onClose}
                  className="p-2 hover:bg-white/10 rounded-full transition-colors"
                >
                  <X className="w-6 h-6 text-gray-400" />
                </button>
              </div>

              {/* Score Display */}
              <div className={`mb-6 p-6 rounded-2xl border ${scoreBg}`}>
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm text-gray-400 mb-1">Current Score</div>
                    <div className={`text-5xl font-black ${scoreColor}`}>
                      {zone.score}
                    </div>
                  </div>
                  {zone.trend && (
                    <div className="flex items-center gap-2 text-sm">
                      <TrendingUp className={`w-5 h-5 ${scoreColor}`} />
                      <span className="text-gray-300 capitalize">{zone.trend}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Distance & Efficiency */}
              {distance !== null && driveTime !== null && (
                <div className="mb-6 grid grid-cols-3 gap-3">
                  <div className="glass rounded-xl p-4 text-center">
                    <div className="text-2xl font-bold text-white mb-1">
                      {distance.toFixed(1)} km
                    </div>
                    <div className="text-xs text-gray-400">Distance</div>
                  </div>
                  <div className="glass rounded-xl p-4 text-center">
                    <div className="text-2xl font-bold text-white mb-1">
                      {driveTime} min
                    </div>
                    <div className="text-xs text-gray-400">Drive Time</div>
                  </div>
                  {efficiency !== null && (
                    <div className="glass rounded-xl p-4 text-center">
                      <div className="text-2xl font-bold text-neon-green mb-1">
                        {efficiency.toFixed(1)}
                      </div>
                      <div className="text-xs text-gray-400">Efficiency</div>
                    </div>
                  )}
                </div>
              )}

              {/* Score Breakdown */}
              <div className="mb-6">
                <h3 className="text-sm font-bold text-gray-300 uppercase tracking-wide mb-3">
                  Score Breakdown
                </h3>
                <div className="space-y-2">
                  <div className="flex items-center justify-between glass rounded-lg p-3">
                    <span className="text-sm text-gray-300">Baseline</span>
                    <span className="text-white font-bold">{zone.factors.baseline}</span>
                  </div>
                  {zone.factors.events > 0 && (
                    <div className="flex items-center justify-between glass rounded-lg p-3">
                      <div className="flex items-center gap-2">
                        <Music className="w-4 h-4 text-neon-orange" />
                        <span className="text-sm text-gray-300">Events</span>
                      </div>
                      <span className="text-neon-orange font-bold">+{zone.factors.events}</span>
                    </div>
                  )}
                  {zone.factors.weather > 0 && (
                    <div className="flex items-center justify-between glass rounded-lg p-3">
                      <div className="flex items-center gap-2">
                        <CloudRain className="w-4 h-4 text-blue-400" />
                        <span className="text-sm text-gray-300">Weather</span>
                      </div>
                      <span className="text-blue-400 font-bold">+{zone.factors.weather}</span>
                    </div>
                  )}
                  {zone.factors.flights > 0 && (
                    <div className="flex items-center justify-between glass rounded-lg p-3">
                      <div className="flex items-center gap-2">
                        <Plane className="w-4 h-4 text-neon-green" />
                        <span className="text-sm text-gray-300">Flights</span>
                      </div>
                      <span className="text-neon-green font-bold">+{zone.factors.flights}</span>
                    </div>
                  )}
                  {zone.factors.traffic > 0 && (
                    <div className="flex items-center justify-between glass rounded-lg p-3">
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-yellow-400" />
                        <span className="text-sm text-gray-300">Traffic</span>
                      </div>
                      <span className="text-yellow-400 font-bold">+{zone.factors.traffic}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Staging Spot Info */}
              {stagingSpot && (
                <div className="mb-6 glass rounded-xl p-4 border border-neon-green/30">
                  <div className="flex items-center gap-3 mb-3">
                    <ParkingCircle className="w-6 h-6 text-neon-green" />
                    <h3 className="text-sm font-bold text-neon-green uppercase tracking-wide">
                      Recommended Staging Spot
                    </h3>
                  </div>
                  <p className="text-sm text-gray-300 mb-3">
                    Safe parking/waiting location near high-demand areas
                  </p>
                  <div className="text-xs text-gray-400 font-mono">
                    {stagingSpot.lat.toFixed(4)}, {stagingSpot.lng.toFixed(4)}
                  </div>
                </div>
              )}

              {/* Navigation Buttons */}
              <div className="grid grid-cols-3 gap-3">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => openGoogleMaps(stagingSpot || zone.coordinates)}
                  className="flex flex-col items-center gap-2 p-4 glass-strong rounded-xl hover:bg-white/10 transition-colors border border-white/10"
                >
                  <Map className="w-6 h-6 text-theme-primary" />
                  <span className="text-xs font-bold text-white">Google Maps</span>
                </motion.button>

                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => openWaze(stagingSpot || zone.coordinates)}
                  className="flex flex-col items-center gap-2 p-4 glass-strong rounded-xl hover:bg-white/10 transition-colors border border-white/10"
                >
                  <Map className="w-6 h-6 text-theme-primary" />
                  <span className="text-xs font-bold text-white">Waze</span>
                </motion.button>

                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => openAppleMaps(stagingSpot || zone.coordinates)}
                  className="flex flex-col items-center gap-2 p-4 glass-strong rounded-xl hover:bg-white/10 transition-colors border border-white/10"
                >
                  <Map className="w-6 h-6 text-theme-primary" />
                  <span className="text-xs font-bold text-white">Apple Maps</span>
                </motion.button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

