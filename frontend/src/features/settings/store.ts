import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { AppSettings, ColorScheme } from './types';
import { defaultSettings } from './types';

interface SettingsStore extends AppSettings {
  updateSettings: (settings: Partial<AppSettings>) => void;
  setColorScheme: (theme: 'dream' | 'neon' | 'pro' | 'hud' | 'car', scheme: ColorScheme) => void;
  togglePreferredZone: (zoneId: string) => void;
  toggleAvoidZone: (zoneId: string) => void;
  reset: () => void;
}

export const useSettingsStore = create<SettingsStore>()(
  persist(
    (set) => ({
      ...defaultSettings,

      updateSettings: (settings) => set((state) => ({ ...state, ...settings })),

      setColorScheme: (theme, scheme) => set((state) => ({
        ...state,
        [`${theme}ColorScheme`]: scheme,
      })),

      togglePreferredZone: (zoneId) => set((state) => {
        const preferred = state.preferredZones.includes(zoneId)
          ? state.preferredZones.filter(id => id !== zoneId)
          : [...state.preferredZones, zoneId];
        return { preferredZones: preferred };
      }),

      toggleAvoidZone: (zoneId) => set((state) => {
        const avoid = state.avoidZones.includes(zoneId)
          ? state.avoidZones.filter(id => id !== zoneId)
          : [...state.avoidZones, zoneId];
        return { avoidZones: avoid };
      }),

      reset: () => set(defaultSettings),
    }),
    {
      name: 'night-driver-settings',
    }
  )
);

