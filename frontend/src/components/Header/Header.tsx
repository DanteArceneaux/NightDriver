import { useState } from 'react';
import { motion } from 'framer-motion';
import { Radio, MapPin, CloudRain, RefreshCw, HelpCircle } from 'lucide-react';
import { ScoreLegend } from '../Legend/ScoreLegend';
import type { LiveConditionsData } from '../../types';

interface HeaderProps {
  connected: boolean;
  countdown: number;
  hasLocation: boolean;
  onRefresh: () => void;
  weather?: { temp: number; description: string };
}

export function Header({ connected, countdown, hasLocation, onRefresh, weather }: HeaderProps) {
  const [showLegend, setShowLegend] = useState(false);
  
  // Calculate circular progress (0-100%)
  const progress = ((30 - countdown) / 30) * 100;
  const circumference = 2 * Math.PI * 16; // radius = 16
  const strokeDashoffset = circumference - (progress / 100) * circumference;

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
                🚗 <span className="bg-gradient-to-r from-neon-cyan to-neon-purple bg-clip-text text-transparent">
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
                      : 'bg-yellow-500/20 text-yellow-400'
                  }`}
                >
                  <Radio className="w-3 h-3" />
                  {connected ? 'LIVE' : 'CONNECTING'}
                </motion.div>

                {/* Location Indicator */}
                {hasLocation && (
                  <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-neon-cyan/20 text-neon-cyan">
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
                    className="stroke-neon-cyan transition-all duration-1000"
                    strokeWidth="3"
                    fill="none"
                    strokeDasharray={circumference}
                    strokeDashoffset={strokeDashoffset}
                    strokeLinecap="round"
                  />
                </svg>
                <span className="text-xs font-bold text-neon-cyan z-10">
                  {countdown}
                </span>
              </div>

              {/* Help Button */}
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setShowLegend(true)}
                className="p-2 hover:bg-white/10 rounded-xl transition-colors"
                title="How scores work"
              >
                <HelpCircle className="w-5 h-5 text-neon-cyan" />
              </motion.button>

              {/* Refresh Button */}
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={onRefresh}
                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-neon-cyan/20 to-neon-purple/20 hover:from-neon-cyan/30 hover:to-neon-purple/30 rounded-xl text-sm font-medium text-white border border-neon-cyan/30 transition-all"
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
  </>
  );
}

