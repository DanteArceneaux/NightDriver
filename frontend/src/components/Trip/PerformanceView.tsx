import { motion } from 'framer-motion';
import { DollarSign, TrendingUp, MapPin, Award } from 'lucide-react';
import { useTripStore } from '../../features/trips';
import { zones } from '../../data/zones';

export function PerformanceView() {
  const { getAllZonePerformance, trips } = useTripStore();
  const performances = getAllZonePerformance();

  if (trips.length === 0) {
    return (
      <div className="glass rounded-2xl p-8 text-center">
        <TrendingUp className="w-16 h-16 text-gray-500 mx-auto mb-4" />
        <h3 className="text-xl font-bold text-white mb-2">No Trip Data Yet</h3>
        <p className="text-gray-400">Log trips to see your actual performance by zone.</p>
      </div>
    );
  }

  const getZoneName = (zoneId: string): string => {
    return zones.find(z => z.id === zoneId)?.name || zoneId;
  };

  const totalEarnings = performances.reduce((sum, p) => sum + p.totalEarnings, 0);
  const totalTrips = performances.reduce((sum, p) => sum + p.trips, 0);
  const averageRate = performances.reduce((sum, p) => sum + p.actualHourlyRate, 0) / performances.length;

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-black text-white uppercase tracking-wider">
        📈 Performance by Zone
      </h2>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-strong rounded-xl p-4 border border-neon-green/30"
        >
          <DollarSign className="w-5 h-5 text-neon-green mb-2" />
          <div className="text-2xl font-black text-neon-green">${totalEarnings.toFixed(0)}</div>
          <div className="text-xs text-gray-400">Total Logged</div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="glass-strong rounded-xl p-4 border border-neon-cyan/30"
        >
          <MapPin className="w-5 h-5 text-neon-cyan mb-2" />
          <div className="text-2xl font-black text-white">{totalTrips}</div>
          <div className="text-xs text-gray-400">Total Trips</div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="glass-strong rounded-xl p-4 border border-yellow-500/30"
        >
          <TrendingUp className="w-5 h-5 text-yellow-400 mb-2" />
          <div className="text-2xl font-black text-yellow-400">${Math.round(averageRate)}/hr</div>
          <div className="text-xs text-gray-400">Avg Rate</div>
        </motion.div>
      </div>

      {/* Performance List */}
      <div className="space-y-2">
        {performances.map((perf, idx) => (
          <motion.div
            key={perf.zoneId}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: idx * 0.05 }}
            className="glass rounded-xl p-4 flex items-center justify-between border border-white/10 hover:border-neon-cyan/50 transition-all"
          >
            <div className="flex items-center gap-3">
              {idx === 0 && <Award className="w-5 h-5 text-yellow-400" />}
              <div>
                <div className="font-bold text-white">{getZoneName(perf.zoneId)}</div>
                <div className="text-sm text-gray-400">{perf.trips} trips</div>
              </div>
            </div>
            <div className="text-right">
              <div className="text-xl font-black text-neon-green">${Math.round(perf.actualHourlyRate)}/hr</div>
              <div className="text-xs text-gray-400">${perf.totalEarnings.toFixed(0)} total</div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

