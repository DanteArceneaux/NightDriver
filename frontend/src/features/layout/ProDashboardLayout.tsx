import { useState } from 'react';
import { motion } from 'framer-motion';
import type { LayoutProps } from './types';
import { Header } from '../../components/Header/Header';
import { SeattleMap } from '../../components/Map/SeattleMap';
import { TopPickCard } from '../../components/Recommendation/TopPickCard';
import { ForecastTimeline } from '../../components/Timeline/ForecastTimeline';
import { LiveConditions } from '../../components/Conditions/LiveConditions';
import { EventsPanel } from '../../components/Events/EventsPanel';
import { Leaderboard } from '../../components/ZoneList/Leaderboard';
import { ZoneDetailSheet } from '../../components/ZoneDetail/ZoneDetailSheet';

export function ProDashboardLayout(props: LayoutProps) {
  const [selectedZone, setSelectedZone] = useState<typeof props.zones[0] | null>(null);

  const handleZoneClick = (zone: typeof props.zones[0]) => {
    setSelectedZone(zone);
    props.onZoneClick?.(zone);
  };

  return (
    <div className="min-h-screen text-white">
      {/* Header */}
      <Header
        connected={props.connected}
        countdown={props.countdown}
        hasLocation={!!props.driverLocation}
        onRefresh={props.onRefresh}
        weather={props.weather}
        lastUpdate={props.lastUpdate}
      />

      {/* Main: Two-Column Layout (Desktop) / Stacked (Mobile) */}
      <div className="max-w-[2000px] mx-auto px-4 pt-28">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Column: Map */}
          <div className="space-y-6">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="h-[500px] lg:h-[calc(100vh-8rem)] lg:sticky lg:top-28"
            >
              <SeattleMap zones={props.zones} onZoneClick={handleZoneClick} />
            </motion.div>
          </div>

          {/* Right Column: Info Panels */}
          <div className="space-y-4">
            {/* Hero */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <TopPickCard
                topPick={props.topPick}
                zone={props.topZone}
                driverLocation={props.driverLocation}
              />
            </motion.div>

            {/* Forecast */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <ForecastTimeline />
            </motion.div>

            {/* Live Conditions */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <LiveConditions />
            </motion.div>

            {/* Events */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              <EventsPanel />
            </motion.div>

            {/* Leaderboard */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
            >
              <Leaderboard zones={props.zones} driverLocation={props.driverLocation} />
            </motion.div>
          </div>
        </div>
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

