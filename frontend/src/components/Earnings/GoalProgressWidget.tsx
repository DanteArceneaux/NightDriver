import { motion, AnimatePresence } from 'framer-motion';
import { Target, TrendingUp, Clock, Zap, PartyPopper, ChevronUp, ChevronDown } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useEarningsStore } from '../../features/earnings';
import { DraggableCard } from '../UI/DraggableCard';
import confetti from 'canvas-confetti';

export function GoalProgressWidget() {
  const { dailyGoal, getProgress } = useEarningsStore();
  const progress = getProgress();
  const [justCompleted, setJustCompleted] = useState(false);
  const [previousPercent, setPreviousPercent] = useState(0);
  const [isMinimized, setIsMinimized] = useState(false);
  const [isOpen, setIsOpen] = useState(true);

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

  const handleClose = () => {
    setIsOpen(false);
    // Optionally clear goal when closing
    // clearDailyGoal();
  };

  // Minimized view - just shows progress bar
  if (isMinimized) {
    return (
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        className="fixed top-20 right-4 z-40 glass-strong rounded-xl p-2 border border-theme-primary/30 shadow-lg cursor-pointer"
        onClick={() => setIsMinimized(false)}
      >
        <div className="flex items-center gap-2">
          <Target className="w-4 h-4 text-theme-primary" />
          <div className="w-20 h-2 bg-black/40 rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-theme-primary to-theme-accent rounded-full"
              style={{ width: `${progress.percentComplete}%` }}
            />
          </div>
          <span className="text-xs font-bold text-white">
            {progress.percentComplete.toFixed(0)}%
          </span>
          <ChevronDown className="w-4 h-4 text-white/60" />
        </div>
      </motion.div>
    );
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <DraggableCard
          title="Today's Goal"
          icon={<Target className="w-5 h-5 text-theme-primary" />}
          isOpen={isOpen}
          onClose={handleClose}
          collapsible={true}
          resizable={false}
          draggable={true}
          defaultPosition={{ x: window.innerWidth > 768 ? window.innerWidth - 340 : 16, y: 80 }}
          defaultSize={{ width: 300, height: 'auto' as any }}
          className="!w-[calc(100vw-32px)] md:!w-80"
          zIndex={40}
        >
          <div className="p-4">
            {/* Goal Completion Badge */}
            {justCompleted && (
              <motion.div
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1, rotate: [0, 10, -10, 0] }}
                className="flex items-center justify-center gap-2 text-yellow-400 mb-3 p-2 bg-yellow-500/20 rounded-lg"
              >
                <PartyPopper className="w-5 h-5" />
                <span className="text-sm font-black">GOAL HIT!</span>
                <PartyPopper className="w-5 h-5" />
              </motion.div>
            )}

            {/* Progress Bar */}
            <div className="mb-4">
              <div className="flex items-baseline justify-between mb-2">
                <span className="text-3xl font-black text-theme-primary">
                  ${progress.currentEarnings.toFixed(0)}
                </span>
                <span className="text-sm text-gray-400">
                  of ${progress.dailyGoal}
                </span>
              </div>
              <div className="relative w-full h-4 bg-black/40 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.min(100, progress.percentComplete)}%` }}
                  transition={{ duration: 0.5, ease: 'easeOut' }}
                  className="absolute inset-y-0 left-0 bg-gradient-to-r from-theme-primary to-theme-accent rounded-full"
                  style={{
                    boxShadow: `0 0 20px var(--color-primary)`,
                  }}
                />
              </div>
              <div className="text-sm text-gray-400 mt-1 text-center font-bold">
                {progress.percentComplete.toFixed(0)}% complete
              </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 bg-black/30 rounded-xl">
                <div className="flex items-center gap-1 mb-1">
                  <TrendingUp className="w-4 h-4 text-green-400" />
                  <span className="text-xs text-gray-400">Pace</span>
                </div>
                <div className="text-xl font-black text-white">
                  ${progress.pacePerHour.toFixed(0)}/hr
                </div>
              </div>

              <div className="p-3 bg-black/30 rounded-xl">
                <div className="flex items-center gap-1 mb-1">
                  <Clock className="w-4 h-4 text-blue-400" />
                  <span className="text-xs text-gray-400">To Goal</span>
                </div>
                <div className={`text-xl font-black ${
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
              <div className={`mt-4 p-3 rounded-xl text-center text-sm font-bold ${
                progress.isOnPace 
                  ? 'bg-green-600/20 text-green-400 border border-green-600/50'
                  : 'bg-orange-600/20 text-orange-400 border border-orange-600/50'
              }`}>
                {progress.isOnPace ? (
                  <span className="flex items-center justify-center gap-2">
                    <Zap className="w-4 h-4" />
                    On Pace! Keep it up!
                  </span>
                ) : (
                  <span>Need to pick up the pace 💪</span>
                )}
              </div>
            )}

            {/* Minimize Button */}
            <button
              onClick={() => setIsMinimized(true)}
              className="w-full mt-3 py-2 text-center text-xs text-gray-400 hover:text-white flex items-center justify-center gap-1"
            >
              <ChevronUp className="w-4 h-4" />
              Minimize
            </button>
          </div>
        </DraggableCard>
      )}
    </AnimatePresence>
  );
}
