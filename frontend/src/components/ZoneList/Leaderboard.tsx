import { motion } from 'framer-motion';
import { Trophy, Music, CloudRain, Plane, Navigation, Zap, Map } from 'lucide-react';
import { ZoneScore, Coordinates } from '../../types';
import { calculateDistance, estimateDriveTime, calculateEfficiency } from '../../lib/distance';
import { openNavigation, getDefaultNavigationApp } from '../../lib/navigation';
import { useTheme } from '../../features/theme';

interface LeaderboardProps {
  zones: ZoneScore[];
  driverLocation?: Coordinates | null;
}

function getRankBadge(rank: number) {
  if (rank === 1) return { emoji: '🥇', color: 'text-yellow-400' };
  if (rank === 2) return { emoji: '🥈', color: 'text-gray-300' };
  if (rank === 3) return { emoji: '🥉', color: 'text-orange-400' };
  return { emoji: `${rank}`, color: 'text-gray-500' };
}

function getScoreColor(score: number): string {
  if (score >= 80) return 'text-neon-pink';
  if (score >= 60) return 'text-neon-orange';
  if (score >= 40) return 'text-neon-cyan';
  return 'text-blue-400';
}

function getProgressBarColor(score: number): string {
  if (score >= 80) return 'bg-gradient-to-r from-neon-pink/40 to-neon-purple/40';
  if (score >= 60) return 'bg-gradient-to-r from-neon-orange/40 to-neon-pink/30';
  if (score >= 40) return 'bg-gradient-to-r from-neon-cyan/40 to-blue-500/30';
  return 'bg-gradient-to-r from-blue-500/30 to-blue-800/20';
}

export function Leaderboard({ zones, driverLocation }: LeaderboardProps) {
  const { tokens } = useTheme();
  
  return (
    <div className={`${tokens.cardBg} ${tokens.borderRadius} p-6 ${tokens.cardBorder}`}>
      <div className="flex items-center gap-2 mb-6">
        <Trophy className="w-5 h-5 text-yellow-400" />
        <h3 className="text-sm font-bold text-gray-300 uppercase tracking-widest">
          {driverLocation ? 'All Zones (by Efficiency)' : 'Zone Rankings'}
        </h3>
      </div>

      <div className="space-y-3">
        {zones.map((zone, index) => {
          const rank = index + 1;
          const badge = getRankBadge(rank);
          const scoreColor = getScoreColor(zone.score);
          const progressColor = getProgressBarColor(zone.score);
          
          // Calculate distance and efficiency
          let distance: number | null = null;
          let driveTime: number | null = null;
          let efficiency: number | null = null;

          if (driverLocation) {
            distance = calculateDistance(driverLocation, zone.coordinates);
            driveTime = estimateDriveTime(distance);
            efficiency = calculateEfficiency(zone.score, driveTime);
          }

          // Collect active factors
          const activeFactors = [];
          if (zone.factors.events > 0) activeFactors.push({ icon: Music, color: 'text-neon-orange', value: zone.factors.events });
          if (zone.factors.weather > 0) activeFactors.push({ icon: CloudRain, color: 'text-blue-400', value: zone.factors.weather });
          if (zone.factors.flights > 0) activeFactors.push({ icon: Plane, color: 'text-neon-green', value: zone.factors.flights });

          return (
            <motion.div
              key={zone.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
              className="relative glass rounded-xl p-4 border border-white/5 hover:border-neon-cyan/30 transition-all group cursor-pointer"
            >
              {/* Background Progress Bar */}
              <div className="absolute inset-0 rounded-xl overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${zone.score}%` }}
                  transition={{ duration: 1, delay: index * 0.05 }}
                  className={`h-full ${progressColor} opacity-30`}
                />
              </div>

              {/* Content */}
              <div className="relative flex items-center gap-4">
                {/* Rank Badge */}
                <div className={`flex-shrink-0 w-10 h-10 flex items-center justify-center rounded-full glass-strong text-xl font-black ${badge.color}`}>
                  {badge.emoji}
                </div>

                {/* Zone Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-bold text-white text-lg truncate">
                      {zone.name}
                    </h4>
                    {rank <= 3 && (
                      <motion.div
                        animate={{ scale: [1, 1.1, 1] }}
                        transition={{ repeat: Infinity, duration: 2 }}
                        className="px-2 py-0.5 rounded-full bg-yellow-400/20 text-yellow-400 text-xs font-bold"
                      >
                        TOP {rank}
                      </motion.div>
                    )}
                  </div>
                  
                  {/* Estimated Earnings */}
                  {zone.estimatedHourlyRate && (
                    <div className="text-sm font-bold text-neon-green mb-1">
                      ~${zone.estimatedHourlyRate}/hr
                    </div>
                  )}

                  {/* Distance & Efficiency */}
                  {distance !== null && driveTime !== null && (
                    <div className="flex items-center gap-3 text-xs text-gray-400 mb-2">
                      <span className="flex items-center gap-1">
                        <Navigation className="w-3 h-3" />
                        {distance.toFixed(1)} km
                      </span>
                      <span>•</span>
                      <span>{driveTime} min</span>
                      {efficiency !== null && efficiency > 2 && (
                        <>
                          <span>•</span>
                          <span className="flex items-center gap-1 text-neon-green font-bold">
                            <Zap className="w-3 h-3" />
                            {efficiency.toFixed(1)}
                          </span>
                        </>
                      )}
                    </div>
                  )}

                  {/* Active Factors */}
                  {activeFactors.length > 0 && (
                    <div className="flex items-center gap-2">
                      {activeFactors.map((factor, idx) => (
                        <div key={idx} className={`flex items-center gap-1 text-xs ${factor.color}`}>
                          <factor.icon className="w-3 h-3" />
                          <span className="font-semibold">+{factor.value}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Score & Navigate Button */}
                <div className="flex-shrink-0 flex items-center gap-3">
                  {/* Navigate Button (shows on hover) */}
                  <motion.button
                    onClick={(e) => {
                      e.stopPropagation();
                      openNavigation(zone.coordinates, getDefaultNavigationApp());
                    }}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 px-3 py-2 bg-neon-cyan/20 hover:bg-neon-cyan/30 border border-neon-cyan/50 rounded-lg text-neon-cyan text-xs font-bold"
                  >
                    <Map className="w-3 h-3" />
                    GO
                  </motion.button>

                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: index * 0.05 + 0.3, type: "spring" }}
                    className={`text-4xl font-black ${scoreColor} tabular-nums`}
                  >
                    {zone.score}
                  </motion.div>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}

