import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { CompletedShift, WeeklyStats } from './types';

interface HistoryStore {
  shifts: CompletedShift[];
  addShift: (shift: CompletedShift) => void;
  deleteShift: (id: string) => void;
  getShiftsInRange: (startDate: Date, endDate: Date) => CompletedShift[];
  getWeeklyStats: (weekStartDate: Date) => WeeklyStats;
  clear: () => void;
}

export const useHistoryStore = create<HistoryStore>()(
  persist(
    (set, get) => ({
      shifts: [],

      addShift: (shift) => set((state) => ({
        shifts: [...state.shifts, shift],
      })),

      deleteShift: (id) => set((state) => ({
        shifts: state.shifts.filter(s => s.id !== id),
      })),

      getShiftsInRange: (startDate, endDate) => {
        const shifts = get().shifts;
        return shifts.filter(shift => {
          const shiftEnd = new Date(shift.endTime);
          return shiftEnd >= startDate && shiftEnd <= endDate;
        });
      },

      getWeeklyStats: (weekStartDate) => {
        const weekEndDate = new Date(weekStartDate);
        weekEndDate.setDate(weekEndDate.getDate() + 7);
        
        const weekShifts = get().getShiftsInRange(weekStartDate, weekEndDate);
        
        if (weekShifts.length === 0) {
          return {
            weekStartDate: weekStartDate.toISOString(),
            totalShifts: 0,
            totalMinutes: 0,
            totalEarnings: 0,
            averageShiftLength: 0,
          };
        }

        const totalMinutes = weekShifts.reduce((sum, s) => sum + s.durationMinutes, 0);
        const totalEarnings = weekShifts.reduce((sum, s) => sum + s.estimatedEarnings, 0);
        const bestShift = weekShifts.reduce((best, current) => 
          current.estimatedEarnings > best.estimatedEarnings ? current : best
        );

        return {
          weekStartDate: weekStartDate.toISOString(),
          totalShifts: weekShifts.length,
          totalMinutes,
          totalEarnings,
          averageShiftLength: totalMinutes / weekShifts.length,
          bestShift,
        };
      },

      clear: () => set({ shifts: [] }),
    }),
    {
      name: 'night-driver-history',
    }
  )
);

