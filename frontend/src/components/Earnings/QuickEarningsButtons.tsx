import { motion } from 'framer-motion';
import { DollarSign, Plus } from 'lucide-react';
import { useState } from 'react';
import { useEarningsStore } from '../../features/earnings';
import { useTheme } from '../../features/theme';

export function QuickEarningsButtons() {
  const { addEarnings, dailyGoal, setDailyGoal } = useEarningsStore();
  const { id: themeId } = useTheme();
  const [showSetGoal, setShowSetGoal] = useState(!dailyGoal);
  const [goalInput, setGoalInput] = useState('200');

  // Don't show in Car Mode
  if (themeId === 'car') {
    return null;
  }

  const quickAmounts = [5, 10, 15, 20, 25, 30];

  const handleAddEarnings = (amount: number) => {
    addEarnings(amount);
    
    // Visual feedback
    const button = document.activeElement as HTMLElement;
    if (button) {
      button.classList.add('scale-125');
      setTimeout(() => button.classList.remove('scale-125'), 200);
    }
  };

  const handleSetGoal = () => {
    const amount = parseInt(goalInput);
    if (amount > 0) {
      setDailyGoal(amount);
      setShowSetGoal(false);
    }
  };

  if (showSetGoal) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-40 glass-strong rounded-2xl p-6 border-2 border-theme-primary/30 shadow-2xl max-w-sm"
      >
        <h3 className="text-xl font-black text-white mb-4 flex items-center gap-2">
          <Target className="w-6 h-6 text-theme-primary" />
          Set Today's Goal
        </h3>
        <div className="flex gap-3">
          <div className="flex-1 relative">
            <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-theme-primary" />
            <input
              type="number"
              value={goalInput}
              onChange={(e) => setGoalInput(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-black/40 border border-white/20 rounded-xl text-white font-bold text-lg focus:border-theme-primary focus:outline-none focus:ring-2 focus:ring-theme-primary/30"
              placeholder="200"
              autoFocus
            />
          </div>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleSetGoal}
            className="px-6 py-3 bg-gradient-to-r from-theme-primary to-theme-accent rounded-xl text-black font-black text-lg shadow-lg hover:shadow-theme-primary/50 transition-all"
          >
            Start
          </motion.button>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="fixed bottom-24 right-6 z-40 flex flex-col gap-2"
    >
      {quickAmounts.map((amount) => (
        <motion.button
          key={amount}
          whileHover={{ scale: 1.1, x: -5 }}
          whileTap={{ scale: 0.9 }}
          onClick={() => handleAddEarnings(amount)}
          className="w-16 h-16 glass-strong rounded-full flex flex-col items-center justify-center border-2 border-theme-primary/30 hover:border-theme-primary hover:shadow-lg hover:shadow-theme-primary/50 transition-all group"
        >
          <Plus className="w-4 h-4 text-theme-primary group-hover:scale-125 transition-transform" />
          <span className="text-sm font-black text-white">${amount}</span>
        </motion.button>
      ))}
      
      {/* Goal Settings Button */}
      <motion.button
        whileHover={{ scale: 1.1, x: -5 }}
        whileTap={{ scale: 0.9 }}
        onClick={() => setShowSetGoal(true)}
        className="w-16 h-16 glass-strong rounded-full flex items-center justify-center border-2 border-purple-500/30 hover:border-purple-500 hover:shadow-lg hover:shadow-purple-500/50 transition-all mt-2"
        title="Change Goal"
      >
        <Target className="w-6 h-6 text-purple-400" />
      </motion.button>
    </motion.div>
  );
}

function Target({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="10" />
      <circle cx="12" cy="12" r="6" />
      <circle cx="12" cy="12" r="2" />
    </svg>
  );
}

