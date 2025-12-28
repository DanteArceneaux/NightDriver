import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { ThemeId } from './types';

interface ThemeState {
  themeId: ThemeId;
  setThemeId: (id: ThemeId) => void;
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set) => ({
      themeId: 'pro', // Default to Pro Dashboard theme (v8.0)
      setThemeId: (themeId: ThemeId) => set({ themeId }),
    }),
    {
      name: 'night-driver-theme',
    }
  )
);

