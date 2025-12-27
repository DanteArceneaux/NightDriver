import { motion } from 'framer-motion';
import { Calendar, DollarSign, Clock, TrendingUp, Award } from 'lucide-react';
import { useHistoryStore } from '../../features/history';
import { useState } from 'react';

export function WeeklyRecap() {
  const { getWeeklyStats } = useHistoryStore();
  
  // Get current week start (Monday)
  const getCurrentWeekStart = (): Date => {
    const now = new Date();
    const dayOfWeek = now.getDay();
    const diff = dayOfWeek === 0 ? -6 : 1 - dayOfWeek; // Adjust to Monday
    const monday = new Date(now);
    monday.setDate(now.getDate() + diff);
    monday.setHours(0, 0, 0, 0);
    return monday;
  };

  const [weekOffset, setWeekOffset] = useState(0); // 0 = current week, -1 = last week, etc.

  const getWeekStart = (): Date => {
    const currentWeek = getCurrentWeekStart();
    currentWeek.setDate(currentWeek.getDate() + (weekOffset * 7));
    return currentWeek;
  };

  const weekStart = getWeekStart();
  const stats = getWeeklyStats(weekStart);

  const formatDate = (date: Date): string => {
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const getWeekEndDate = (start: Date): Date => {
    const end = new Date(start);
    end.setDate(end.getDate() + 6);
    return end;
  };

  const formatDuration = (minutes: number): string => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  const weekEnd = getWeekEndDate(weekStart);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-black text-white uppercase tracking-wider">
          📊 Weekly Recap
        </h2>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setWeekOffset(weekOffset - 1)}
            className="px-3 py-1 glass rounded-lg text-sm font-bold text-white hover:bg-white/10 transition-colors"
          >
            ←
          </button>
          <div className="text-sm font-bold text-gray-300">
            {formatDate(weekStart)} - {formatDate(weekEnd)}
          </div>
          <button
            onClick={() => setWeekOffset(weekOffset + 1)}
            disabled={weekOffset >= 0}
            className="px-3 py-1 glass rounded-lg text-sm font-bold text-white hover:bg-white/10 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
          >
            →
          </button>
        </div>
      </div>

      {stats.totalShifts === 0 ? (
        <div className="glass rounded-2xl p-8 text-center">
          <Calendar className="w-16 h-16 text-gray-500 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-white mb-2">No Shifts This Week</h3>
          <p className="text-gray-400">Start a shift to see your weekly stats here.</p>
        </div>
      ) : (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="glass-strong rounded-xl p-4 border border-theme-accent/30"
            >
              <div className="flex items-center gap-2 mb-2">
                <DollarSign className="w-5 h-5 text-theme-accent" />
                <span className="text-xs text-gray-400 uppercase">Total</span>
              </div>
              <div className="text-3xl font-black text-theme-accent">${stats.totalEarnings.toFixed(0)}</div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="glass-strong rounded-xl p-4 border border-theme-primary/30"
            >
              <div className="flex items-center gap-2 mb-2">
                <Calendar className="w-5 h-5 text-theme-primary" />
                <span className="text-xs text-gray-400 uppercase">Shifts</span>
              </div>
              <div className="text-3xl font-black text-white">{stats.totalShifts}</div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="glass-strong rounded-xl p-4 border border-theme-secondary/30"
            >
              <div className="flex items-center gap-2 mb-2">
                <Clock className="w-5 h-5 text-theme-secondary" />
                <span className="text-xs text-gray-400 uppercase">Total Time</span>
              </div>
              <div className="text-2xl font-black text-white">{formatDuration(stats.totalMinutes)}</div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="glass-strong rounded-xl p-4 border border-yellow-500/30"
            >
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="w-5 h-5 text-yellow-400" />
                <span className="text-xs text-gray-400 uppercase">Avg/Hour</span>
              </div>
              <div className="text-2xl font-black text-yellow-400">
                ${Math.round((stats.totalEarnings / stats.totalMinutes) * 60)}/hr
              </div>
            </motion.div>
          </div>

          {/* Best Shift */}
          {stats.bestShift && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="glass-strong rounded-xl p-6 border-2 border-yellow-500/50"
            >
              <div className="flex items-center gap-3 mb-4">
                <Award className="w-6 h-6 text-yellow-400" />
                <h3 className="text-xl font-black text-yellow-400 uppercase">Best Shift</h3>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm text-gray-400 mb-1">
                    {new Date(stats.bestShift.endTime).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </div>
                  <div className="text-lg font-bold text-white">
                    {formatDuration(stats.bestShift.durationMinutes)} • {stats.bestShift.zonesVisited.length} zones
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-3xl font-black text-theme-accent">
                    ${stats.bestShift.estimatedEarnings.toFixed(0)}
                  </div>
                  <div className="text-sm text-gray-400">
                    ${Math.round((stats.bestShift.estimatedEarnings / stats.bestShift.durationMinutes) * 60)}/hr
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </>
      )}
    </div>
  );
}

