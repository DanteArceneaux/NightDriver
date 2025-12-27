import { useState } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, Calendar, Activity, Trophy } from 'lucide-react';
import type { LayoutProps } from './types';
import { Header } from '../../components/Header/Header';
import { SeattleMap } from '../../components/Map/SeattleMap';
import { TopPickCard } from '../../components/Recommendation/TopPickCard';
import { ForecastTimeline } from '../../components/Timeline/ForecastTimeline';
import { LiveConditions } from '../../components/Conditions/LiveConditions';
import { EventsPanel } from '../../components/Events/EventsPanel';
import { Leaderboard } from '../../components/ZoneList/Leaderboard';
import { ZoneDetailSheet } from '../../components/ZoneDetail/ZoneDetailSheet';

type Tab = 'forecast' | 'conditions' | 'events' | 'zones';

export function NeonCockpitLayout(props: LayoutProps) {
  const [activeTab, setActiveTab] = useState<Tab>('forecast');
  const [selectedZone, setSelectedZone] = useState<typeof props.zones[0] | null>(null);

  const handleZoneClick = (zone: typeof props.zones[0]) => {
    setSelectedZone(zone);
    props.onZoneClick?.(zone);
  };

  const tabs = [
    { id: 'forecast' as Tab, label: 'Forecast', icon: TrendingUp },
    { id: 'conditions' as Tab, label: 'Live', icon: Activity },
    { id: 'events' as Tab, label: 'Events', icon: Calendar },
    { id: 'zones' as Tab, label: 'All Zones', icon: Trophy },
  ];

  return (
    <div className="min-h-screen text-white pb-12">
      {/* Header */}
      <Header
        connected={props.connected}
        countdown={props.countdown}
        hasLocation={!!props.driverLocation}
        onRefresh={props.onRefresh}
        weather={props.weather}
      />

      {/* Main: Map-first Cockpit Layout */}
      <div className="fixed inset-0 top-24 flex flex-col">
        {/* Top: Hero Card (compact overlay) */}
        <div className="px-4 pt-4 z-10">
          <TopPickCard
            topPick={props.topPick}
            zone={props.topZone}
            driverLocation={props.driverLocation}
          />
        </div>

        {/* Middle: Full-height Map */}
        <div className="flex-1 px-4 pt-4">
          <SeattleMap zones={props.zones} onZoneClick={handleZoneClick} />
        </div>

        {/* Bottom: Tab Rail + Content (slide-up panel) */}
        <div className="bg-gradient-to-t from-black/80 to-transparent backdrop-blur-xl border-t border-white/10">
          {/* Tab Rail */}
          <div className="flex items-center justify-around px-4 pt-3">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex flex-col items-center gap-1 px-4 py-2 rounded-xl transition-all ${
                  activeTab === tab.id
                    ? 'bg-theme-primary/20 text-theme-primary border border-theme-primary/50'
                    : 'text-gray-400 hover:text-gray-200'
                }`}
              >
                <tab.icon className="w-5 h-5" />
                <span className="text-xs font-bold">{tab.label}</span>
              </button>
            ))}
          </div>

          {/* Tab Content */}
          <div className="max-h-80 overflow-y-auto px-4 py-4">
            {activeTab === 'forecast' && (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                <ForecastTimeline />
              </motion.div>
            )}
            {activeTab === 'conditions' && (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                <LiveConditions />
              </motion.div>
            )}
            {activeTab === 'events' && (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                <EventsPanel />
              </motion.div>
            )}
            {activeTab === 'zones' && (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                <Leaderboard zones={props.zones} driverLocation={props.driverLocation} />
              </motion.div>
            )}
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

