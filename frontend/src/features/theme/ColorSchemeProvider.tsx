import { useEffect } from 'react';
import { useTheme } from './useTheme';
import { useSettingsStore } from '../settings';
import { getColorVars } from '../settings/colorSchemes';
import type { ColorScheme } from '../settings/types';

export function ColorSchemeProvider({ children }: { children: React.ReactNode }) {
  const { id: themeId } = useTheme();
  const {
    proColorScheme,
    carColorScheme,
  } = useSettingsStore();

  useEffect(() => {
    let colorScheme: ColorScheme;
    switch (themeId) {
      case 'dream':
        colorScheme = proColorScheme; // Dream uses pro color scheme in v8.0
        break;
      // 'neon' case removed in v8.0
      case 'pro':
        colorScheme = proColorScheme;
        break;
      case 'car':
        colorScheme = carColorScheme;
        break;
      default:
        colorScheme = 'default';
    }

    const colorVars = getColorVars(themeId as 'pro' | 'car' | 'dream', colorScheme);
    const root = document.documentElement;

    Object.entries(colorVars).forEach(([key, value]) => {
      root.style.setProperty(key, value);
    });
  }, [themeId, proColorScheme, carColorScheme]);

  return <>{children}</>;
}

