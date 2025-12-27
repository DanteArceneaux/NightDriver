import { useState, useMemo, useEffect } from 'react';
import { TrendingUp, Calendar, Activity, Trophy, Map, Navigation, LayoutGrid, Columns2 } from 'lucide-react';
import type { LayoutProps } from './types';
import { Header } from '../../components/Header/Header';
import { SeattleMap } from '../../components/Map/SeattleMap';
import { TopPickCard } from '../../components/Recommendation/TopPickCard';
import { ForecastTimeline } from '../../components/Timeline/ForecastTimeline';
import { LiveConditions } from '../../components/Conditions/LiveConditions';
import { EventsPanel } from '../../components/Events/EventsPanel';
import { Leaderboard } from '../../components/ZoneList/Leaderboard';
import { ZoneDetailSheet } from '../../components/ZoneDetail/ZoneDetailSheet';
import { DraggableCardGrid, CardConfig } from '../../components/UI/DraggableCardGrid';
import { motion } from 'framer-motion';

type LayoutMode = 'stack' | 'split';

export function NeonCockpitLayout(props: LayoutProps) {
  const [selectedZone, setSelectedZone] = useState<typeof props.zones[0] | null>(null);
  const [layoutMode, setLayoutMode] = useState<LayoutMode>(() => {
    // Load saved layout mode from localStorage
    const saved = localStorage.getItem('cockpit-layout-mode');
    return (saved as LayoutMode) || 'split';
  });
  
  // Detect screen size
  const [isDesktop, setIsDesktop] = useState(false);
  
  useEffect(() => {
    const checkDesktop = () => {
      setIsDesktop(window.innerWidth >= 1024); // lg breakpoint
    };
    
    checkDesktop();
    window.addEventListener('resize', checkDesktop);
    return () => window.removeEventListener('resize', checkDesktop);
  }, []);
  
  // Save layout mode to localStorage
  useEffect(() => {
    localStorage.setItem('cockpit-layout-mode', layoutMode);
  }, [layoutMode]);

  const handleZoneClick = (zone: typeof props.zones[0]) => {
    setSelectedZone(zone);
    props.onZoneClick?.(zone);
  };

  // Define map card separately (for split layout)
  // In split mode, use a larger default height to fill the viewport
  const mapDefaultHeight = isDesktop && layoutMode === 'split' ? 800 : 500;
  
  const mapCard: CardConfig = useMemo(() => ({
    id: 'seattle-map',
    title: 'Seattle Map',
    icon: <Map className="w-4 h-4 text-theme-primary" />,
    content: (
      <div className="w-full h-full">
        <SeattleMap zones={props.zones} onZoneClick={handleZoneClick} />
      </div>
    ),
    defaultHeight: mapDefaultHeight,
    minHeight: 300,
    maxHeight: 1200,
    collapsible: false, // Don't collapse map in split mode
    resizable: true,
    allowScroll: false,
  }), [props.zones, mapDefaultHeight]);

  // Define other cards (for right panel in split mode, or all cards in stack mode)
  const infoCards: CardConfig[] = useMemo(() => [
    {
      id: 'top-pick',
      title: 'Top Pick',
      icon: <Navigation className="w-4 h-4 text-theme-primary" />,
      content: (
        <div className="p-4">
          <TopPickCard
            topPick={props.topPick}
            zone={props.topZone}
            driverLocation={props.driverLocation}
          />
        </div>
      ),
      defaultHeight: 280,
      minHeight: 200,
      maxHeight: 500,
      collapsible: true,
      resizable: true,
      allowScroll: true,
    },
    {
      id: 'conditions',
      title: 'Live Conditions',
      icon: <Activity className="w-4 h-4 text-neon-green" />,
      content: (
        <div className="p-4">
          <LiveConditions hideWrapper />
        </div>
      ),
      defaultHeight: 280,
      minHeight: 150,
      maxHeight: 500,
      collapsible: true,
      resizable: true,
      allowScroll: false,
    },
    {
      id: 'forecast',
      title: '4-Hour Forecast',
      icon: <TrendingUp className="w-4 h-4 text-theme-primary" />,
      content: (
        <div className="p-4">
          <ForecastTimeline hideWrapper />
        </div>
      ),
      defaultHeight: 250,
      minHeight: 150,
      maxHeight: 450,
      collapsible: true,
      resizable: true,
      allowScroll: true,
    },
    {
      id: 'events',
      title: 'Events',
      icon: <Calendar className="w-4 h-4 text-neon-orange" />,
      content: (
        <div className="p-4">
          <EventsPanel />
        </div>
      ),
      defaultHeight: 380,
      minHeight: 200,
      maxHeight: 700,
      collapsible: true,
      resizable: true,
      allowScroll: true,
    },
    {
      id: 'zones',
      title: 'All Zones',
      icon: <Trophy className="w-4 h-4 text-neon-pink" />,
      content: (
        <div className="p-4">
          <Leaderboard zones={props.zones} driverLocation={props.driverLocation} />
        </div>
      ),
      defaultHeight: 450,
      minHeight: 250,
      maxHeight: 800,
      collapsible: true,
      resizable: true,
      allowScroll: true,
    },
  ], [props.topPick, props.topZone, props.driverLocation, props.zones]);
  
  // All cards for stack mode
  const allCards: CardConfig[] = useMemo(() => [
    mapCard,
    ...infoCards,
  ], [mapCard, infoCards]);

  // Determine which layout to show
  const shouldUseSplitLayout = isDesktop && layoutMode === 'split';

  return (
    <div className="min-h-screen text-white pb-12">
      {/* Header */}
      <Header
        connected={props.connected}
        countdown={props.countdown}
        hasLocation={!!props.driverLocation}
        onRefresh={props.onRefresh}
        weather={props.weather}
        lastUpdate={props.lastUpdate}
      />

      {/* Main Content */}
      <main className="pt-24 px-4 pb-20">
        <div className="max-w-[2000px] mx-auto">
          {/* Layout Toggle (desktop only) */}
          {isDesktop && (
            <div className="flex justify-end mb-4">
              <div className="flex gap-2 bg-glass-dark/60 backdrop-blur-xl border border-white/10 rounded-lg p-1">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setLayoutMode('stack')}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                    layoutMode === 'stack'
                      ? 'bg-theme-primary/30 text-theme-primary border border-theme-primary/50'
                      : 'text-gray-400 hover:text-white'
                  }`}
                  aria-label="Switch to stack layout"
                >
                  <LayoutGrid className="w-4 h-4" />
                  Stack
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setLayoutMode('split')}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                    layoutMode === 'split'
                      ? 'bg-theme-primary/30 text-theme-primary border border-theme-primary/50'
                      : 'text-gray-400 hover:text-white'
                  }`}
                  aria-label="Switch to split layout"
                >
                  <Columns2 className="w-4 h-4" />
                  Split
                </motion.button>
              </div>
            </div>
          )}

          {/* Stack Layout (mobile or desktop stack mode) */}
          {!shouldUseSplitLayout && (
            <div className="max-w-4xl mx-auto">
              <DraggableCardGrid
                cards={allCards}
                storageKey="neon-cockpit-stack"
                showLayoutControls
              />
            </div>
          )}

          {/* Split Layout (desktop split mode) */}
          {shouldUseSplitLayout && (
            <div className="grid grid-cols-[1fr_400px] gap-6 lg:grid-cols-[1fr_450px] xl:grid-cols-[1fr_500px]">
              {/* Left: Map (fills viewport) */}
              <div className="sticky top-28" style={{ height: 'calc(100vh - 160px)' }}>
                <div className="h-full rounded-2xl overflow-hidden bg-glass-dark/60 backdrop-blur-xl border border-white/10 shadow-xl">
                  <SeattleMap zones={props.zones} onZoneClick={handleZoneClick} />
                </div>
              </div>

              {/* Right: Info Cards (reorderable, scrollable) */}
              <div className="overflow-y-auto" style={{ maxHeight: 'calc(100vh - 160px)' }}>
                <DraggableCardGrid
                  cards={infoCards}
                  storageKey="neon-cockpit-info"
                  showLayoutControls
                />
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Zone Detail Sheet */}
      <ZoneDetailSheet
        zone={selectedZone}
        onClose={() => setSelectedZone(null)}
        driverLocation={props.driverLocation}
      />
    </div>
  );
}
