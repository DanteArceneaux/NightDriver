import type { Theme, ThemeTokens } from './types';

// Neon Cockpit Theme removed in v8.0

// Pro Dashboard Theme (clean, minimal, premium)
const proTokens: ThemeTokens = {
  // Background
  bgPrimary: 'bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950',
  bgSecondary: 'bg-slate-900/90 backdrop-blur-sm',
  bgTertiary: 'bg-slate-800/60 backdrop-blur-sm',
  bgGradient: 'bg-gradient-to-br from-blue-500/10 via-indigo-500/5 to-transparent',
  
  // Cards
  cardBg: 'bg-slate-900/80 backdrop-blur-md',
  cardBorder: 'border border-slate-700/50',
  cardHover: 'hover:border-blue-500/40 hover:bg-slate-800/80',
  
  // Glass effects
  glassBg: 'bg-slate-800/60 backdrop-blur-md',
  glassBorder: 'border border-slate-700/50',
  
  // Text
  textPrimary: 'text-slate-50',
  textSecondary: 'text-slate-300',
  textMuted: 'text-slate-500',
  primaryText: 'text-slate-50',
  
  // Accent colors
  accentSurge: 'text-rose-400',
  accentHot: 'text-amber-400',
  accentWarm: 'text-blue-400',
  accentCool: 'text-slate-400',
  
  // Effects
  glow: 'shadow-lg shadow-blue-500/10',
  shadow: 'shadow-xl shadow-black/30',
  backdrop: 'backdrop-blur-md',
  
  // Buttons
  btnPrimary: 'bg-blue-600 hover:bg-blue-500 border border-blue-500/50',
  btnPrimaryHover: 'hover:shadow-lg hover:shadow-blue-500/20',
  btnSecondary: 'bg-slate-800 border border-slate-700 hover:bg-slate-700',
  btnSecondaryHover: 'hover:border-slate-600',
  
  // Typography
  fontDisplay: 'font-bold tracking-tight',
  fontBody: 'font-normal',
  
  // Spacing
  spacing: 'space-y-4',
  borderRadius: 'rounded-xl',
};

// Game HUD Theme removed per user request

// Car Mode Theme (ultra-minimal, high-contrast for driving)
const carTokens: ThemeTokens = {
  // Background - pure black for OLED
  bgPrimary: 'bg-black',
  bgSecondary: 'bg-gray-900',
  bgTertiary: 'bg-gray-800',
  bgGradient: 'bg-gradient-to-br from-green-600/20 to-transparent',
  
  // Cards - thick borders for visibility
  cardBg: 'bg-gray-900',
  cardBorder: 'border-4 border-white/30',
  cardHover: 'hover:bg-gray-800',
  
  // Glass effects
  glassBg: 'bg-gray-900/90',
  glassBorder: 'border-4 border-white/30',
  
  // Text - maximum contrast
  textPrimary: 'text-white',
  textSecondary: 'text-gray-300',
  textMuted: 'text-gray-500',
  primaryText: 'text-white',
  
  // Accent colors - high visibility
  accentSurge: 'text-red-500',
  accentHot: 'text-orange-500',
  accentWarm: 'text-yellow-400',
  accentCool: 'text-green-400',
  
  // Effects - bold shadows
  glow: 'shadow-2xl shadow-green-500/30',
  shadow: 'shadow-2xl shadow-black/80',
  backdrop: '',
  
  // Buttons - large touch targets
  btnPrimary: 'bg-green-600 hover:bg-green-500 border-4 border-green-400',
  btnPrimaryHover: 'hover:shadow-xl',
  btnSecondary: 'bg-gray-800 hover:bg-gray-700 border-4 border-white/20',
  btnSecondaryHover: '',
  
  // Typography - extra bold for glanceability
  fontDisplay: 'font-black tracking-widest uppercase',
  fontBody: 'font-bold',
  
  // Spacing - generous for touch
  spacing: 'space-y-6',
  borderRadius: 'rounded-3xl',
};

// Dream Theme (minimal, glassmorphism, map-first)
const dreamTokens: ThemeTokens = {
  // Background
  bgPrimary: 'bg-gradient-to-b from-[#0a0e1a] via-[#0f1419] to-[#050810]',
  bgSecondary: 'bg-black/40 backdrop-blur-md',
  bgTertiary: 'bg-black/60 backdrop-blur-lg',
  bgGradient: 'bg-gradient-to-br from-cyan-500/10 via-purple-500/5 to-transparent',
  
  // Cards - ultra minimal
  cardBg: 'bg-black/40 backdrop-blur-md',
  cardBorder: 'border border-white/5',
  cardHover: 'hover:border-white/10 hover:bg-black/50',
  
  // Glass effects - maximum transparency
  glassBg: 'bg-black/30 backdrop-blur-lg',
  glassBorder: 'border border-white/5',
  
  // Text
  textPrimary: 'text-white',
  textSecondary: 'text-gray-300',
  textMuted: 'text-gray-500',
  primaryText: 'text-white',
  
  // Accent colors
  accentSurge: 'text-cyan-400',
  accentHot: 'text-orange-400',
  accentWarm: 'text-purple-400',
  accentCool: 'text-blue-400',
  
  // Effects - subtle
  glow: 'shadow-lg shadow-cyan-500/10',
  shadow: 'shadow-2xl shadow-black/60',
  backdrop: 'backdrop-blur-xl',
  
  // Buttons - minimal
  btnPrimary: 'bg-cyan-500/20 border border-cyan-500/50 hover:bg-cyan-500/30',
  btnPrimaryHover: 'hover:shadow-lg hover:shadow-cyan-500/20',
  btnSecondary: 'bg-white/5 border border-white/10 hover:bg-white/10',
  btnSecondaryHover: 'hover:border-white/20',
  
  // Typography - clean
  fontDisplay: 'font-black tracking-tight',
  fontBody: 'font-medium',
  
  // Spacing
  spacing: 'space-y-4',
  borderRadius: 'rounded-2xl',
};

export const themes: Record<string, Theme> = {
  dream: {
    id: 'dream',
    name: 'Dream',
    layoutId: 'dream',
    tokens: dreamTokens,
  },
  // Neon Cockpit removed in v8.0
  pro: {
    id: 'pro',
    name: 'Pro Dashboard',
    layoutId: 'dashboard',
    tokens: proTokens,
  },
  car: {
    id: 'car',
    name: 'Car Mode',
    layoutId: 'car',
    tokens: carTokens,
  },
};

export function getTheme(id: string): Theme {
  return themes[id] || themes.dream; // Default to Dream theme
}

