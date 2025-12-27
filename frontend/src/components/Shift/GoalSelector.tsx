import { motion } from 'framer-motion';
import { DollarSign, Zap, MapPin } from 'lucide-react';
import { useShiftStore } from '../../features/shift/store';
import type { DriverGoal } from '../../features/shift/types';

const goals: Array<{
  id: DriverGoal;
  name: string;
  icon: typeof DollarSign;
  description: string;
  color: string;
}> = [
  {
    id: 'balanced',
    name: 'Balanced',
    icon: Zap,
    description: 'Good earnings + reasonable distance',
    color: 'text-neon-cyan',
  },
  {
    id: 'max_earnings',
    name: 'Max Earnings',
    icon: DollarSign,
    description: 'Highest score zones (may be far)',
    color: 'text-neon-green',
  },
  {
    id: 'short_distance',
    name: 'Stay Close',
    icon: MapPin,
    description: 'Minimize driving distance',
    color: 'text-blue-400',
  },
];

export function GoalSelector() {
  const { currentGoal, setCurrentGoal } = useShiftStore();

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-bold text-gray-300 uppercase tracking-widest">
        Driving Goal
      </h3>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {goals.map((goal) => {
          const isActive = currentGoal === goal.id;
          return (
            <motion.button
              key={goal.id}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setCurrentGoal(goal.id)}
              className={`p-4 rounded-xl border-2 transition-all ${
                isActive
                  ? 'bg-white/10 border-neon-cyan shadow-[0_0_15px_rgba(0,255,238,0.3)]'
                  : 'bg-white/5 border-white/10 hover:border-white/30'
              }`}
            >
              <div className="flex items-center gap-3 mb-2">
                <goal.icon className={`w-6 h-6 ${isActive ? goal.color : 'text-gray-400'}`} />
                <span className={`font-bold ${isActive ? 'text-white' : 'text-gray-400'}`}>
                  {goal.name}
                </span>
              </div>
              <p className="text-xs text-gray-500 text-left">
                {goal.description}
              </p>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}

