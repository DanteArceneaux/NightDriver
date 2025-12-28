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
      themeId: 'dream', // Default to Dream theme for v6.0
      setThemeId: (themeId: ThemeId) => set({ themeId }),
    }),
    {
      name: 'night-driver-theme',
    }
  )
);

