import { motion, AnimatePresence } from 'framer-motion';
import { Target, TrendingUp, Clock, Zap, PartyPopper } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useEarningsStore } from '../../features/earnings';
import confetti from 'canvas-confetti';

export function GoalProgressWidget() {
  const { dailyGoal, getProgress } = useEarningsStore();
  const progress = getProgress();
  const [justCompleted, setJustCompleted] = useState(false);
  const [previousPercent, setPreviousPercent] = useState(0);

  useEffect(() => {
    if (!progress) return;

    // Check if goal just completed
    if (progress.percentComplete >= 100 && previousPercent < 100) {
      setJustCompleted(true);
      
      // Celebration effect!
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#00ffee', '#a855f7', '#ff006e', '#00ff66'],
      });

      // Play audio
      const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBSuBzvLZijoIGGS57OihUBEJTaXh8LdjHAU2jNXwzn0vBSh+zPLaizsIHGzB7OihTxEJUqvm8LljHAU7k9j/.../9iJMwkZY7rp77BXEQtOpN/uxGMfBTWP1+/JeiwGKX/M8tmOPAgdfMnq66hTEQtQpd/ts2EgBDqT1+/HdykGLIHM8tiMOwgaZ7zq7aRREQxOpN3vyGIgBTyU1+/GdCgGLYHN8deMOwkYZLrq7aRREQtOpN3vyWIgBTyS1+7HdCgGLYHN8deLOwkXY7nq7qRRDwpOpODvx2IeBTuR1+7HcycGLoHO8dmLPAkYZLrq7aVREQtOpN3vyGMgBTyS1+7HcygGLYHO8dmLPAkYZLnq7aVREQpOpN3vyGMgBTyS1+7HcygGLYHO8dmKPAkXY7rq7aVRDwlOpN3vyGMgBTyS1+7HcygGLYHO8tmLPAkYZLnq7aVREQtOpN3vyGMgBTyS1+7HcygGLYHO8dmLPAkYZLrq7aVREQtOpN3vyGMgBTuS1+7HcygGLYHO8dmLPAkYZLrq7aVREQtOpN3vyGMgBTyS1+7HcygGLYHO8dmLPAkYZLrq7aVREQtOpN3vyGMgBTyS1+7HcygGLYHO8dmLPAkYZLrq7aVREQtOpN3vyGMgBTyS1+7HcygGLYHO8dmLPAkYZLrq7aVREQtOpN3vyGMgBTyS1+7HcygGLYHO8dmLPAkYZLrq7aVREQtOpN3vyGMgBTyS1+7HcygGLYHO8dmLPAkYZLrq7aVREQtOpN3vyGMgBTyS1+7HcygGLYHO8dmLPAkYZLrq7aVREQtOpN3vyGMgBTyS1+7HcygGLYHO8dmLPAkYZLrq7aVREQtOpN3vyGMgBTyS1+7HcygGLYHO8dmLPAkYZLrq7aVREQtOpN3vyGMgBTyS1+7HcygGLYHO8dmLPAkYZLrq7aVREQtOpN3vyGMgBTyS1+7HcygGLYHO8dmLPAkYZLrq7aVREQtOpN3vyGMgBTyS1+7HcygGLYHO8dmLPAkYZLrq7aVREQtOpN3vyGMgBTyS1+7HcygGLYHO8dmLPAkYZLrq7aVREQtOpN3vyGMgBQ==');
      audio.volume = 0.5;
      audio.play().catch(() => {});

      setTimeout(() => setJustCompleted(false), 5000);
    }

    setPreviousPercent(progress.percentComplete);
  }, [progress?.percentComplete]);

  if (!dailyGoal || !progress) {
    return null;
  }

  const formatTime = (minutes: number): string => {
    if (minutes < 60) return `${Math.round(minutes)}m`;
    const hours = Math.floor(minutes / 60);
    const mins = Math.round(minutes % 60);
    return `${hours}h ${mins}m`;
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="fixed top-20 right-4 z-40 w-80 glass-strong rounded-2xl p-4 border-2 border-theme-primary/30 shadow-2xl"
      >
        {/* Goal Header */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Target className="w-5 h-5 text-theme-primary" />
            <span className="font-bold text-white">Today's Goal</span>
          </div>
          {justCompleted && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1, rotate: [0, 10, -10, 0] }}
              className="flex items-center gap-1 text-yellow-400"
            >
              <PartyPopper className="w-5 h-5" />
              <span className="text-sm font-black">GOAL HIT!</span>
            </motion.div>
          )}
        </div>

        {/* Progress Bar */}
        <div className="mb-3">
          <div className="flex items-baseline justify-between mb-1">
            <span className="text-2xl font-black text-theme-primary">
              ${progress.currentEarnings.toFixed(0)}
            </span>
            <span className="text-sm text-gray-400">
              of ${progress.dailyGoal}
            </span>
          </div>
          <div className="relative w-full h-3 bg-black/40 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${progress.percentComplete}%` }}
              transition={{ duration: 0.5, ease: 'easeOut' }}
              className="absolute inset-y-0 left-0 bg-gradient-to-r from-theme-primary to-theme-accent rounded-full"
              style={{
                boxShadow: `0 0 20px var(--color-primary)`,
              }}
            />
          </div>
          <div className="text-xs text-gray-400 mt-1 text-right">
            {progress.percentComplete.toFixed(0)}% complete
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-2">
          <div className="p-2 bg-black/20 rounded-lg">
            <div className="flex items-center gap-1 mb-1">
              <TrendingUp className="w-3 h-3 text-green-400" />
              <span className="text-xs text-gray-400">Pace</span>
            </div>
            <div className="text-lg font-black text-white">
              ${progress.pacePerHour.toFixed(0)}/hr
            </div>
          </div>

          <div className="p-2 bg-black/20 rounded-lg">
            <div className="flex items-center gap-1 mb-1">
              <Clock className="w-3 h-3 text-blue-400" />
              <span className="text-xs text-gray-400">To Goal</span>
            </div>
            <div className={`text-lg font-black ${
              progress.isOnPace ? 'text-green-400' : 'text-orange-400'
            }`}>
              {progress.percentComplete >= 100 
                ? '✓ Done!' 
                : progress.estimatedTimeToGoal > 0 
                  ? formatTime(progress.estimatedTimeToGoal)
                  : 'N/A'
              }
            </div>
          </div>
        </div>

        {/* Pace Indicator */}
        {progress.percentComplete < 100 && (
          <div className={`mt-3 p-2 rounded-lg text-center text-sm font-bold ${
            progress.isOnPace 
              ? 'bg-green-600/20 text-green-400 border border-green-600/50'
              : 'bg-orange-600/20 text-orange-400 border border-orange-600/50'
          }`}>
            {progress.isOnPace ? (
              <span className="flex items-center justify-center gap-2">
                <Zap className="w-4 h-4" />
                On Pace!
              </span>
            ) : (
              <span>Need to pick up the pace</span>
            )}
          </div>
        )}
      </motion.div>
    </AnimatePresence>
  );
}

