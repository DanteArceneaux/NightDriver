import { useEffect } from 'react';
import { useTheme } from './useTheme';
import { useSettingsStore } from '../settings';
import { getColorVars } from '../settings/colorSchemes';

export function ColorSchemeProvider({ children }: { children: React.ReactNode }) {
  const { id: themeId } = useTheme();
  const {
    neonColorScheme,
    proColorScheme,
    hudColorScheme,
    carColorScheme,
  } = useSettingsStore();

  useEffect(() => {
    let colorScheme;
    switch (themeId) {
      case 'neon':
        colorScheme = neonColorScheme;
        break;
      case 'pro':
        colorScheme = proColorScheme;
        break;
      case 'hud':
        colorScheme = hudColorScheme;
        break;
      case 'car':
        colorScheme = carColorScheme;
        break;
      default:
        colorScheme = 'default';
    }

    const colorVars = getColorVars(themeId, colorScheme);
    const root = document.documentElement;

    Object.entries(colorVars).forEach(([key, value]) => {
      root.style.setProperty(key, value);
    });
  }, [themeId, neonColorScheme, proColorScheme, hudColorScheme, carColorScheme]);

  return <>{children}</>;
}

