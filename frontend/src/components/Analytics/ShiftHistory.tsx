import { motion } from 'framer-motion';
import { Calendar, Clock, TrendingUp, MapPin } from 'lucide-react';
import { useHistoryStore } from '../../features/history';
import type { CompletedShift } from '../../features/history';

export function ShiftHistory() {
  const { shifts } = useHistoryStore();

  const formatDuration = (minutes: number): string => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      hour: '2-digit', 
      minute: '2-digit'
    });
  };

  const getGoalLabel = (goal: CompletedShift['goal']): string => {
    switch (goal) {
      case 'balanced': return '⚖️ Balanced';
      case 'max_earnings': return '💰 Max Earnings';
      case 'short_distance': return '🎯 Short Distance';
      default: return goal;
    }
  };

  // Sort shifts by end time (most recent first)
  const sortedShifts = [...shifts].sort((a, b) => 
    new Date(b.endTime).getTime() - new Date(a.endTime).getTime()
  );

  if (shifts.length === 0) {
    return (
      <div className="glass rounded-2xl p-8 text-center">
        <Calendar className="w-16 h-16 text-gray-500 mx-auto mb-4" />
        <h3 className="text-xl font-bold text-white mb-2">No Shift History Yet</h3>
        <p className="text-gray-400">Complete your first shift to see your history here.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-black text-white uppercase tracking-wider mb-4">
        📜 Shift History
      </h2>
      
      <div className="space-y-3">
        {sortedShifts.map((shift) => (
          <motion.div
            key={shift.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass rounded-xl p-4 border border-white/10 hover:border-theme-primary/50 transition-all"
          >
            <div className="flex items-start justify-between mb-3">
              <div>
                <div className="text-sm text-gray-400 mb-1">
                  {formatDate(shift.startTime)} → {formatDate(shift.endTime)}
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs px-2 py-1 rounded-full bg-theme-secondary/20 text-theme-secondary font-bold">
                    {getGoalLabel(shift.goal)}
                  </span>
                </div>
              </div>
              <div className="text-right">
                <div className="text-2xl font-black text-theme-accent">
                  ${shift.estimatedEarnings.toFixed(0)}
                </div>
                <div className="text-xs text-gray-400">estimated</div>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="flex items-center gap-2 p-2 bg-white/5 rounded-lg">
                <Clock className="w-4 h-4 text-blue-400" />
                <div>
                  <div className="text-xs text-gray-400">Duration</div>
                  <div className="text-sm font-bold text-white">{formatDuration(shift.durationMinutes)}</div>
                </div>
              </div>
              
              <div className="flex items-center gap-2 p-2 bg-white/5 rounded-lg">
                <MapPin className="w-4 h-4 text-purple-400" />
                <div>
                  <div className="text-xs text-gray-400">Zones</div>
                  <div className="text-sm font-bold text-white">{shift.zonesVisited.length}</div>
                </div>
              </div>
              
              <div className="flex items-center gap-2 p-2 bg-white/5 rounded-lg">
                <TrendingUp className="w-4 h-4 text-green-400" />
                <div>
                  <div className="text-xs text-gray-400">Hourly</div>
                  <div className="text-sm font-bold text-white">
                    ${Math.round((shift.estimatedEarnings / shift.durationMinutes) * 60)}/hr
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

