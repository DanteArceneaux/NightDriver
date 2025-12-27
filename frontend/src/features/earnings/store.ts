import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { DailyGoal, GoalProgress, QuickEarnings } from './types';

interface EarningsStore {
  dailyGoal: DailyGoal | null;
  setDailyGoal: (amount: number) => void;
  addEarnings: (amount: number) => void;
  clearToday: () => void;
  getProgress: () => GoalProgress | null;
}

export const useEarningsStore = create<EarningsStore>()(
  persist(
    (set, get) => ({
      dailyGoal: null,

      setDailyGoal: (amount) => {
        const today = new Date().toDateString();
        const existing = get().dailyGoal;
        
        // If setting goal for a new day, clear old data
        if (existing && new Date(existing.startTime).toDateString() !== today) {
          set({
            dailyGoal: {
              amount,
              startTime: new Date().toISOString(),
              earnings: [],
            },
          });
        } else {
          set({
            dailyGoal: {
              amount,
              startTime: existing?.startTime || new Date().toISOString(),
              earnings: existing?.earnings || [],
            },
          });
        }
      },

      addEarnings: (amount) => {
        const current = get().dailyGoal;
        if (!current) return;

        const newEarning: QuickEarnings = {
          amount,
          timestamp: new Date().toISOString(),
        };

        set({
          dailyGoal: {
            ...current,
            earnings: [...current.earnings, newEarning],
          },
        });
      },

      clearToday: () => set({ dailyGoal: null }),

      getProgress: () => {
        const goal = get().dailyGoal;
        if (!goal) return null;

        const currentEarnings = goal.earnings.reduce((sum, e) => sum + e.amount, 0);
        const percentComplete = (currentEarnings / goal.amount) * 100;

        const startTime = new Date(goal.startTime);
        const now = new Date();
        const elapsedMinutes = (now.getTime() - startTime.getTime()) / (1000 * 60);
        const elapsedHours = elapsedMinutes / 60;
        const pacePerHour = elapsedHours > 0 ? currentEarnings / elapsedHours : 0;

        const remaining = goal.amount - currentEarnings;
        const estimatedTimeToGoal = pacePerHour > 0 ? (remaining / pacePerHour) * 60 : 0;

        // "On pace" if current rate will hit goal within reasonable time
        const isOnPace = pacePerHour > 0 && estimatedTimeToGoal < 360; // 6 hours

        return {
          dailyGoal: goal.amount,
          currentEarnings,
          percentComplete: Math.min(percentComplete, 100),
          pacePerHour,
          estimatedTimeToGoal,
          isOnPace,
        };
      },
    }),
    {
      name: 'night-driver-earnings',
    }
  )
);

