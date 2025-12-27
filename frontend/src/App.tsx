import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useZoneScores } from './hooks/useZoneScores';
import { useDriverLocation } from './hooks/useDriverLocation';
import { useAutoRefresh } from './hooks/useAutoRefresh';
import { Header } from './components/Header/Header';
import { SeattleMap } from './components/Map/SeattleMap';
import { TopPickCard } from './components/Recommendation/TopPickCard';
import { ForecastTimeline } from './components/Timeline/ForecastTimeline';
import { LiveConditions } from './components/Conditions/LiveConditions';
import { Leaderboard } from './components/ZoneList/Leaderboard';
import { EventsPanel } from './components/Events/EventsPanel';
import { ZoneDetailSheet } from './components/ZoneDetail/ZoneDetailSheet';
import { SurgeAlert } from './components/SurgeAlert';
import { SkeletonHero, SkeletonMap, SkeletonTimeline, SkeletonLeaderboard } from './components/Skeleton/Skeleton';
import { requestNotificationPermission } from './lib/notifications';
import { calculateDistance, estimateDriveTime, calculateEfficiency } from './lib/distance';
import { fetchConditions } from './lib/api';
import type { ZoneScore } from './types';

function App() {
  const { data, loading, error, connected, refresh } = useZoneScores(true); // Use WebSocket
  const { location: driverLocation, permission } = useDriverLocation();
  const { countdown } = useAutoRefresh(30000); // 30 seconds for WebSocket
  const [surges, setSurges] = useState<any[]>([]);
  const [weather, setWeather] = useState<{ temp: number; description: string } | undefined>();
  const [selectedZone, setSelectedZone] = useState<ZoneScore | null>(null);

  // Request notification permission on mount
  useEffect(() => {
    requestNotificationPermission();
  }, []);

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
          className="text-center glass-strong p-12 rounded-3xl border border-neon-pink/30"
        >
          <div className="text-neon-pink text-2xl font-bold mb-4">Connection Error</div>
          <div className="text-gray-300 mb-6">{error}</div>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={refresh}
            className="px-8 py-3 bg-gradient-to-r from-neon-cyan to-neon-purple rounded-xl text-white font-bold"
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
    <div className="min-h-screen text-white pb-12">
      {/* Surge Alert */}
      <SurgeAlert surges={surges} />

      {/* Header */}
      <Header
        connected={connected}
        countdown={countdown}
        hasLocation={permission === 'granted' && !!driverLocation}
        onRefresh={refresh}
        weather={weather}
      />

      {/* Main Content */}
      <motion.main
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="max-w-7xl mx-auto px-4 pt-28 space-y-6"
      >
        {/* Top Recommendation - Hero */}
        <TopPickCard topPick={data.topPick} zone={topZone} driverLocation={driverLocation} />

        {/* Map */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="h-[400px] md:h-[500px]"
        >
          <SeattleMap zones={sortedZones} onZoneClick={setSelectedZone} />
        </motion.div>

        {/* Timeline Forecast */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <ForecastTimeline />
        </motion.div>

        {/* Live Conditions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <LiveConditions />
        </motion.div>

        {/* Events Panel */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.45 }}
        >
          <EventsPanel />
        </motion.div>

        {/* Zone Leaderboard */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <Leaderboard zones={sortedZones} driverLocation={driverLocation} />
        </motion.div>
      </motion.main>

      {/* Zone Detail Sheet */}
      <ZoneDetailSheet 
        zone={selectedZone} 
        onClose={() => setSelectedZone(null)}
        driverLocation={driverLocation}
      />

      {/* Footer */}
      <motion.footer
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6 }}
        className="mt-12 glass-strong border-t border-white/10"
      >
        <div className="max-w-7xl mx-auto px-4 py-6 text-center text-sm">
          <p className="text-gray-400">
            Last updated: <span className="text-neon-cyan font-mono">{new Date(data.timestamp).toLocaleTimeString()}</span>
          </p>
          <p className="mt-2 text-gray-500">
            {connected ? '⚡ Live updates via WebSocket' : '📡 Reconnecting...'}
          </p>
          {error && (
            <p className="mt-2 text-neon-orange">
              ⚠️ {error}
            </p>
          )}
        </div>
      </motion.footer>
    </div>
  );
}

export default App;

