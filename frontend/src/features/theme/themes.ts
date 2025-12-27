import type { Theme, ThemeTokens } from './types';

// Neon Cockpit Theme (current style, enhanced)
const neonTokens: ThemeTokens = {
  // Background
  bgPrimary: 'bg-gradient-to-b from-[#0a0e27] via-[#1a1f3a] to-[#0f1419]',
  bgSecondary: 'bg-white/5 backdrop-blur-xl',
  bgTertiary: 'bg-white/10 backdrop-blur-xl',
  bgGradient: 'bg-gradient-to-br from-neon-pink/30 via-neon-purple/20 to-transparent',
  
  // Cards
  cardBg: 'glass-strong',
  cardBorder: 'border border-white/10',
  cardHover: 'hover:border-neon-cyan/50 hover:shadow-neon-cyan',
  
  // Text
  textPrimary: 'text-white',
  textSecondary: 'text-gray-300',
  textMuted: 'text-gray-500',
  
  // Accent colors
  accentSurge: 'text-neon-pink',
  accentHot: 'text-neon-orange',
  accentWarm: 'text-neon-cyan',
  accentCool: 'text-blue-400',
  
  // Effects
  glow: 'shadow-neon-cyan',
  shadow: 'shadow-2xl shadow-black/50',
  backdrop: 'backdrop-blur-xl',
  
  // Buttons
  btnPrimary: 'bg-gradient-to-r from-neon-cyan/30 to-neon-purple/30 border border-neon-cyan/50 hover:from-neon-cyan/40 hover:to-neon-purple/40',
  btnPrimaryHover: 'hover:scale-105',
  btnSecondary: 'bg-white/5 border border-white/20 hover:bg-white/10',
  btnSecondaryHover: 'hover:border-white/40',
  
  // Typography
  fontDisplay: 'font-black tracking-tight',
  fontBody: 'font-medium',
  
  // Spacing
  spacing: 'space-y-6',
  borderRadius: 'rounded-2xl',
};

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
  
  // Text
  textPrimary: 'text-slate-50',
  textSecondary: 'text-slate-300',
  textMuted: 'text-slate-500',
  
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

// Game HUD Theme (playful, gamified, stronger borders)
const hudTokens: ThemeTokens = {
  // Background
  bgPrimary: 'bg-gradient-to-br from-gray-950 via-indigo-950/40 to-gray-950',
  bgSecondary: 'bg-indigo-900/20 backdrop-blur-lg',
  bgTertiary: 'bg-indigo-800/30 backdrop-blur-lg',
  bgGradient: 'bg-gradient-to-br from-purple-500/20 via-pink-500/10 to-transparent',
  
  // Cards
  cardBg: 'bg-gradient-to-br from-indigo-950/80 to-gray-900/80 backdrop-blur-lg',
  cardBorder: 'border-2 border-purple-500/60 shadow-[0_0_15px_rgba(168,85,247,0.4)]',
  cardHover: 'hover:border-pink-500/80 hover:shadow-[0_0_20px_rgba(236,72,153,0.5)]',
  
  // Text
  textPrimary: 'text-white',
  textSecondary: 'text-purple-200',
  textMuted: 'text-purple-400/60',
  
  // Accent colors
  accentSurge: 'text-pink-400',
  accentHot: 'text-orange-400',
  accentWarm: 'text-purple-400',
  accentCool: 'text-indigo-400',
  
  // Effects
  glow: 'shadow-[0_0_20px_rgba(168,85,247,0.6)]',
  shadow: 'shadow-2xl shadow-purple-900/50',
  backdrop: 'backdrop-blur-lg',
  
  // Buttons
  btnPrimary: 'bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 border-2 border-purple-400/60',
  btnPrimaryHover: 'hover:shadow-[0_0_20px_rgba(168,85,247,0.6)]',
  btnSecondary: 'bg-purple-900/50 border-2 border-purple-600/50 hover:bg-purple-800/60',
  btnSecondaryHover: 'hover:border-purple-500',
  
  // Typography
  fontDisplay: 'font-extrabold tracking-wider uppercase',
  fontBody: 'font-semibold',
  
  // Spacing
  spacing: 'space-y-5',
  borderRadius: 'rounded-lg',
};

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
  
  // Text - maximum contrast
  textPrimary: 'text-white',
  textSecondary: 'text-gray-300',
  textMuted: 'text-gray-500',
  
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

export const themes: Record<string, Theme> = {
  neon: {
    id: 'neon',
    name: 'Neon Cockpit',
    layoutId: 'cockpit',
    tokens: neonTokens,
  },
  pro: {
    id: 'pro',
    name: 'Pro Dashboard',
    layoutId: 'dashboard',
    tokens: proTokens,
  },
  hud: {
    id: 'hud',
    name: 'Game HUD',
    layoutId: 'hud',
    tokens: hudTokens,
  },
  car: {
    id: 'car',
    name: 'Car Mode',
    layoutId: 'car',
    tokens: carTokens,
  },
};

export function getTheme(id: string): Theme {
  return themes[id] || themes.neon;
}

