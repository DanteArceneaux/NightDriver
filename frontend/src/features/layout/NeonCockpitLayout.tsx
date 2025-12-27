import { useState, useMemo } from 'react';
import { TrendingUp, Calendar, Activity, Trophy, Map, Navigation } from 'lucide-react';
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

export function NeonCockpitLayout(props: LayoutProps) {
  const [selectedZone, setSelectedZone] = useState<typeof props.zones[0] | null>(null);

  const handleZoneClick = (zone: typeof props.zones[0]) => {
    setSelectedZone(zone);
    props.onZoneClick?.(zone);
  };

  // Define cards for the grid - memoized to prevent re-renders
  // Map is FIRST, with larger default sizes for better visibility
  const cards: CardConfig[] = useMemo(() => [
    {
      id: 'map',
      title: 'Seattle Map',
      icon: <Map className="w-4 h-4 text-theme-primary" />,
      content: (
        <div className="w-full h-full">
          <SeattleMap zones={props.zones} onZoneClick={handleZoneClick} />
        </div>
      ),
      defaultHeight: 500,
      minHeight: 300,
      maxHeight: 900,
      collapsible: true,
      resizable: true,
      allowScroll: false, // Map should not scroll
    },
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
      allowScroll: true, // Allow scroll if content is long
    },
    {
      id: 'conditions',
      title: 'Live Conditions',
      icon: <Activity className="w-4 h-4 text-neon-green" />,
      content: (
        <div className="p-4">
          <LiveConditions />
        </div>
      ),
      defaultHeight: 320,
      minHeight: 200,
      maxHeight: 600,
      collapsible: true,
      resizable: true,
      allowScroll: false, // Fixed layout, no scroll needed
    },
    {
      id: 'forecast',
      title: '4-Hour Forecast',
      icon: <TrendingUp className="w-4 h-4 text-theme-primary" />,
      content: (
        <div className="p-4">
          <ForecastTimeline />
        </div>
      ),
      defaultHeight: 280,
      minHeight: 180,
      maxHeight: 500,
      collapsible: true,
      resizable: true,
      allowScroll: true, // Horizontal scroll for forecast cards
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
      allowScroll: true, // List should scroll when many events
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
      allowScroll: true, // Zone list should scroll
    },
  ], [props.topPick, props.topZone, props.driverLocation, props.zones]);

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

      {/* Main: Draggable Card Grid Layout */}
      <main className="pt-24 px-4 pb-20">
        <DraggableCardGrid
          cards={cards}
          storageKey="neon-cockpit-layout"
          className="max-w-4xl mx-auto"
        />
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

