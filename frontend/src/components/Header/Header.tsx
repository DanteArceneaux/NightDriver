import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Radio, MapPin, CloudRain, RefreshCw, HelpCircle, Palette, ChevronDown, Settings, BarChart3 } from 'lucide-react';
import { ScoreLegend } from '../Legend/ScoreLegend';
import { SettingsModal } from '../Settings/SettingsModal';
import { AnalyticsView } from '../Analytics/AnalyticsView';
import { useTheme } from '../../features/theme';
import { themes } from '../../features/theme/themes';

interface HeaderProps {
  connected: boolean;
  countdown: number;
  hasLocation: boolean;
  onRefresh: () => void;
  weather?: { temp: number; description: string };
  lastUpdate?: Date | null;
}

export function Header({ connected, countdown, hasLocation, onRefresh, weather, lastUpdate }: HeaderProps) {
  const [showLegend, setShowLegend] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [showThemeMenu, setShowThemeMenu] = useState(false);
  const { id: currentThemeId, name: currentThemeName, setThemeId } = useTheme();
  
  // Calculate circular progress (0-100%)
  const progress = ((30 - countdown) / 30) * 100;
  const circumference = 2 * Math.PI * 16; // radius = 16
  const strokeDashoffset = circumference - (progress / 100) * circumference;
  
  // Format last update time
  const getLastUpdateText = () => {
    if (!lastUpdate) return 'Never';
    const secondsAgo = Math.floor((Date.now() - lastUpdate.getTime()) / 1000);
    if (secondsAgo < 60) return `${secondsAgo}s ago`;
    const minutesAgo = Math.floor(secondsAgo / 60);
    if (minutesAgo < 60) return `${minutesAgo}m ago`;
    const hoursAgo = Math.floor(minutesAgo / 60);
    return `${hoursAgo}h ago`;
  };

  return (
    <>
      <motion.header 
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="fixed top-0 left-0 right-0 z-50 px-4 pt-4"
      >
      <div className="max-w-7xl mx-auto">
        <div className="glass-strong rounded-2xl px-6 py-4 shadow-2xl">
          <div className="flex items-center justify-between flex-wrap gap-4">
            {/* Left: Title + Status Pills */}
            <div className="flex items-center gap-4 flex-wrap">
              <h1 className="text-xl md:text-2xl font-bold tracking-tight">
                🚗 <span className="bg-gradient-to-r from-theme-primary to-theme-secondary bg-clip-text text-transparent">
                  Night Driver
                </span>
              </h1>
              
              <div className="flex items-center gap-2">
                {/* Live Indicator */}
                <motion.div
                  animate={connected ? { scale: [1, 1.1, 1] } : {}}
                  transition={{ repeat: Infinity, duration: 2 }}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium ${
                    connected 
                      ? 'bg-neon-green/20 text-neon-green glow-green' 
                      : 'bg-red-500/20 text-red-400'
                  }`}
                  title={lastUpdate ? `Last update: ${getLastUpdateText()}` : 'Not connected'}
                >
                  <Radio className="w-3 h-3" />
                  {connected ? 'LIVE' : 'OFFLINE'}
                </motion.div>

                {/* Location Indicator */}
                {hasLocation && (
                  <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-theme-primary/20 text-theme-primary">
                    <MapPin className="w-3 h-3" />
                    <span className="hidden sm:inline">GPS</span>
                  </div>
                )}

                {/* Weather */}
                {weather && (
                  <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-blue-500/20 text-blue-300">
                    <CloudRain className="w-3 h-3" />
                    <span>{Math.round(weather.temp)}°</span>
                  </div>
                )}
              </div>
            </div>

            {/* Right: Countdown Ring + Refresh */}
            <div className="flex items-center gap-4">
              {/* Circular Countdown */}
              <div className="relative w-12 h-12 flex items-center justify-center">
                <svg className="absolute w-full h-full transform -rotate-90">
                  {/* Background circle */}
                  <circle
                    cx="24"
                    cy="24"
                    r="16"
                    className="stroke-gray-700"
                    strokeWidth="3"
                    fill="none"
                  />
                  {/* Progress circle */}
                  <circle
                    cx="24"
                    cy="24"
                    r="16"
                    className="stroke-theme-primary transition-all duration-1000"
                    strokeWidth="3"
                    fill="none"
                    strokeDasharray={circumference}
                    strokeDashoffset={strokeDashoffset}
                    strokeLinecap="round"
                  />
                </svg>
                <span className="text-xs font-bold text-theme-primary z-10">
                  {countdown}
                </span>
              </div>

              {/* Theme Switcher */}
              <div className="relative">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setShowThemeMenu(!showThemeMenu)}
                  className="flex items-center gap-2 px-3 py-2 hover:bg-white/10 rounded-xl transition-colors border border-white/10"
                  title="Change theme"
                >
                  <Palette className="w-4 h-4 text-theme-primary" />
                  <span className="text-xs font-medium hidden md:inline">{currentThemeName}</span>
                  <ChevronDown className="w-3 h-3" />
                </motion.button>

                <AnimatePresence>
                  {showThemeMenu && (
                    <>
                      {/* Backdrop */}
                      <div
                        className="fixed inset-0 z-40"
                        onClick={() => setShowThemeMenu(false)}
                      />
                      
                      {/* Dropdown */}
                      <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="absolute right-0 top-full mt-2 w-48 glass-strong rounded-xl border border-white/20 shadow-2xl overflow-hidden z-50"
                      >
                        {Object.values(themes).map((theme) => (
                          <button
                            key={theme.id}
                            onClick={() => {
                              setThemeId(theme.id);
                              setShowThemeMenu(false);
                            }}
                            className={`w-full px-4 py-3 text-left text-sm font-medium transition-colors ${
                              currentThemeId === theme.id
                                ? 'bg-theme-primary/20 text-theme-primary'
                                : 'text-gray-300 hover:bg-white/10'
                            }`}
                          >
                            {theme.name}
                          </button>
                        ))}
                      </motion.div>
                    </>
                  )}
                </AnimatePresence>
              </div>

              {/* Analytics Button */}
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setShowAnalytics(true)}
                className="p-2 hover:bg-white/10 rounded-xl transition-colors"
                title="Analytics"
              >
                <BarChart3 className="w-5 h-5 text-theme-primary" />
              </motion.button>

              {/* Settings Button */}
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setShowSettings(true)}
                className="p-2 hover:bg-white/10 rounded-xl transition-colors"
                title="Settings"
              >
                <Settings className="w-5 h-5 text-theme-primary" />
              </motion.button>

              {/* Help Button */}
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setShowLegend(true)}
                className="p-2 hover:bg-white/10 rounded-xl transition-colors"
                title="How scores work"
              >
                <HelpCircle className="w-5 h-5 text-theme-primary" />
              </motion.button>

              {/* Refresh Button */}
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={onRefresh}
                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-theme-primary/20 to-theme-secondary/20 hover:from-theme-primary/30 hover:to-theme-secondary/30 rounded-xl text-sm font-medium text-white border border-theme-primary/30 transition-all"
              >
                <RefreshCw className="w-4 h-4" />
                <span className="hidden sm:inline">Refresh</span>
              </motion.button>
            </div>
          </div>
        </div>
      </div>
    </motion.header>

    {/* Score Legend Modal */}
    <ScoreLegend isOpen={showLegend} onClose={() => setShowLegend(false)} />
    
    {/* Analytics View */}
    <AnalyticsView isOpen={showAnalytics} onClose={() => setShowAnalytics(false)} />
    
    {/* Settings Modal */}
    <SettingsModal isOpen={showSettings} onClose={() => setShowSettings(false)} />
  </>
  );
}

