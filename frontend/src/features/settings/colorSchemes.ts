import type { ColorScheme } from './types';

// neonColorSchemes removed in v8.0

export const proColorSchemes: Record<ColorScheme, { primary: string; secondary: string; accent: string }> = {
  default: { primary: '#3b82f6', secondary: '#60a5fa', accent: '#1d4ed8' },
  blue: { primary: '#0ea5e9', secondary: '#38bdf8', accent: '#0284c7' },
  purple: { primary: '#8b5cf6', secondary: '#a78bfa', accent: '#6d28d9' },
  green: { primary: '#22c55e', secondary: '#4ade80', accent: '#16a34a' },
  orange: { primary: '#f59e0b', secondary: '#fbbf24', accent: '#d97706' },
  red: { primary: '#f43f5e', secondary: '#fb7185', accent: '#e11d48' },
};

// hudColorSchemes removed - Game HUD eliminated per user request

export const carColorSchemes: Record<ColorScheme, { primary: string; secondary: string; accent: string }> = {
  default: { primary: '#22c55e', secondary: '#16a34a', accent: '#15803d' },
  blue: { primary: '#3b82f6', secondary: '#2563eb', accent: '#1d4ed8' },
  purple: { primary: '#a855f7', secondary: '#9333ea', accent: '#7e22ce' },
  green: { primary: '#10b981', secondary: '#059669', accent: '#047857' },
  orange: { primary: '#f97316', secondary: '#ea580c', accent: '#c2410c' },
  red: { primary: '#ef4444', secondary: '#dc2626', accent: '#b91c1c' },
};

// Dream color schemes use pro colors in v8.0
export const dreamColorSchemes = proColorSchemes;

// Helper to get CSS variables for a color scheme
export function getColorVars(
  theme: 'dream' | 'pro' | 'car', // 'neon' removed in v8.0
  scheme: ColorScheme
): Record<string, string> {
  let colors;
  switch (theme) {
    case 'dream':
      colors = dreamColorSchemes[scheme];
      break;
    // 'neon' case removed in v8.0
    case 'pro':
      colors = proColorSchemes[scheme];
      break;
    case 'car':
      colors = carColorSchemes[scheme];
      break;
  }

  return {
    '--color-primary': colors.primary,
    '--color-secondary': colors.secondary,
    '--color-accent': colors.accent,
  };
}

