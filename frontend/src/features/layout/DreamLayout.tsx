import { useState, useMemo } from 'react';
import { motion, AnimatePresence, PanInfo } from 'framer-motion';
import { 
  Radio, MapPin, TrendingUp, Calendar, Activity, Trophy, 
  DollarSign, Car, Eye, EyeOff,
  ChevronUp, ChevronDown
} from 'lucide-react';
import type { LayoutProps } from './types';
import { SeattleMap } from '../../components/Map/SeattleMap';
import { TopPickCard } from '../../components/Recommendation/TopPickCard';
import { ForecastTimeline } from '../../components/Timeline/ForecastTimeline';
import { LiveConditions } from '../../components/Conditions/LiveConditions';
import { EventsPanel } from '../../components/Events/EventsPanel';
import { Leaderboard } from '../../components/ZoneList/Leaderboard';
import { ZoneDetailSheet } from '../../components/ZoneDetail/ZoneDetailSheet';
import { DraggableCardGrid, CardConfig } from '../../components/UI/DraggableCardGrid';
import { EarningsCard } from '../../components/Consolidated/EarningsCard';
import { VehicleCard } from '../../components/Consolidated/VehicleCard';
import { useEarningsStore } from '../earnings';

export function DreamLayout(props: LayoutProps) {
  const [selectedZone, setSelectedZone] = useState<typeof props.zones[0] | null>(null);
  const [focusMode, setFocusMode] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const { getProgress } = useEarningsStore();
  const progress = getProgress();

  const handleZoneClick = (zone: typeof props.zones[0]) => {
    setSelectedZone(zone);
    props.onZoneClick?.(zone);
  };

  // Define cards for the drawer
  const drawerCards: CardConfig[] = useMemo(() => [
    {
      id: 'earnings',
      title: 'Earnings & Goals',
      icon: <DollarSign className="w-4 h-4 text-theme-primary" />,
      content: <EarningsCard />,
      defaultHeight: 450,
      minHeight: 350,
      maxHeight: 600,
      collapsible: true,
      resizable: true,
      allowScroll: true,
    },
    {
      id: 'vehicle',
      title: 'Vehicle Status',
      icon: <Car className="w-4 h-4 text-neon-green" />,
      content: <VehicleCard />,
      defaultHeight: 350,
      minHeight: 250,
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
  ], [props.zones, props.driverLocation]);

  // Handle drawer drag
  const handleDragEnd = (_event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    const threshold = -100;
    if (info.offset.y < threshold) {
      setIsDrawerOpen(true);
    } else if (info.offset.y > -threshold) {
      setIsDrawerOpen(false);
    }
  };

  return (
    <div className="min-h-screen text-white overflow-hidden relative">
      {/* Background Map (Always Visible) */}
      <div className="fixed inset-0 z-0">
        <SeattleMap zones={props.zones} onZoneClick={handleZoneClick} />
      </div>

      {/* Micro HUD Header */}
      <AnimatePresence>
        {!focusMode && (
          <motion.header
            initial={{ y: -100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -100, opacity: 0 }}
            className="fixed top-4 left-1/2 -translate-x-1/2 z-50 pointer-events-none"
          >
            <div className="flex items-center gap-3 pointer-events-auto">
              {/* Connectivity Status */}
              <motion.div
                animate={props.connected ? { scale: [1, 1.1, 1] } : {}}
                transition={{ repeat: Infinity, duration: 2 }}
                className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-medium backdrop-blur-xl ${
                  props.connected
                    ? 'bg-neon-green/20 text-neon-green border border-neon-green/50'
                    : 'bg-red-500/20 text-red-400 border border-red-500/50'
                }`}
              >
                <Radio className="w-3 h-3" />
                {props.connected ? 'LIVE' : 'OFFLINE'}
              </motion.div>

              {/* Current Earnings Pill */}
              {progress && (
                <div className="flex items-center gap-3 px-4 py-2 rounded-full bg-black/60 backdrop-blur-xl border border-white/10">
                  <div className="flex flex-col">
                    <span className="text-xl font-black text-theme-primary leading-none">
                      ${progress.currentEarnings.toFixed(0)}
                    </span>
                    <span className="text-[9px] text-gray-500 uppercase font-bold tracking-wider">
                      of ${progress.dailyGoal}
                    </span>
                  </div>
                </div>
              )}

              {/* GPS Indicator */}
              {props.driverLocation && (
                <div className="flex items-center gap-2 px-3 py-2 rounded-full bg-theme-primary/20 backdrop-blur-xl border border-theme-primary/50 text-theme-primary text-xs font-medium">
                  <MapPin className="w-3 h-3" />
                  GPS
                </div>
              )}
            </div>
          </motion.header>
        )}
      </AnimatePresence>

      {/* Focus Mode Toggle (Always Visible) */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => {
          setFocusMode(!focusMode);
          if (!focusMode) setIsDrawerOpen(false); // Close drawer when entering focus mode
        }}
        className={`fixed top-4 right-4 z-50 p-3 rounded-full backdrop-blur-xl transition-all ${
          focusMode
            ? 'bg-theme-primary text-black border-2 border-theme-primary'
            : 'bg-black/60 text-white border border-white/20'
        }`}
        title={focusMode ? 'Exit Focus Mode' : 'Enter Focus Mode'}
      >
        {focusMode ? <Eye className="w-5 h-5" /> : <EyeOff className="w-5 h-5" />}
      </motion.button>

      {/* Bottom Sheet Drawer */}
      <AnimatePresence>
        {!focusMode && (
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: isDrawerOpen ? '0%' : 'calc(100% - 180px)' }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            drag="y"
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={0.1}
            onDragEnd={handleDragEnd}
            className="fixed bottom-0 left-0 right-0 z-40 pointer-events-auto"
            style={{ height: 'calc(100vh - 100px)' }}
          >
            {/* Drawer Container */}
            <div className="h-full bg-black/80 backdrop-blur-xl rounded-t-3xl border-t border-white/10 shadow-2xl flex flex-col">
              {/* Drag Handle */}
              <div className="flex items-center justify-center py-3 cursor-grab active:cursor-grabbing">
                <div className="w-12 h-1.5 bg-white/20 rounded-full" />
              </div>

              {/* Drawer Content */}
              <div className="flex-1 overflow-hidden">
                <AnimatePresence mode="wait">
                  {!isDrawerOpen ? (
                    // Collapsed State: Show Top Pick
                    <motion.div
                      key="collapsed"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="p-6 h-full"
                    >
                      <div className="flex items-center justify-between mb-4">
                        <h2 className="text-lg font-black uppercase tracking-wider text-theme-primary">
                          Top Recommendation
                        </h2>
                        <button
                          onClick={() => setIsDrawerOpen(true)}
                          className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                        >
                          <ChevronUp className="w-5 h-5 text-gray-400" />
                        </button>
                      </div>
                      <TopPickCard
                        topPick={props.topPick}
                        zone={props.topZone}
                        driverLocation={props.driverLocation}
                      />
                    </motion.div>
                  ) : (
                    // Expanded State: Show Full Grid
                    <motion.div
                      key="expanded"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="h-full overflow-y-auto px-6 pb-6"
                    >
                      <div className="flex items-center justify-between mb-4 sticky top-0 bg-black/80 backdrop-blur-xl py-3 z-10">
                        <h2 className="text-lg font-black uppercase tracking-wider text-theme-primary">
                          Dashboard
                        </h2>
                        <button
                          onClick={() => setIsDrawerOpen(false)}
                          className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                        >
                          <ChevronDown className="w-5 h-5 text-gray-400" />
                        </button>
                      </div>
                      <DraggableCardGrid
                        cards={drawerCards}
                        storageKey="dream-layout-drawer"
                        showLayoutControls={false}
                        variant="minimal"
                      />
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Zone Detail Sheet */}
      <ZoneDetailSheet
        zone={selectedZone}
        onClose={() => setSelectedZone(null)}
        driverLocation={props.driverLocation}
      />
    </div>
  );
}

