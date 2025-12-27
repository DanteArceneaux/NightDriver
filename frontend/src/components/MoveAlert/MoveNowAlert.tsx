import { motion, AnimatePresence } from 'framer-motion';
import { TrendingUp, X, Navigation, Clock, Zap } from 'lucide-react';
import type { MoveRecommendation } from '../../hooks/useMoveRecommendation';
import { useState } from 'react';
import { useTheme } from '../../features/theme';

interface MoveNowAlertProps {
  recommendation: MoveRecommendation;
  onDismiss: () => void;
  onNavigate: () => void;
}

export function MoveNowAlert({ recommendation, onDismiss, onNavigate }: MoveNowAlertProps) {
  const { tokens } = useTheme();
  const [dismissed, setDismissed] = useState(false);

  if (!recommendation.shouldMove || dismissed) return null;

  const handleDismiss = () => {
    setDismissed(true);
    onDismiss();
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        className="fixed top-20 left-1/2 transform -translate-x-1/2 z-50 max-w-md w-full mx-4"
      >
        <div className={`${tokens.glassBg} ${tokens.cardBorder} rounded-xl p-4 shadow-2xl border-2 border-neon-green/50`}>
          {/* Header */}
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-6 h-6 text-neon-green animate-pulse" />
              <h3 className="text-lg font-black text-neon-green uppercase tracking-wider">
                Move Recommendation
              </h3>
            </div>
            <button
              onClick={handleDismiss}
              className="text-gray-400 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Target Zone */}
          <div className="mb-4">
            <div className="text-2xl font-black text-white mb-1">
              {recommendation.targetZone?.name}
            </div>
            <div className="text-sm text-gray-300">
              {recommendation.reason}
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-3 mb-4">
            <div className="glass rounded-lg p-3 text-center">
              <Zap className="w-5 h-5 text-neon-green mx-auto mb-1" />
              <div className="text-lg font-bold text-neon-green">
                +{recommendation.efficiencyGain.toFixed(0)}%
              </div>
              <div className="text-xs text-gray-400">Efficiency</div>
            </div>
            <div className="glass rounded-lg p-3 text-center">
              <Navigation className="w-5 h-5 text-blue-400 mx-auto mb-1" />
              <div className="text-lg font-bold text-white">
                {recommendation.distance.toFixed(1)} mi
              </div>
              <div className="text-xs text-gray-400">Distance</div>
            </div>
            <div className="glass rounded-lg p-3 text-center">
              <Clock className="w-5 h-5 text-neon-cyan mx-auto mb-1" />
              <div className="text-lg font-bold text-white">
                {recommendation.driveTime} min
              </div>
              <div className="text-xs text-gray-400">Drive Time</div>
            </div>
          </div>

          {/* Action Button */}
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={onNavigate}
            className="w-full flex items-center justify-center gap-3 px-6 py-3 bg-gradient-to-r from-neon-green/30 to-green-600/30 border-2 border-neon-green/50 rounded-xl text-white font-bold text-lg shadow-lg hover:shadow-neon-green/30 transition-all"
          >
            <Navigation className="w-5 h-5" />
            Navigate Now
          </motion.button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

