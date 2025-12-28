import { useState, useMemo, useRef } from 'react';
import { motion, AnimatePresence, PanInfo } from 'framer-motion';
import { 
  Radio, MapPin, TrendingUp, Calendar, Activity, Trophy, 
  DollarSign, Car, Eye, EyeOff, Lock, Unlock,
  ChevronUp, ChevronDown, Grip
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
  const [mapLocked, setMapLocked] = useState(true); // DEFAULT: Map is LOCKED for easy scrolling
  const drawerRef = useRef<HTMLDivElement>(null);
  const { getProgress } = useEarningsStore();
  const progress = getProgress();

  const handleZoneClick = (zone: typeof props.zones[0]) => {
    if (mapLocked) return; // Don't handle clicks when map is locked
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
    const threshold = -80;
    if (info.offset.y < threshold) {
      setIsDrawerOpen(true);
    } else if (info.offset.y > Math.abs(threshold)) {
      setIsDrawerOpen(false);
    }
  };

  return (
    <div className="fixed inset-0 text-white overflow-hidden">
      {/* ==================== LAYER 0: MAP ==================== */}
      {/* Map with touch blocking when locked */}
      <div 
        className={`absolute inset-0 z-0 ${mapLocked ? 'pointer-events-none' : ''}`}
        style={{ 
          // Safe area padding for iOS
          paddingTop: 'env(safe-area-inset-top, 0px)',
        }}
      >
        <SeattleMap 
          zones={props.zones} 
          onZoneClick={handleZoneClick}
        />
        
        {/* Map Lock Overlay - Visual indicator when locked */}
        {mapLocked && !focusMode && (
          <div className="absolute inset-0 bg-transparent" />
        )}
      </div>

      {/* ==================== LAYER 2: MICRO HUD ==================== */}
      <AnimatePresence>
        {!focusMode && (
          <motion.div
            initial={{ y: -100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -100, opacity: 0 }}
            className="fixed left-0 right-0 z-40 pointer-events-none"
            style={{
              // Safe area for Dynamic Island + extra padding to avoid overlap
              top: 'max(env(safe-area-inset-top, 16px), 16px)',
              paddingLeft: '16px',
              paddingRight: '16px',
            }}
          >
            {/* Single row HUD - clean, no overlap */}
            <div className="flex items-center justify-between gap-2 max-w-7xl mx-auto">
              {/* Left: Status Pills */}
              <div className="flex items-center gap-2 pointer-events-auto">
                {/* Connection Status */}
                <div
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold backdrop-blur-xl shadow-lg ${
                    props.connected
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/50'
                      : 'bg-red-500/20 text-red-400 border border-red-500/50'
                  }`}
                  style={{ minHeight: '40px' }}
                >
                  <Radio className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">{props.connected ? 'LIVE' : 'OFFLINE'}</span>
                </div>

                {/* GPS Status */}
                {props.driverLocation && (
                  <div 
                    className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-cyan-500/20 backdrop-blur-xl border border-cyan-500/50 text-cyan-400 text-xs font-bold shadow-lg"
                    style={{ minHeight: '40px' }}
                  >
                    <MapPin className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">GPS</span>
                  </div>
                )}
              </div>

              {/* Right: Earnings + Focus + Lock */}
              <div className="flex items-center gap-2 pointer-events-auto">
                {/* Map Lock Toggle - Integrated here */}
                <motion.button
                  whileTap={{ scale: 0.9 }}
                  onClick={() => setMapLocked(!mapLocked)}
                  className={`p-3 rounded-xl backdrop-blur-xl transition-all shadow-lg ${
                    mapLocked
                      ? 'bg-amber-500/20 text-amber-400 border border-amber-500/50'
                      : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/50'
                  }`}
                  style={{ minHeight: '40px', minWidth: '40px' }}
                >
                  {mapLocked ? <Lock className="w-4 h-4" /> : <Unlock className="w-4 h-4" />}
                </motion.button>

                {/* Earnings Pill */}
                {progress && (
                  <div 
                    className="flex items-center gap-2 px-3 py-2 rounded-xl bg-black/70 backdrop-blur-xl border border-white/20 shadow-lg"
                    style={{ minHeight: '40px' }}
                  >
                    <DollarSign className="w-4 h-4 text-emerald-400" />
                    <span className="text-base font-black text-white">
                      ${progress.currentEarnings.toFixed(0)}
                    </span>
                  </div>
                )}

                {/* Focus Mode Toggle */}
                <motion.button
                  whileTap={{ scale: 0.9 }}
                  onClick={() => {
                    setFocusMode(!focusMode);
                    if (!focusMode) setIsDrawerOpen(false);
                  }}
                  className={`p-3 rounded-xl backdrop-blur-xl transition-all shadow-lg ${
                    focusMode
                      ? 'bg-cyan-500 text-black border-2 border-cyan-400'
                      : 'bg-black/70 text-white border border-white/20'
                  }`}
                  style={{ minHeight: '40px', minWidth: '40px' }}
                >
                  {focusMode ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                </motion.button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ==================== LAYER 3: BOTTOM SHEET ==================== */}
      <AnimatePresence>
        {!focusMode && (
          <motion.div
            ref={drawerRef}
            initial={{ y: '100%' }}
            animate={{ 
              y: isDrawerOpen ? '0%' : 'calc(100% - 200px)',
            }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            drag="y"
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={0.05}
            onDragEnd={handleDragEnd}
            className="fixed left-0 right-0 z-30"
            style={{ 
              bottom: 0,
              height: '85vh',
              // Safe area for home indicator
              paddingBottom: 'env(safe-area-inset-bottom, 0px)',
            }}
          >
            {/* Sheet Container */}
            <div className="h-full bg-gradient-to-b from-gray-900/98 via-black/98 to-black backdrop-blur-2xl rounded-t-[28px] border-t border-white/10 shadow-2xl flex flex-col overflow-hidden">
              
              {/* Drag Handle - Large touch target */}
              <div 
                className="flex flex-col items-center pt-3 pb-2 cursor-grab active:cursor-grabbing touch-none"
                style={{ minHeight: '44px' }}
              >
                <div className="flex items-center gap-2 text-gray-500 mb-1">
                  <Grip className="w-4 h-4" />
                  <span className="text-[10px] font-medium uppercase tracking-wider">
                    {isDrawerOpen ? 'Drag down to close' : 'Drag up for more'}
                  </span>
                  <Grip className="w-4 h-4" />
                </div>
                <div className="w-10 h-1 bg-white/30 rounded-full" />
              </div>

              {/* Sheet Content */}
              <div className="flex-1 overflow-hidden">
                <AnimatePresence mode="wait">
                  {!isDrawerOpen ? (
                    /* ===== COLLAPSED STATE ===== */
                    <motion.div
                      key="collapsed"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="h-full px-4 pb-4"
                    >
                      {/* Header with expand button */}
                      <div className="flex items-center justify-between mb-3">
                        <h2 className="text-sm font-black uppercase tracking-widest text-cyan-400 flex items-center gap-2">
                          <TrendingUp className="w-4 h-4" />
                          Top Pick
                        </h2>
                        <motion.button
                          whileTap={{ scale: 0.9 }}
                          onClick={() => setIsDrawerOpen(true)}
                          className="flex items-center gap-1 px-3 py-2 rounded-xl bg-white/10 hover:bg-white/20 transition-colors"
                          style={{ minHeight: '40px' }}
                        >
                          <span className="text-xs font-medium text-gray-300">More</span>
                          <ChevronUp className="w-4 h-4 text-gray-400" />
                        </motion.button>
                      </div>

                      {/* Top Pick Card - Full width, no scroll conflicts */}
                      <div className="touch-pan-y">
                        <TopPickCard
                          topPick={props.topPick}
                          zone={props.topZone}
                          driverLocation={props.driverLocation}
                        />
                      </div>
                    </motion.div>
                  ) : (
                    /* ===== EXPANDED STATE ===== */
                    <motion.div
                      key="expanded"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="h-full flex flex-col"
                    >
                      {/* Sticky Header */}
                      <div className="sticky top-0 z-10 flex items-center justify-between px-4 py-3 bg-black/90 backdrop-blur-xl border-b border-white/5">
                        <h2 className="text-sm font-black uppercase tracking-widest text-cyan-400 flex items-center gap-2">
                          <Activity className="w-4 h-4" />
                          Dashboard
                        </h2>
                        <motion.button
                          whileTap={{ scale: 0.9 }}
                          onClick={() => setIsDrawerOpen(false)}
                          className="flex items-center gap-1 px-3 py-2 rounded-xl bg-white/10 hover:bg-white/20 transition-colors"
                          style={{ minHeight: '40px' }}
                        >
                          <span className="text-xs font-medium text-gray-300">Close</span>
                          <ChevronDown className="w-4 h-4 text-gray-400" />
                        </motion.button>
                      </div>

                      {/* Scrollable Content - This is the main scroll area */}
                      <div 
                        className="flex-1 overflow-y-auto overscroll-contain px-4 pb-8"
                        style={{
                          // Smooth iOS scrolling
                          WebkitOverflowScrolling: 'touch',
                        }}
                      >
                        {/* Top Pick Section */}
                        <div className="py-4 border-b border-white/5">
                          <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-3">
                            Recommended Zone
                          </h3>
                          <TopPickCard
                            topPick={props.topPick}
                            zone={props.topZone}
                            driverLocation={props.driverLocation}
                          />
                        </div>

                        {/* Dashboard Cards */}
                        <div className="py-4">
                          <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-3">
                            Your Dashboard
                          </h3>
                          <DraggableCardGrid
                            cards={drawerCards}
                            storageKey="dream-layout-drawer"
                            showLayoutControls={false}
                            variant="minimal"
                            externalLocked={true}
                            hideLockButton={true}
                          />
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ==================== LAYER 4: FOCUS MODE EXIT ==================== */}
      <AnimatePresence>
        {focusMode && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="fixed z-50 pointer-events-auto"
            style={{
              bottom: 'max(env(safe-area-inset-bottom, 24px), 24px)',
              left: '50%',
              transform: 'translateX(-50%)',
            }}
          >
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => setFocusMode(false)}
              className="flex items-center gap-3 px-6 py-4 rounded-2xl bg-cyan-500/90 text-black font-bold backdrop-blur-xl border-2 border-cyan-400 shadow-lg shadow-cyan-500/30"
              style={{ minHeight: '56px' }}
            >
              <Eye className="w-6 h-6" />
              <span className="text-base">Exit Focus Mode</span>
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ==================== LAYER 5: ZONE DETAIL MODAL ==================== */}
      <ZoneDetailSheet
        zone={selectedZone}
        onClose={() => setSelectedZone(null)}
        driverLocation={props.driverLocation}
      />
    </div>
  );
}
