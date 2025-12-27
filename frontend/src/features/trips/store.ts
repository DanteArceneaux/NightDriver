import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { LoggedTrip, ZonePerformance } from './types';

interface TripStore {
  trips: LoggedTrip[];
  addTrip: (trip: LoggedTrip) => void;
  deleteTrip: (id: string) => void;
  getZonePerformance: (zoneId: string) => ZonePerformance | null;
  getAllZonePerformance: () => ZonePerformance[];
  clear: () => void;
}

export const useTripStore = create<TripStore>()(
  persist(
    (set, get) => ({
      trips: [],

      addTrip: (trip) => set((state) => ({
        trips: [...state.trips, trip],
      })),

      deleteTrip: (id) => set((state) => ({
        trips: state.trips.filter(t => t.id !== id),
      })),

      getZonePerformance: (zoneId) => {
        const trips = get().trips.filter(t => t.zoneId === zoneId);
        if (trips.length === 0) return null;

        const totalEarnings = trips.reduce((sum, t) => sum + t.actualEarnings, 0);
        const totalMinutes = trips.reduce((sum, t) => sum + t.durationMinutes, 0);
        const averageEarnings = totalEarnings / trips.length;
        const actualHourlyRate = (totalEarnings / totalMinutes) * 60;

        return {
          zoneId,
          trips: trips.length,
          totalEarnings,
          averageEarnings,
          actualHourlyRate,
        };
      },

      getAllZonePerformance: () => {
        const trips = get().trips;
        const zoneMap = new Map<string, LoggedTrip[]>();

        trips.forEach(trip => {
          const existing = zoneMap.get(trip.zoneId) || [];
          zoneMap.set(trip.zoneId, [...existing, trip]);
        });

        const performances: ZonePerformance[] = [];
        zoneMap.forEach((trips, zoneId) => {
          const totalEarnings = trips.reduce((sum, t) => sum + t.actualEarnings, 0);
          const totalMinutes = trips.reduce((sum, t) => sum + t.durationMinutes, 0);
          const averageEarnings = totalEarnings / trips.length;
          const actualHourlyRate = (totalEarnings / totalMinutes) * 60;

          performances.push({
            zoneId,
            trips: trips.length,
            totalEarnings,
            averageEarnings,
            actualHourlyRate,
          });
        });

        return performances.sort((a, b) => b.actualHourlyRate - a.actualHourlyRate);
      },

      clear: () => set({ trips: [] }),
    }),
    {
      name: 'night-driver-trips',
    }
  )
);

