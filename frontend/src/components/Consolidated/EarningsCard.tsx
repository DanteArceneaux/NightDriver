import { motion, AnimatePresence } from 'framer-motion';
import { Target, TrendingUp, Clock, Zap, PartyPopper, Plus, DollarSign, Settings2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useEarningsStore } from '../../features/earnings';
import confetti from 'canvas-confetti';

export function EarningsCard() {
  const { dailyGoal, getProgress, addEarnings, setDailyGoal } = useEarningsStore();
  const progress = getProgress();
  const [justCompleted, setJustCompleted] = useState(false);
  const [previousPercent, setPreviousPercent] = useState(0);
  const [showSetGoal, setShowSetGoal] = useState(!dailyGoal);
  const [goalInput, setGoalInput] = useState(dailyGoal?.toString() || '200');

  useEffect(() => {
    if (!progress) return;

    if (progress.percentComplete >= 100 && previousPercent < 100) {
      setJustCompleted(true);
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#00ffee', '#a855f7', '#ff006e', '#00ff66'],
      });
      setTimeout(() => setJustCompleted(false), 5000);
    }
    setPreviousPercent(progress.percentComplete);
  }, [progress?.percentComplete, previousPercent]);

  if (!progress) return null;

  const quickAmounts = [5, 10, 15, 20, 25, 30];

  const handleAddEarnings = (amount: number) => {
    addEarnings(amount);
  };

  const handleSetGoal = () => {
    const amount = parseInt(goalInput);
    if (amount > 0) {
      setDailyGoal(amount);
      setShowSetGoal(false);
    }
  };

  const formatTime = (minutes: number): string => {
    if (minutes < 60) return `${Math.round(minutes)}m`;
    const hours = Math.floor(minutes / 60);
    const mins = Math.round(minutes % 60);
    return `${hours}h ${mins}m`;
  };

  return (
    <div className="p-4 space-y-6">
      {/* Goal Completion Badge */}
      <AnimatePresence>
        {justCompleted && (
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1, rotate: [0, 10, -10, 0] }}
            exit={{ scale: 0, opacity: 0 }}
            className="flex items-center justify-center gap-2 text-yellow-400 p-2 bg-yellow-500/20 rounded-lg border border-yellow-500/30"
          >
            <PartyPopper className="w-5 h-5" />
            <span className="text-sm font-black">DAILY GOAL HIT! 🚀</span>
            <PartyPopper className="w-5 h-5" />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Progress Section */}
      <div>
        <div className="flex items-baseline justify-between mb-2">
          <div className="flex flex-col">
            <span className="text-4xl font-black text-white leading-none">
              ${progress.currentEarnings.toFixed(0)}
            </span>
            <span className="text-xs text-gray-500 font-bold uppercase tracking-widest mt-1">
              Current Earnings
            </span>
          </div>
          <div className="text-right">
            <button 
              onClick={() => setShowSetGoal(true)}
              className="flex items-center gap-1.5 px-3 py-1 bg-white/5 hover:bg-white/10 rounded-full border border-white/10 transition-all group"
            >
              <Target className="w-3.5 h-3.5 text-theme-primary" />
              <span className="text-sm font-bold text-gray-300">${progress.dailyGoal}</span>
              <Settings2 className="w-3 h-3 text-gray-500 group-hover:rotate-90 transition-transform" />
            </button>
          </div>
        </div>

        <div className="relative w-full h-3 bg-black/40 rounded-full overflow-hidden mb-1">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${Math.min(100, progress.percentComplete)}%` }}
            transition={{ duration: 0.8, ease: 'circOut' }}
            className="absolute inset-y-0 left-0 bg-gradient-to-r from-theme-primary via-theme-secondary to-theme-accent rounded-full"
            style={{ boxShadow: `0 0 15px var(--color-primary)` }}
          />
        </div>
        <div className="flex justify-between text-[10px] font-black text-gray-500 uppercase tracking-tighter">
          <span>0%</span>
          <span className="text-theme-primary">{progress.percentComplete.toFixed(0)}% COMPLETE</span>
          <span>100%</span>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 gap-3">
        <div className="p-3 bg-white/5 rounded-2xl border border-white/5">
          <div className="flex items-center gap-2 mb-1">
            <TrendingUp className="w-4 h-4 text-green-400" />
            <span className="text-[10px] font-bold text-gray-500 uppercase">Pace</span>
          </div>
          <div className="text-xl font-black text-white">
            ${progress.pacePerHour.toFixed(0)}<span className="text-xs text-gray-500 ml-1">/hr</span>
          </div>
        </div>

        <div className="p-3 bg-white/5 rounded-2xl border border-white/5">
          <div className="flex items-center gap-2 mb-1">
            <Clock className="w-4 h-4 text-blue-400" />
            <span className="text-[10px] font-bold text-gray-500 uppercase">ETA to Goal</span>
          </div>
          <div className={`text-xl font-black ${progress.isOnPace ? 'text-green-400' : 'text-orange-400'}`}>
            {progress.percentComplete >= 100 
              ? 'Done!' 
              : progress.estimatedTimeToGoal > 0 
                ? formatTime(progress.estimatedTimeToGoal)
                : 'Calculating...'
            }
          </div>
        </div>
      </div>

      {/* Quick Add Buttons */}
      <div>
        <div className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-3 text-center">
          Quick Add Earnings
        </div>
        <div className="flex flex-wrap justify-center gap-2">
          {quickAmounts.map((amount) => (
            <motion.button
              key={amount}
              whileHover={{ scale: 1.05, y: -2 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => handleAddEarnings(amount)}
              className="h-10 px-4 bg-glass-strong rounded-xl border border-white/10 hover:border-theme-primary/50 flex items-center gap-1 transition-all"
            >
              <Plus className="w-3 h-3 text-theme-primary" />
              <span className="text-sm font-black text-white">${amount}</span>
            </motion.button>
          ))}
        </div>
      </div>

      {/* Set Goal Modal Overlay (Scoped to Card) */}
      <AnimatePresence>
        {showSetGoal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-50 bg-slate-950/90 backdrop-blur-md rounded-[2.5rem] p-6 flex flex-col items-center justify-center text-center"
          >
            <Target className="w-12 h-12 text-theme-primary mb-4" />
            <h3 className="text-xl font-black text-white mb-2 uppercase">Set Daily Goal</h3>
            <p className="text-sm text-gray-400 mb-6">How much do you want to make today?</p>
            
            <div className="flex flex-col w-full max-w-[200px] gap-4">
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-theme-primary" />
                <input
                  type="number"
                  value={goalInput}
                  onChange={(e) => setGoalInput(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/20 rounded-xl text-white font-black text-2xl focus:border-theme-primary focus:outline-none"
                  autoFocus
                />
              </div>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleSetGoal}
                className="w-full py-3 bg-gradient-to-r from-theme-primary to-theme-accent rounded-xl text-black font-black uppercase tracking-wider"
              >
                Let's Go
              </motion.button>
              <button 
                onClick={() => setShowSetGoal(false)}
                className="text-xs text-gray-500 hover:text-white font-bold transition-colors"
              >
                Cancel
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

