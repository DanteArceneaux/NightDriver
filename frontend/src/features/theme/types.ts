export type ThemeId = 'neon' | 'pro' | 'hud';
export type LayoutId = 'cockpit' | 'dashboard' | 'hud';

export interface ThemeTokens {
  // Background
  bgPrimary: string;
  bgSecondary: string;
  bgTertiary: string;
  bgGradient: string;
  
  // Cards
  cardBg: string;
  cardBorder: string;
  cardHover: string;
  
  // Text
  textPrimary: string;
  textSecondary: string;
  textMuted: string;
  
  // Accent colors (scores)
  accentSurge: string;
  accentHot: string;
  accentWarm: string;
  accentCool: string;
  
  // Effects
  glow: string;
  shadow: string;
  backdrop: string;
  
  // Buttons
  btnPrimary: string;
  btnPrimaryHover: string;
  btnSecondary: string;
  btnSecondaryHover: string;
  
  // Typography
  fontDisplay: string;
  fontBody: string;
  
  // Spacing/Layout
  spacing: string;
  borderRadius: string;
}

export interface Theme {
  id: ThemeId;
  name: string;
  layoutId: LayoutId;
  tokens: ThemeTokens;
}

