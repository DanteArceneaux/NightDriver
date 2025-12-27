import { motion } from 'framer-motion';
import { Play, Square, Clock, DollarSign } from 'lucide-react';
import { useShiftStore } from '../../features/shift/store';
import { useEffect, useState } from 'react';

interface ShiftControlProps {
  currentZoneId?: string;
}

export function ShiftControl({ currentZoneId }: ShiftControlProps) {
  const { isActive, startShift, endShift, estimatedEarnings, getShiftDuration } = useShiftStore();
  const [duration, setDuration] = useState(0);

  useEffect(() => {
    if (!isActive) return;

    const interval = setInterval(() => {
      setDuration(getShiftDuration());
    }, 60000); // Update every minute

    setDuration(getShiftDuration());

    return () => clearInterval(interval);
  }, [isActive, getShiftDuration]);

  const formatDuration = (mins: number): string => {
    const hours = Math.floor(mins / 60);
    const minutes = mins % 60;
    if (hours === 0) return `${minutes}m`;
    return `${hours}h ${minutes}m`;
  };

  if (!isActive) {
    return (
      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={() => currentZoneId && startShift(currentZoneId)}
        disabled={!currentZoneId}
        className="w-full flex items-center justify-center gap-3 px-6 py-4 bg-gradient-to-r from-neon-green/30 to-green-600/30 border-2 border-neon-green/50 rounded-xl text-white font-bold text-lg shadow-lg hover:shadow-neon-green/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <Play className="w-6 h-6" />
        Start Shift
      </motion.button>
    );
  }

  return (
    <div className="space-y-3">
      {/* Shift Stats */}
      <div className="glass-strong rounded-xl p-4 border border-neon-green/30">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-neon-green rounded-full animate-pulse" />
            <span className="text-sm font-bold text-neon-green uppercase tracking-wider">
              Shift Active
            </span>
          </div>
          <div className="flex items-center gap-2 text-gray-300">
            <Clock className="w-4 h-4" />
            <span className="font-mono">{formatDuration(duration)}</span>
          </div>
        </div>

        <div className="flex items-center gap-2 text-2xl font-black text-neon-green">
          <DollarSign className="w-6 h-6" />
          <span>${estimatedEarnings.toFixed(2)}</span>
          <span className="text-sm text-gray-400 font-medium">estimated</span>
        </div>
      </div>

      {/* End Shift Button */}
      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={endShift}
        className="w-full flex items-center justify-center gap-3 px-6 py-3 bg-red-600/30 border-2 border-red-500/50 rounded-xl text-white font-bold text-lg hover:bg-red-600/40 transition-all"
      >
        <Square className="w-5 h-5" />
        End Shift
      </motion.button>
    </div>
  );
}

