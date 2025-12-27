import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { DriverGoal, ShiftState } from './types';
import { useHistoryStore } from '../history';

interface ShiftStore extends ShiftState {
  startShift: (zoneId: string) => void;
  endShift: () => void;
  setCurrentGoal: (goal: DriverGoal) => void;
  setCurrentZone: (zoneId: string) => void;
  addEarnings: (amount: number) => void;
  getShiftDuration: () => number;
  visitedZones: string[];
  addVisitedZone: (zoneId: string) => void;
}

export const useShiftStore = create<ShiftStore>()(
  persist(
    (set, get) => ({
      isActive: false,
      startTime: null,
      currentGoal: 'balanced',
      currentZoneId: null,
      estimatedEarnings: 0,
      visitedZones: [],

      startShift: (zoneId: string) => set({
        isActive: true,
        startTime: new Date().toISOString(),
        currentZoneId: zoneId,
        estimatedEarnings: 0,
        visitedZones: [zoneId],
      }),

      endShift: () => {
        const state = get();
        if (!state.isActive || !state.startTime) return;

        // Save to history
        const endTime = new Date().toISOString();
        const durationMinutes = get().getShiftDuration();
        
        useHistoryStore.getState().addShift({
          id: `shift-${Date.now()}`,
          startTime: state.startTime,
          endTime,
          durationMinutes,
          estimatedEarnings: state.estimatedEarnings,
          zonesVisited: state.visitedZones,
          goal: state.currentGoal,
        });

        set({
          isActive: false,
          startTime: null,
          currentZoneId: null,
          visitedZones: [],
        });
      },

      setCurrentGoal: (goal: DriverGoal) => set({ currentGoal: goal }),

      setCurrentZone: (zoneId: string) => {
        set({ currentZoneId: zoneId });
        get().addVisitedZone(zoneId);
      },

      addVisitedZone: (zoneId: string) => set((state) => {
        if (!state.visitedZones.includes(zoneId)) {
          return { visitedZones: [...state.visitedZones, zoneId] };
        }
        return state;
      }),

      addEarnings: (amount: number) => set((state) => ({
        estimatedEarnings: state.estimatedEarnings + amount,
      })),

      getShiftDuration: () => {
        const state = get();
        if (!state.startTime) return 0;
        const start = new Date(state.startTime);
        const now = new Date();
        return Math.floor((now.getTime() - start.getTime()) / (1000 * 60));
      },
    }),
    {
      name: 'night-driver-shift',
    }
  )
);

