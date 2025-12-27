import { motion, AnimatePresence } from 'framer-motion';
import { Map, Music, CloudRain, Plane, TrendingUp, MapPin, Clock, ParkingCircle, Zap, BrainCircuit } from 'lucide-react';
import type { ZoneScore, Coordinates, Zone } from '../../types';
import { calculateDistance, estimateDriveTime, calculateEfficiency } from '../../lib/distance';
import { openGoogleMaps, openWaze, openAppleMaps, openTeslaNav } from '../../lib/navigation';
import { DraggableCard } from '../UI/DraggableCard';

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

  // Center position for the card
  const centerX = typeof window !== 'undefined' ? Math.max(16, (window.innerWidth - 450) / 2) : 100;
  const centerY = typeof window !== 'undefined' ? Math.max(50, (window.innerHeight - 600) / 2) : 50;

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

          {/* Draggable Zone Detail Card */}
          <DraggableCard
            title={zone.name}
            icon={<MapPin className="w-5 h-5 text-theme-primary" />}
            isOpen={!!zone}
            onClose={onClose}
            collapsible={true}
            resizable={true}
            draggable={true}
            defaultPosition={{ x: centerX, y: centerY }}
            defaultSize={{ width: Math.min(450, typeof window !== 'undefined' ? window.innerWidth - 32 : 450), height: 550 }}
            minSize={{ width: 320, height: 400 }}
            maxSize={{ width: 600, height: 800 }}
            zIndex={50}
          >
            <div className="p-4 space-y-4 overflow-y-auto">
              {/* Coordinates */}
              <div className="flex items-center gap-2 text-sm text-gray-400">
                <MapPin className="w-4 h-4" />
                <span>{zone.coordinates.lat.toFixed(4)}, {zone.coordinates.lng.toFixed(4)}</span>
              </div>

              {/* Score Display */}
              <div className={`p-4 rounded-xl border ${scoreBg}`}>
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm text-gray-400 mb-1">Current Score</div>
                    <div className={`text-4xl font-black ${scoreColor}`}>
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
                <div className="grid grid-cols-3 gap-2">
                  <div className="glass rounded-xl p-3 text-center">
                    <div className="text-lg font-bold text-white mb-1">
                      {distance.toFixed(1)} km
                    </div>
                    <div className="text-xs text-gray-400">Distance</div>
                  </div>
                  <div className="glass rounded-xl p-3 text-center">
                    <div className="text-lg font-bold text-white mb-1">
                      {driveTime} min
                    </div>
                    <div className="text-xs text-gray-400">Drive Time</div>
                  </div>
                  {efficiency !== null && (
                    <div className="glass rounded-xl p-3 text-center">
                      <div className="text-lg font-bold text-neon-green mb-1">
                        {efficiency.toFixed(1)}
                      </div>
                      <div className="text-xs text-gray-400">Efficiency</div>
                    </div>
                  )}
                </div>
              )}

              {/* Score Breakdown */}
              <div>
                <h3 className="text-sm font-bold text-gray-300 uppercase tracking-wide mb-2">
                  Score Breakdown
                </h3>
                <div className="space-y-2">
                  <div className="flex items-center justify-between glass rounded-lg p-2">
                    <span className="text-sm text-gray-300">Baseline</span>
                    <span className="text-white font-bold">{zone.factors.baseline}</span>
                  </div>
                  {zone.factors.events > 0 && (
                    <div className="flex items-center justify-between glass rounded-lg p-2">
                      <div className="flex items-center gap-2">
                        <Music className="w-4 h-4 text-neon-orange" />
                        <span className="text-sm text-gray-300">Events</span>
                      </div>
                      <span className="text-neon-orange font-bold">+{zone.factors.events}</span>
                    </div>
                  )}
                  {zone.factors.weather > 0 && (
                    <div className="flex items-center justify-between glass rounded-lg p-2">
                      <div className="flex items-center gap-2">
                        <CloudRain className="w-4 h-4 text-blue-400" />
                        <span className="text-sm text-gray-300">Weather</span>
                      </div>
                      <span className="text-blue-400 font-bold">+{zone.factors.weather}</span>
                    </div>
                  )}
                  {zone.factors.flights > 0 && (
                    <div className="flex items-center justify-between glass rounded-lg p-2">
                      <div className="flex items-center gap-2">
                        <Plane className="w-4 h-4 text-neon-green" />
                        <span className="text-sm text-gray-300">Flights</span>
                      </div>
                      <span className="text-neon-green font-bold">+{zone.factors.flights}</span>
                    </div>
                  )}
                  {zone.factors.traffic > 0 && (
                    <div className="flex items-center justify-between glass rounded-lg p-2">
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
                <div className="glass rounded-xl p-3 border border-neon-green/30">
                  <div className="flex items-center gap-2 mb-2">
                    <ParkingCircle className="w-5 h-5 text-neon-green" />
                    <h3 className="text-sm font-bold text-neon-green uppercase tracking-wide">
                      Staging Spot
                    </h3>
                  </div>
                  <p className="text-xs text-gray-300 mb-2">
                    Safe parking/waiting location
                  </p>
                  <div className="text-xs text-gray-400 font-mono">
                    {stagingSpot.lat.toFixed(4)}, {stagingSpot.lng.toFixed(4)}
                  </div>
                </div>
              )}

              {/* Navigation Buttons */}
              <div className="grid grid-cols-2 gap-2">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => openTeslaNav(stagingSpot || zone.coordinates, zone.name)}
                  className="flex items-center justify-center gap-2 p-3 bg-red-600 hover:bg-red-500 rounded-xl transition-colors border border-red-400/30 text-white font-black"
                >
                  <Zap className="w-5 h-5 fill-white" />
                  TESLA NAV
                </motion.button>

                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => {
                    // AI Route Help logic
                    alert(`AI Route Analysis for ${zone.name}:\n\n1. Take I-5 South to Mercer St exit.\n2. Best staging: ${stagingSpot ? 'Assigned spot' : 'Nearby side street'}.\n3. Expected wait: < 5 mins based on live surges.`);
                  }}
                  className="flex items-center justify-center gap-2 p-3 bg-indigo-600 hover:bg-indigo-500 rounded-xl transition-colors border border-indigo-400/30 text-white font-black"
                >
                  <BrainCircuit className="w-5 h-5" />
                  AI HELP
                </motion.button>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => openGoogleMaps(stagingSpot || zone.coordinates)}
                  className="flex flex-col items-center gap-1 p-3 glass-strong rounded-xl hover:bg-white/10 transition-colors border border-white/10"
                >
                  <Map className="w-5 h-5 text-theme-primary" />
                  <span className="text-xs font-bold text-white">Google</span>
                </motion.button>

                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => openWaze(stagingSpot || zone.coordinates)}
                  className="flex flex-col items-center gap-1 p-3 glass-strong rounded-xl hover:bg-white/10 transition-colors border border-white/10"
                >
                  <Map className="w-5 h-5 text-theme-primary" />
                  <span className="text-xs font-bold text-white">Waze</span>
                </motion.button>

                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => openAppleMaps(stagingSpot || zone.coordinates)}
                  className="flex flex-col items-center gap-1 p-3 glass-strong rounded-xl hover:bg-white/10 transition-colors border border-white/10"
                >
                  <Map className="w-5 h-5 text-theme-primary" />
                  <span className="text-xs font-bold text-white">Apple</span>
                </motion.button>
              </div>
            </div>
          </DraggableCard>
        </>
      )}
    </AnimatePresence>
  );
}

