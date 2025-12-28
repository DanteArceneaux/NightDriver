import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useZoneScores } from './hooks/useZoneScores';
import { useDriverLocation } from './hooks/useDriverLocation';
import { useAutoRefresh } from './hooks/useAutoRefresh';
import { AppLayout } from './features/layout';
import { useTheme } from './features/theme';
import { Header } from './components/Header/Header';
import { SurgeAlert } from './components/SurgeAlert';
import { EventAlertBanner } from './components/Alerts/EventAlertBanner';
import { QuickActionsBar } from './components/QuickActions/QuickActionsBar';
import { BreakReminder } from './components/Alerts/BreakReminder';
import { SkeletonHero, SkeletonMap, SkeletonTimeline, SkeletonLeaderboard } from './components/Skeleton/Skeleton';
import { requestNotificationPermission } from './lib/notifications';
import { calculateDistance, estimateDriveTime, calculateEfficiency } from './lib/distance';
import { fetchConditions } from './lib/api';
import { SafeStorage } from './lib/safeStorage';
import type { SurgeAlertData } from './components/SurgeAlert';

function App() {
  const { data, loading, error, connected, refresh } = useZoneScores();
  const { location: driverLocation } = useDriverLocation();
  const { countdown } = useAutoRefresh(30000); // 30 seconds for WebSocket (used for visual countdown ring)
  const { layoutId } = useTheme(); // Get current layout
  const [surges] = useState<SurgeAlertData[]>([]);
  const [weather, setWeather] = useState<{ temp: number; description: string } | undefined>();
  const [shiftStartTime] = useState<Date>(() => {
    // Try to load from localStorage or start new shift
    const saved = SafeStorage.getItem('shiftStartTime');
    return saved ? new Date(saved) : new Date();
  });

  // Request notification permission on mount
  useEffect(() => {
    requestNotificationPermission();
    // Save shift start time
    SafeStorage.setItem('shiftStartTime', shiftStartTime.toISOString());
  }, [shiftStartTime]);

  // Fetch weather for header
  useEffect(() => {
    const loadWeather = async () => {
      try {
        const conditions = await fetchConditions();
        setWeather({
          temp: conditions.weather.temperature,
          description: conditions.weather.description
        });
      } catch (error) {
        console.error('Failed to load weather:', error);
      }
    };
    loadWeather();
  }, []);

  // Listen for surges from WebSocket
  useEffect(() => {
    // Surges are now handled in useZoneScores hook via notifications
  }, []);

  // Sort zones by efficiency if driver location available
  const sortedZones = data?.zones ? [...data.zones].sort((a, b) => {
    if (!driverLocation) return b.score - a.score; // Default: sort by score

    const distA = calculateDistance(driverLocation, a.coordinates);
    const distB = calculateDistance(driverLocation, b.coordinates);
    const effA = calculateEfficiency(a.score, estimateDriveTime(distA));
    const effB = calculateEfficiency(b.score, estimateDriveTime(distB));

    return effB - effA; // Sort by efficiency
  }) : [];

  if (loading && !data) {
    return (
      <div className="min-h-screen text-white pb-12">
        <Header
          connected={false}
          countdown={30}
          hasLocation={false}
          onRefresh={() => {}}
          lastUpdate={null}
        />
        <motion.main
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="max-w-7xl mx-auto px-4 pt-28 space-y-6"
        >
          <SkeletonHero />
          <div className="h-[400px] md:h-[500px]">
            <SkeletonMap />
          </div>
          <SkeletonTimeline />
          <SkeletonLeaderboard />
        </motion.main>
      </div>
    );
  }

  if (error && !data) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center glass-strong p-12 rounded-3xl border border-theme-accent/30"
        >
          <div className="text-neon-pink text-2xl font-bold mb-4">Connection Error</div>
          <div className="text-gray-300 mb-6">{error}</div>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={refresh}
            className="px-8 py-3 bg-gradient-to-r from-theme-primary to-theme-secondary rounded-xl text-white font-bold"
          >
            Retry Connection
          </motion.button>
        </motion.div>
      </div>
    );
  }

  if (!data) return null;

  const topZone = sortedZones.find(z => z.id === data.topPick.zoneId) || data.zones.find(z => z.id === data.topPick.zoneId);

  return (
    <>
      {/* Surge Alert */}
      <SurgeAlert surges={surges} />

      {/* Event Alerts */}
      <EventAlertBanner />

      {/* Break Reminder (every 4 hours) */}
      <BreakReminder shiftStartTime={shiftStartTime} />

      {/* Quick Actions Bar - Hidden for Dream Layout (has its own) */}
      {layoutId !== 'dream' && (
        <QuickActionsBar 
          currentLocation={driverLocation || { lat: 47.6062, lng: -122.3321 }} 
          zones={sortedZones}
        />
      )}

      {/* Theme-aware Layout */}
      <AppLayout
        zones={sortedZones}
        topPick={data.topPick}
        topZone={topZone}
        driverLocation={driverLocation}
        connected={connected}
        countdown={countdown}
        weather={weather}
        error={error || undefined}
        onRefresh={refresh}
      />
    </>
  );
}

export default App;

