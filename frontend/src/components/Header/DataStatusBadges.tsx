import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Cloud, Calendar, Plane, Car, ChevronDown, CheckCircle2, AlertCircle } from 'lucide-react';

interface SourceStatus {
  enabled: boolean;
  source: 'real' | 'mock';
  provider: string;
  lastFetch: string | null;
}

interface StatusResponse {
  timestamp: string;
  sources: {
    weather: SourceStatus;
    events: SourceStatus;
    flights: SourceStatus;
    traffic: SourceStatus;
  };
}

export function DataStatusBadges() {
  const [status, setStatus] = useState<StatusResponse | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const response = await fetch('/api/status');
        if (response.ok) {
          const data = await response.json();
          setStatus(data);
        }
      } catch (error) {
        console.error('Failed to fetch API status:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStatus();
    // Refresh status every 30 seconds
    const interval = setInterval(fetchStatus, 30000);
    return () => clearInterval(interval);
  }, []);

  if (loading || !status) return null;

  const realSources = Object.values(status.sources).filter(s => s.source === 'real').length;
  const totalSources = Object.keys(status.sources).length;
  const allReal = realSources === totalSources;

  return (
    <div className="relative">
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setShowDetails(!showDetails)}
        className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
          allReal
            ? 'bg-neon-green/20 text-neon-green border border-neon-green/50'
            : 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/50'
        }`}
        title="API Data Sources"
      >
        {allReal ? (
          <CheckCircle2 className="w-3 h-3" />
        ) : (
          <AlertCircle className="w-3 h-3" />
        )}
        <span className="hidden sm:inline">
          {allReal ? 'All Live' : `${realSources}/${totalSources} Live`}
        </span>
        <ChevronDown className="w-3 h-3" />
      </motion.button>

      <AnimatePresence>
        {showDetails && (
          <>
            {/* Backdrop */}
            <div
              className="fixed inset-0 z-40"
              onClick={() => setShowDetails(false)}
            />
            
            {/* Dropdown */}
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="absolute right-0 top-full mt-2 w-72 glass-strong rounded-xl border border-white/20 shadow-2xl overflow-hidden z-50"
            >
              <div className="p-4 border-b border-white/10">
                <h3 className="text-sm font-bold text-white mb-1">Data Sources</h3>
                <p className="text-xs text-gray-400">Real-time and fallback status</p>
              </div>

              <div className="p-2 space-y-1">
                {/* Weather */}
                <DataSourceRow
                  icon={<Cloud className="w-4 h-4" />}
                  name="Weather"
                  status={status.sources.weather}
                />

                {/* Events */}
                <DataSourceRow
                  icon={<Calendar className="w-4 h-4" />}
                  name="Events"
                  status={status.sources.events}
                />

                {/* Flights */}
                <DataSourceRow
                  icon={<Plane className="w-4 h-4" />}
                  name="Flights"
                  status={status.sources.flights}
                />

                {/* Traffic */}
                <DataSourceRow
                  icon={<Car className="w-4 h-4" />}
                  name="Traffic"
                  status={status.sources.traffic}
                />
              </div>

              <div className="px-4 py-3 border-t border-white/10 text-xs text-gray-400">
                Updated: {new Date(status.timestamp).toLocaleTimeString()}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

interface DataSourceRowProps {
  icon: React.ReactNode;
  name: string;
  status: SourceStatus;
}

function DataSourceRow({ icon, name, status }: DataSourceRowProps) {
  const isReal = status.source === 'real';
  const lastFetchText = status.lastFetch
    ? new Date(status.lastFetch).toLocaleTimeString()
    : 'Never';

  return (
    <div className="flex items-center justify-between px-3 py-2 rounded-lg hover:bg-white/5 transition-colors">
      <div className="flex items-center gap-2">
        <div className="text-gray-400">{icon}</div>
        <div>
          <div className="text-sm font-medium text-white">{name}</div>
          <div className="text-xs text-gray-400">{status.provider}</div>
        </div>
      </div>
      <div className="flex flex-col items-end gap-1">
        <span
          className={`px-2 py-0.5 rounded-full text-xs font-medium ${
            isReal
              ? 'bg-neon-green/20 text-neon-green'
              : 'bg-yellow-500/20 text-yellow-400'
          }`}
        >
          {isReal ? 'Live' : 'Mock'}
        </span>
        {status.lastFetch && (
          <span className="text-xs text-gray-500">{lastFetchText}</span>
        )}
      </div>
    </div>
  );
}

