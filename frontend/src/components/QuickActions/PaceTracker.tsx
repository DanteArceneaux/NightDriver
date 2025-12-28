import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, AlertCircle } from 'lucide-react';
import { useEarningsStore } from '../../features/earnings';

interface PaceTrackerProps {
  onClose?: () => void;
}

export function PaceTracker({ onClose }: PaceTrackerProps) {
  const { getProgress, dailyGoal } = useEarningsStore();
  const progress = getProgress();
  const [paceData, setPaceData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const currentEarnings = progress?.currentEarnings || 0;
  const goalAmount = dailyGoal?.amount || 200;

  useEffect(() => {
    fetchPace();
  }, [currentEarnings, goalAmount]);

  const fetchPace = async () => {
    setLoading(true);
    try {
      const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001';
      const response = await fetch(`${backendUrl}/api/pace-check`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentEarnings,
          hoursWorked: progress?.pacePerHour ? (currentEarnings / progress.pacePerHour) : 4,
          dailyGoal: goalAmount,
          plannedTotalHours: 8,
        }),
      });
      const data = await response.json();
      setPaceData(data);
    } catch (error) {
      console.error('Error fetching pace data:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        className="bg-gray-900 rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden border border-pink-500/30"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-pink-600 to-purple-600 p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-white/20 p-3 rounded-xl">
                <TrendingUp className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white">Earnings Pace</h2>
                <p className="text-pink-100 text-sm">Real-time goal tracking</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-white/80 hover:text-white transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-4 border-pink-500 border-t-transparent"></div>
            </div>
          ) : !paceData ? (
            <div className="text-center py-12 text-gray-400">
              <AlertCircle className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>Failed to load pace data</p>
            </div>
          ) : (
            <>
              {/* Main Stats */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-800 rounded-2xl p-4 border border-white/5">
                  <div className="text-gray-400 text-xs font-bold uppercase mb-1">Current</div>
                  <div className="text-2xl font-black text-white">${currentEarnings}</div>
                </div>
                <div className="bg-gray-800 rounded-2xl p-4 border border-white/5">
                  <div className="text-gray-400 text-xs font-bold uppercase mb-1">Goal</div>
                  <div className="text-2xl font-black text-theme-primary">${goalAmount}</div>
                </div>
              </div>

              {/* Progress Bar */}
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-gray-400">Progress</span>
                  <span className="text-white font-bold">{Math.round((currentEarnings / goalAmount) * 100)}%</span>
                </div>
                <div className="h-4 bg-gray-800 rounded-full overflow-hidden border border-white/5">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.min(100, (currentEarnings / goalAmount) * 100)}%` }}
                    className="h-full bg-gradient-to-r from-pink-500 to-purple-500"
                  />
                </div>
              </div>

              {/* Status Message */}
              <div className={`p-4 rounded-xl border ${
                paceData.status === 'ahead' ? 'bg-green-500/10 border-green-500/30 text-green-400' :
                paceData.status === 'behind' ? 'bg-red-500/10 border-red-500/30 text-red-400' :
                'bg-yellow-500/10 border-yellow-500/30 text-yellow-400'
              }`}>
                <div className="flex items-center gap-3">
                  {paceData.status === 'ahead' ? <TrendingUp className="w-6 h-6" /> : <AlertCircle className="w-6 h-6" />}
                  <div>
                    <div className="font-bold text-lg uppercase tracking-tight">
                      {paceData.status.toUpperCase()} SCHEDULE
                    </div>
                    <p className="text-sm opacity-90">{paceData.message}</p>
                  </div>
                </div>
              </div>

              {/* Hourly Stats */}
              <div className="space-y-3">
                <div className="flex items-center justify-between text-sm text-gray-400">
                  <span>Current Pace</span>
                  <span className="text-white font-bold">${paceData.currentHourlyRate}/hr</span>
                </div>
                <div className="flex items-center justify-between text-sm text-gray-400">
                  <span>Required Pace</span>
                  <span className="text-theme-primary font-bold">${paceData.requiredHourlyRate}/hr</span>
                </div>
              </div>

              <button
                onClick={onClose}
                className="w-full py-4 bg-gray-800 hover:bg-gray-700 text-white font-bold rounded-xl transition-all border border-white/5"
              >
                Close
              </button>
            </>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}

