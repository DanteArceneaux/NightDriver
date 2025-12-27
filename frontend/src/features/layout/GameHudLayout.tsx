import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import type { LayoutProps } from './types';
import { Header } from '../../components/Header/Header';
import { SeattleMap } from '../../components/Map/SeattleMap';
import { TopPickCard } from '../../components/Recommendation/TopPickCard';
import { ForecastTimeline } from '../../components/Timeline/ForecastTimeline';
import { LiveConditions } from '../../components/Conditions/LiveConditions';
import { EventsPanel } from '../../components/Events/EventsPanel';
import { Leaderboard } from '../../components/ZoneList/Leaderboard';
import { ZoneDetailSheet } from '../../components/ZoneDetail/ZoneDetailSheet';

type Widget = 'hero' | 'forecast' | 'conditions' | 'events' | 'zones' | null;

export function GameHudLayout(props: LayoutProps) {
  const [selectedZone, setSelectedZone] = useState<typeof props.zones[0] | null>(null);
  const [activeWidget, setActiveWidget] = useState<Widget>('hero');

  const handleZoneClick = (zone: typeof props.zones[0]) => {
    setSelectedZone(zone);
    props.onZoneClick?.(zone);
  };

  return (
    <div className="min-h-screen text-white overflow-hidden">
      {/* Header */}
      <Header
        connected={props.connected}
        countdown={props.countdown}
        hasLocation={!!props.driverLocation}
        onRefresh={props.onRefresh}
        weather={props.weather}
        lastUpdate={props.lastUpdate}
      />

      {/* Full-screen Map Canvas */}
      <div className="fixed inset-0 top-24">
        <SeattleMap zones={props.zones} onZoneClick={handleZoneClick} />
      </div>

      {/* Floating HUD Widgets */}
      <div className="fixed inset-0 top-24 pointer-events-none">
        {/* Top-Left: Quick Stats */}
        <div className="absolute top-4 left-4 pointer-events-auto">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex gap-2"
          >
            <button
              onClick={() => setActiveWidget(activeWidget === 'hero' ? null : 'hero')}
              className={`px-4 py-2 font-bold text-xs uppercase tracking-wider border-2 rounded-lg transition-all ${
                activeWidget === 'hero'
                  ? 'bg-purple-600/80 border-purple-400 text-white shadow-[0_0_15px_rgba(168,85,247,0.6)]'
                  : 'bg-gray-900/60 border-purple-600/40 text-purple-300 hover:border-purple-500'
              }`}
            >
              Mission
            </button>
            <button
              onClick={() => setActiveWidget(activeWidget === 'forecast' ? null : 'forecast')}
              className={`px-4 py-2 font-bold text-xs uppercase tracking-wider border-2 rounded-lg transition-all ${
                activeWidget === 'forecast'
                  ? 'bg-purple-600/80 border-purple-400 text-white shadow-[0_0_15px_rgba(168,85,247,0.6)]'
                  : 'bg-gray-900/60 border-purple-600/40 text-purple-300 hover:border-purple-500'
              }`}
            >
              Intel
            </button>
            <button
              onClick={() => setActiveWidget(activeWidget === 'events' ? null : 'events')}
              className={`px-4 py-2 font-bold text-xs uppercase tracking-wider border-2 rounded-lg transition-all ${
                activeWidget === 'events'
                  ? 'bg-purple-600/80 border-purple-400 text-white shadow-[0_0_15px_rgba(168,85,247,0.6)]'
                  : 'bg-gray-900/60 border-purple-600/40 text-purple-300 hover:border-purple-500'
              }`}
            >
              Events
            </button>
            <button
              onClick={() => setActiveWidget(activeWidget === 'zones' ? null : 'zones')}
              className={`px-4 py-2 font-bold text-xs uppercase tracking-wider border-2 rounded-lg transition-all ${
                activeWidget === 'zones'
                  ? 'bg-purple-600/80 border-purple-400 text-white shadow-[0_0_15px_rgba(168,85,247,0.6)]'
                  : 'bg-gray-900/60 border-purple-600/40 text-purple-300 hover:border-purple-500'
              }`}
            >
              Zones
            </button>
          </motion.div>
        </div>

        {/* Bottom-Right: Conditions Widget (always visible, expanded) */}
        <div className="absolute bottom-4 left-4 pointer-events-auto w-[420px] max-w-[calc(100vw-2rem)]">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <LiveConditions />
          </motion.div>
        </div>

        {/* Center-Left: Main Widget Panel */}
        <AnimatePresence>
          {activeWidget && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9, x: -50 }}
              animate={{ opacity: 1, scale: 1, x: 0 }}
              exit={{ opacity: 0, scale: 0.9, x: -50 }}
              className="absolute right-4 top-4 bottom-32 w-[500px] max-w-[calc(100vw-2rem)] pointer-events-auto overflow-hidden"
            >
              <div className="h-full bg-gradient-to-br from-indigo-950/95 to-gray-900/95 backdrop-blur-xl border-2 border-purple-500/60 rounded-lg shadow-[0_0_30px_rgba(168,85,247,0.4)] p-6 overflow-y-auto">
                {/* Close Button */}
                <button
                  onClick={() => setActiveWidget(null)}
                  className="absolute top-4 right-4 p-2 hover:bg-purple-600/50 rounded-lg transition-colors z-10"
                >
                  <X className="w-5 h-5" />
                </button>

                {/* Widget Content */}
                {activeWidget === 'hero' && (
                  <TopPickCard
                    topPick={props.topPick}
                    zone={props.topZone}
                    driverLocation={props.driverLocation}
                  />
                )}
                {activeWidget === 'forecast' && <ForecastTimeline vertical={true} />}
                {activeWidget === 'events' && <EventsPanel />}
                {activeWidget === 'zones' && (
                  <Leaderboard zones={props.zones} driverLocation={props.driverLocation} />
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Zone Detail Sheet */}
      <ZoneDetailSheet
        zone={selectedZone}
        onClose={() => setSelectedZone(null)}
        driverLocation={props.driverLocation}
      />
    </div>
  );
}

