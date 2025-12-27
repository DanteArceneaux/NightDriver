import { useThemeStore } from './store';
import { getTheme } from './themes';
import type { Theme, ThemeId } from './types';

export function useTheme(): Theme & { setThemeId: (id: ThemeId) => void } {
  const { themeId, setThemeId } = useThemeStore();
  const theme = getTheme(themeId);
  
  return {
    ...theme,
    setThemeId,
  };
}

