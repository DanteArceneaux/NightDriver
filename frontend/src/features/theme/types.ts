export type ThemeId = 'dream' | 'pro' | 'car'; // 'neon' removed in v8.0
export type LayoutId = 'dream' | 'dashboard' | 'car'; // 'cockpit' removed in v8.0

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
  
  // Glass effects
  glassBg: string;
  glassBorder: string;
  
  // Text
  textPrimary: string;
  textSecondary: string;
  textMuted: string;
  primaryText: string;
  
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

