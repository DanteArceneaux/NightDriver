import { motion } from 'framer-motion';
import { ArrowLeft, Navigation, DollarSign, Clock, Zap, MapPin } from 'lucide-react';
import type { LayoutProps } from './types';
import { useTheme } from '../theme';

export function CarModeLayout({ zones, topPick, driverLocation, onZoneClick }: LayoutProps) {
  const { setThemeId } = useTheme();
  
  // Get top 3 zones for ultra-simple display
  const topZones = zones && zones.length > 0 
    ? [...zones].sort((a, b) => b.score - a.score).slice(0, 3) 
    : [];

  // Guard against missing data
  if (!zones || zones.length === 0) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">🚗</div>
          <div className="text-3xl font-black uppercase">Loading...</div>
        </div>
      </div>
    );
  }

  const getScoreColor = (score: number): string => {
    if (score >= 80) return 'bg-red-600';
    if (score >= 60) return 'bg-orange-500';
    if (score >= 40) return 'bg-yellow-500';
    return 'bg-green-600';
  };

  return (
    <div className="min-h-screen bg-black text-white flex flex-col">
      {/* Ultra-Simple Header */}
      <div className="bg-gray-900 border-b-4 border-white/20 p-6">
        <div className="flex items-center justify-between">
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => setThemeId('neon')}
            className="flex items-center gap-3 px-6 py-4 bg-gray-800 rounded-2xl text-white font-black text-xl"
          >
            <ArrowLeft className="w-8 h-8" />
            EXIT
          </motion.button>
          <div className="text-3xl font-black text-white uppercase tracking-widest">
            CAR MODE
          </div>
        </div>
      </div>

      {/* Main Content - Ultra Large Touch Targets */}
      <div className="flex-1 p-8 space-y-6">
        {/* Top Pick - Massive Display */}
        {topPick && topPick.zone && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-gradient-to-br from-green-600 to-green-800 rounded-3xl p-8 border-4 border-green-400 shadow-2xl"
          >
            <div className="text-2xl font-black text-green-200 uppercase tracking-wider mb-4">
              🎯 GO HERE NOW
            </div>
            <div className="text-6xl font-black text-white mb-4">
              {topPick.zone.name}
            </div>
            <div className="flex items-center gap-6 mb-6">
              <div className="flex items-center gap-3">
                <Zap className="w-12 h-12 text-yellow-300" />
                <div>
                  <div className="text-5xl font-black text-white">{topPick.zone.score}</div>
                  <div className="text-xl text-green-200">SCORE</div>
                </div>
              </div>
              {topPick.estimatedHourlyRate && (
                <div className="flex items-center gap-3">
                  <DollarSign className="w-12 h-12 text-green-300" />
                  <div>
                    <div className="text-5xl font-black text-white">
                      ${topPick.estimatedHourlyRate.toFixed(0)}
                    </div>
                    <div className="text-xl text-green-200">/HOUR</div>
                  </div>
                </div>
              )}
            </div>
            <motion.button
              whileTap={{ scale: 0.98 }}
              onClick={() => {
                if (topPick.zone?.coordinates) {
                  const coords = topPick.zone.coordinates;
                  window.open(`https://www.google.com/maps/dir/?api=1&destination=${coords.lat},${coords.lng}`, '_blank');
                }
              }}
              className="w-full flex items-center justify-center gap-4 px-8 py-6 bg-white rounded-2xl text-green-900 font-black text-3xl shadow-xl"
            >
              <Navigation className="w-10 h-10" />
              START NAVIGATION
            </motion.button>
          </motion.div>
        )}

        {/* Fallback: If no topPick, show the best zone prominently */}
        {(!topPick || !topPick.zone) && topZones.length > 0 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-gradient-to-br from-green-600 to-green-800 rounded-3xl p-8 border-4 border-green-400 shadow-2xl"
          >
            <div className="text-2xl font-black text-green-200 uppercase tracking-wider mb-4">
              🎯 GO HERE NOW
            </div>
            <div className="text-6xl font-black text-white mb-4">
              {topZones[0].name}
            </div>
            <div className="flex items-center gap-6 mb-6">
              <div className="flex items-center gap-3">
                <Zap className="w-12 h-12 text-yellow-300" />
                <div>
                  <div className="text-5xl font-black text-white">{topZones[0].score}</div>
                  <div className="text-xl text-green-200">SCORE</div>
                </div>
              </div>
            </div>
            <motion.button
              whileTap={{ scale: 0.98 }}
              onClick={() => {
                const coords = topZones[0].coordinates;
                window.open(`https://www.google.com/maps/dir/?api=1&destination=${coords.lat},${coords.lng}`, '_blank');
              }}
              className="w-full flex items-center justify-center gap-4 px-8 py-6 bg-white rounded-2xl text-green-900 font-black text-3xl shadow-xl"
            >
              <Navigation className="w-10 h-10" />
              START NAVIGATION
            </motion.button>
          </motion.div>
        )}

        {/* Top 3 Zones - Large Cards */}
        <div className="space-y-4">
          <div className="text-3xl font-black text-white uppercase tracking-wider mb-4">
            {topPick?.zone ? 'OTHER HOT ZONES' : 'HOT ZONES'}
          </div>
          {topZones.slice(topPick?.zone ? 0 : 1).map((zone, idx) => (
            <motion.button
              key={zone.id}
              whileTap={{ scale: 0.98 }}
              onClick={() => onZoneClick?.(zone)}
              className={`w-full flex items-center justify-between p-6 ${getScoreColor(zone.score)} rounded-2xl border-4 border-white/30 shadow-xl`}
            >
              <div className="flex items-center gap-4">
                <div className="text-5xl font-black text-white">
                  #{idx + 1}
                </div>
                <div className="text-left">
                  <div className="text-3xl font-black text-white">
                    {zone.name}
                  </div>
                  <div className="text-xl text-white/80">
                    Score: {zone.score}
                  </div>
                </div>
              </div>
              <Navigation className="w-10 h-10 text-white" />
            </motion.button>
          ))}
        </div>
      </div>

      {/* Bottom Bar - Quick Stats */}
      <div className="bg-gray-900 border-t-4 border-white/20 p-6">
        <div className="flex items-center justify-around">
          <div className="text-center">
            <Clock className="w-10 h-10 text-blue-400 mx-auto mb-2" />
            <div className="text-2xl font-black text-white">
              {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </div>
            <div className="text-lg text-gray-400">TIME</div>
          </div>
          <div className="text-center">
            <MapPin className="w-10 h-10 text-green-400 mx-auto mb-2" />
            <div className="text-2xl font-black text-white">
              {driverLocation ? 'TRACKING' : 'NO GPS'}
            </div>
            <div className="text-lg text-gray-400">LOCATION</div>
          </div>
          <div className="text-center">
            <Zap className="w-10 h-10 text-yellow-400 mx-auto mb-2" />
            <div className="text-2xl font-black text-white">
              {zones.filter(z => z.score >= 70).length}
            </div>
            <div className="text-lg text-gray-400">HOT ZONES</div>
          </div>
        </div>
      </div>
    </div>
  );
}

