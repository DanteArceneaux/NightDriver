import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Target, Car } from 'lucide-react';
import type { LayoutProps } from './types';
import { Header } from '../../components/Header/Header';
import { SeattleMap } from '../../components/Map/SeattleMap';
import { TopPickCard } from '../../components/Recommendation/TopPickCard';
import { ForecastTimeline } from '../../components/Timeline/ForecastTimeline';
import { EventsPanel } from '../../components/Events/EventsPanel';
import { Leaderboard } from '../../components/ZoneList/Leaderboard';
import { ZoneDetailSheet } from '../../components/ZoneDetail/ZoneDetailSheet';
import { EarningsCard } from '../../components/Consolidated/EarningsCard';
import { VehicleCard } from '../../components/Consolidated/VehicleCard';

type Widget = 'hero' | 'forecast' | 'conditions' | 'events' | 'zones' | 'earnings' | 'vehicle' | null;

export function GameHudLayout(props: LayoutProps) {
  const [selectedZone, setSelectedZone] = useState<typeof props.zones[0] | null>(null);
  const [activeWidget, setActiveWidget] = useState<Widget>('earnings');

  const handleZoneClick = (zone: typeof props.zones[0]) => {
    setSelectedZone(zone);
    props.onZoneClick?.(zone);
  };

  return (
    <div className="min-h-screen text-white overflow-hidden pb-24">
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
        <div className="absolute top-4 left-4 pointer-events-auto max-w-[calc(100vw-2rem)] overflow-x-auto pb-4 scrollbar-hide">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex gap-2 min-w-max"
          >
            <button
              onClick={() => setActiveWidget(activeWidget === 'earnings' ? null : 'earnings')}
              className={`flex items-center gap-2 px-4 py-2 font-bold text-[10px] uppercase tracking-wider border-2 rounded-lg transition-all ${
                activeWidget === 'earnings'
                  ? 'bg-theme-primary/80 border-theme-primary text-black shadow-[0_0_15px_var(--color-primary)]'
                  : 'bg-gray-900/60 border-theme-primary/40 text-theme-primary hover:border-theme-primary'
              }`}
            >
              <Target className="w-3.5 h-3.5" />
              Earnings
            </button>
            <button
              onClick={() => setActiveWidget(activeWidget === 'vehicle' ? null : 'vehicle')}
              className={`flex items-center gap-2 px-4 py-2 font-bold text-[10px] uppercase tracking-wider border-2 rounded-lg transition-all ${
                activeWidget === 'vehicle'
                  ? 'bg-green-600/80 border-green-400 text-white shadow-[0_0_15px_rgba(34,197,94,0.6)]'
                  : 'bg-gray-900/60 border-green-600/40 text-green-300 hover:border-green-500'
              }`}
            >
              <Car className="w-3.5 h-3.5" />
              Vehicle
            </button>
            <button
              onClick={() => setActiveWidget(activeWidget === 'hero' ? null : 'hero')}
              className={`px-4 py-2 font-bold text-[10px] uppercase tracking-wider border-2 rounded-lg transition-all ${
                activeWidget === 'hero'
                  ? 'bg-purple-600/80 border-purple-400 text-white shadow-[0_0_15px_rgba(168,85,247,0.6)]'
                  : 'bg-gray-900/60 border-purple-600/40 text-purple-300 hover:border-purple-500'
              }`}
            >
              Mission
            </button>
            <button
              onClick={() => setActiveWidget(activeWidget === 'forecast' ? null : 'forecast')}
              className={`px-4 py-2 font-bold text-[10px] uppercase tracking-wider border-2 rounded-lg transition-all ${
                activeWidget === 'forecast'
                  ? 'bg-purple-600/80 border-purple-400 text-white shadow-[0_0_15px_rgba(168,85,247,0.6)]'
                  : 'bg-gray-900/60 border-purple-600/40 text-purple-300 hover:border-purple-500'
              }`}
            >
              Intel
            </button>
            <button
              onClick={() => setActiveWidget(activeWidget === 'events' ? null : 'events')}
              className={`px-4 py-2 font-bold text-[10px] uppercase tracking-wider border-2 rounded-lg transition-all ${
                activeWidget === 'events'
                  ? 'bg-purple-600/80 border-purple-400 text-white shadow-[0_0_15px_rgba(168,85,247,0.6)]'
                  : 'bg-gray-900/60 border-purple-600/40 text-purple-300 hover:border-purple-500'
              }`}
            >
              Events
            </button>
            <button
              onClick={() => setActiveWidget(activeWidget === 'zones' ? null : 'zones')}
              className={`px-4 py-2 font-bold text-[10px] uppercase tracking-wider border-2 rounded-lg transition-all ${
                activeWidget === 'zones'
                  ? 'bg-purple-600/80 border-purple-400 text-white shadow-[0_0_15px_rgba(168,85,247,0.6)]'
                  : 'bg-gray-900/60 border-purple-600/40 text-purple-300 hover:border-purple-500'
              }`}
            >
              Zones
            </button>
          </motion.div>
        </div>

        {/* Center-Left: Main Widget Panel */}
        <AnimatePresence mode="wait">
          {activeWidget && (
            <motion.div
              key={activeWidget}
              initial={{ opacity: 0, scale: 0.9, x: -50 }}
              animate={{ opacity: 1, scale: 1, x: 0 }}
              exit={{ opacity: 0, scale: 0.9, x: -50 }}
              className="absolute right-4 top-4 bottom-32 w-[500px] max-w-[calc(100vw-2rem)] pointer-events-auto overflow-hidden"
            >
              <div className="h-full bg-slate-950/95 backdrop-blur-xl border-2 border-theme-primary/30 rounded-3xl shadow-[0_0_30px_rgba(0,0,0,0.5)] overflow-y-auto">
                {/* Close Button */}
                <button
                  onClick={() => setActiveWidget(null)}
                  className="absolute top-4 right-4 p-2 hover:bg-white/10 rounded-full transition-colors z-10 text-gray-400"
                >
                  <X className="w-5 h-5" />
                </button>

                {/* Widget Content */}
                <div className="pt-2">
                  {activeWidget === 'earnings' && <EarningsCard />}
                  {activeWidget === 'vehicle' && <VehicleCard />}
                  {activeWidget === 'hero' && (
                    <div className="p-6">
                      <TopPickCard
                        topPick={props.topPick}
                        zone={props.topZone}
                        driverLocation={props.driverLocation}
                      />
                    </div>
                  )}
                  {activeWidget === 'forecast' && (
                    <div className="p-6">
                      <ForecastTimeline vertical={true} />
                    </div>
                  )}
                  {activeWidget === 'events' && (
                    <div className="p-6">
                      <EventsPanel />
                    </div>
                  )}
                  {activeWidget === 'zones' && (
                    <div className="p-6">
                      <Leaderboard zones={props.zones} driverLocation={props.driverLocation} />
                    </div>
                  )}
                </div>
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

