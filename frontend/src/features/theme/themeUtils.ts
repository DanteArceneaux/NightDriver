import { ThemeId } from './types';
import { themes } from './themes';

/**
 * Centralized theme utility functions
 * Provides consistent theme-aware styling across the application
 */

export interface ThemeClasses {
  // Button classes
  buttonPrimary: string;
  buttonSecondary: string;
  buttonPrimaryHover: string;
  buttonSecondaryHover: string;
  
  // Card classes
  cardBg: string;
  cardBorder: string;
  cardHover: string;
  
  // Text classes
  textPrimary: string;
  textSecondary: string;
  textMuted: string;
  
  // Accent colors
  accentSurge: string;
  accentHot: string;
  accentWarm: string;
  accentCool: string;
  
  // Effects
  glow: string;
  shadow: string;
  backdrop: string;
  
  // Typography
  fontDisplay: string;
  fontBody: string;
  
  // Spacing and borders
  spacing: string;
  borderRadius: string;
}

/**
 * Get theme-aware CSS classes for a given theme
 */
export function getThemeClasses(themeId: ThemeId): ThemeClasses {
  const theme = themes[themeId] || themes.neon;
  const tokens = theme.tokens;
  
  return {
    buttonPrimary: tokens.btnPrimary,
    buttonSecondary: tokens.btnSecondary,
    buttonPrimaryHover: tokens.btnPrimaryHover,
    buttonSecondaryHover: tokens.btnSecondaryHover,
    
    cardBg: tokens.cardBg,
    cardBorder: tokens.cardBorder,
    cardHover: tokens.cardHover,
    
    textPrimary: tokens.textPrimary,
    textSecondary: tokens.textSecondary,
    textMuted: tokens.textMuted,
    
    accentSurge: tokens.accentSurge,
    accentHot: tokens.accentHot,
    accentWarm: tokens.accentWarm,
    accentCool: tokens.accentCool,
    
    glow: tokens.glow,
    shadow: tokens.shadow,
    backdrop: tokens.backdrop,
    
    fontDisplay: tokens.fontDisplay,
    fontBody: tokens.fontBody,
    
    spacing: tokens.spacing,
    borderRadius: tokens.borderRadius,
  };
}

/**
 * Get theme-aware button classes
 */
export function getButtonClasses(themeId: ThemeId, variant: 'primary' | 'secondary' = 'primary'): string {
  const classes = getThemeClasses(themeId);
  const base = variant === 'primary' ? classes.buttonPrimary : classes.buttonSecondary;
  const hover = variant === 'primary' ? classes.buttonPrimaryHover : classes.buttonSecondaryHover;
  
  return `${base} ${hover} transition-all duration-200`;
}

/**
 * Get theme-aware card classes
 */
export function getCardClasses(themeId: ThemeId): string {
  const classes = getThemeClasses(themeId);
  return `${classes.cardBg} ${classes.cardBorder} ${classes.cardHover} ${classes.borderRadius} transition-all duration-200`;
}

/**
 * Get theme-aware text color classes
 */
export function getTextClasses(themeId: ThemeId, variant: 'primary' | 'secondary' | 'muted' = 'primary'): string {
  const classes = getThemeClasses(themeId);
  switch (variant) {
    case 'primary': return classes.textPrimary;
    case 'secondary': return classes.textSecondary;
    case 'muted': return classes.textMuted;
  }
}

/**
 * Get theme-aware accent color classes
 */
export function getAccentClasses(themeId: ThemeId, type: 'surge' | 'hot' | 'warm' | 'cool' = 'surge'): string {
  const classes = getThemeClasses(themeId);
  switch (type) {
    case 'surge': return classes.accentSurge;
    case 'hot': return classes.accentHot;
    case 'warm': return classes.accentWarm;
    case 'cool': return classes.accentCool;
  }
}

/**
 * Get score color based on theme
 */
export function getScoreColor(score: number, themeId: ThemeId): string {
  const classes = getThemeClasses(themeId);
  
  if (score >= 80) return classes.accentSurge; // Hot/red
  if (score >= 60) return classes.accentHot;   // Warm/orange
  if (score >= 40) return classes.accentWarm;  // Neutral/cyan
  return classes.accentCool;                   // Cool/blue
}

/**
 * Get score background color based on theme
 */
export function getScoreBackground(score: number, themeId: ThemeId): string {
  if (score >= 80) return 'bg-red-500/20 border-red-500/50';
  if (score >= 60) return 'bg-orange-500/20 border-orange-500/50';
  if (score >= 40) return 'bg-blue-500/20 border-blue-500/50';
  return 'bg-gray-500/20 border-gray-500/50';
}

/**
 * Get event icon styling based on theme
 */
export function getEventIconStyles(themeId: ThemeId, isUrgent: boolean): {
  ringColor: string;
  glowColor: string;
} {
  switch (themeId) {
    case 'pro':
      return {
        ringColor: isUrgent ? 'rgba(239, 68, 68, 0.8)' : 'rgba(59, 130, 246, 0.8)',
        glowColor: isUrgent ? 'rgba(239, 68, 68, 0.5)' : 'rgba(59, 130, 246, 0.5)',
      };
    case 'hud':
      return {
        ringColor: isUrgent ? 'rgba(34, 197, 94, 0.8)' : 'rgba(168, 85, 247, 0.9)',
        glowColor: isUrgent ? 'rgba(34, 197, 94, 0.6)' : 'rgba(236, 72, 153, 0.6)',
      };
    case 'car':
      return {
        ringColor: isUrgent ? 'rgba(239, 68, 68, 0.8)' : 'rgba(34, 197, 94, 0.8)',
        glowColor: isUrgent ? 'rgba(239, 68, 68, 0.4)' : 'rgba(34, 197, 94, 0.4)',
      };
    default: // neon
      return {
        ringColor: isUrgent ? 'rgba(236, 72, 153, 0.8)' : 'rgba(255, 170, 0, 0.9)',
        glowColor: isUrgent ? 'rgba(236, 72, 153, 0.6)' : 'rgba(255, 0, 85, 0.6)',
      };
  }
}

/**
 * Hook for using theme utilities
 * Note: This must be used within a component that has access to React context
 */
import { useTheme } from './useTheme';

export function useThemeUtils() {
  const { id: themeId } = useTheme();
  
  return {
    themeId,
    getButtonClasses: (variant: 'primary' | 'secondary' = 'primary') => getButtonClasses(themeId, variant),
    getCardClasses: () => getCardClasses(themeId),
    getTextClasses: (variant: 'primary' | 'secondary' | 'muted' = 'primary') => getTextClasses(themeId, variant),
    getAccentClasses: (type: 'surge' | 'hot' | 'warm' | 'cool' = 'surge') => getAccentClasses(themeId, type),
    getScoreColor: (score: number) => getScoreColor(score, themeId),
    getScoreBackground: (score: number) => getScoreBackground(score, themeId),
    getEventIconStyles: (isUrgent: boolean) => getEventIconStyles(themeId, isUrgent),
    getThemeClasses: () => getThemeClasses(themeId),
  };
}
