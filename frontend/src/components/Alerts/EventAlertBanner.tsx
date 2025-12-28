import { motion, AnimatePresence } from 'framer-motion';
import { Clock, Zap, MapPin, X } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useSettingsStore } from '../../features/settings';

interface EventAlert {
  type: 'doors_open' | 'encore';
  event: {
    id: string;
    name: string;
    venue: string;
    startTime: string;
    endTime: string;
    zoneId: string;
  };
  urgency: 'high' | 'medium';
  message: string;
  minutesUntil: number;
}

export function EventAlertBanner() {
  const [alerts, setAlerts] = useState<EventAlert[]>([]);
  const [dismissedAlerts, setDismissedAlerts] = useState<Set<string>>(new Set());
  const { eventAlertMinutes } = useSettingsStore();

  useEffect(() => {
    const fetchAlerts = async () => {
      try {
        const response = await fetch(`http://localhost:3001/api/event-alerts?alertMinutes=${eventAlertMinutes}`);
        const data = await response.json();
        setAlerts(data.alerts.slice(0, 3)); // Show top 3 alerts
      } catch (error) {
        console.error('Failed to fetch event alerts:', error);
      }
    };

    fetchAlerts();
    const interval = setInterval(fetchAlerts, 60000); // Update every minute

    return () => clearInterval(interval);
  }, [eventAlertMinutes]);

  const dismissAlert = (alertId: string) => {
    setDismissedAlerts(prev => new Set([...prev, alertId]));
  };

  const dismissAll = () => {
    setDismissedAlerts(new Set(alerts.map(a => `${a.type}-${a.event.id}`)));
  };

  const visibleAlerts = alerts.filter(a => !dismissedAlerts.has(`${a.type}-${a.event.id}`));

  return (
    <AnimatePresence>
      {visibleAlerts.length > 0 && (
        <motion.div
          initial={{ y: -100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -100, opacity: 0 }}
          className="fixed top-24 left-1/2 transform -translate-x-1/2 z-[45] w-full max-w-2xl px-4"
        >
          {/* Dismiss All Button */}
          {visibleAlerts.length > 1 && (
            <motion.button
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              onClick={dismissAll}
              className="mb-2 px-3 py-1 text-xs font-bold text-white/70 hover:text-white bg-black/30 hover:bg-black/50 rounded-full transition-colors mx-auto block"
            >
              Dismiss All ({visibleAlerts.length})
            </motion.button>
          )}
          
          <div className="space-y-2">
            {visibleAlerts.map((alert, idx) => (
              <motion.div
                key={`${alert.type}-${alert.event.id || `idx-${idx}`}`}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20, height: 0 }}
                transition={{ delay: idx * 0.1 }}
                className={`p-4 rounded-xl backdrop-blur-xl border-2 shadow-2xl relative ${
                  alert.type === 'encore'
                    ? 'bg-gradient-to-r from-red-600/90 to-orange-600/90 border-yellow-400'
                    : alert.urgency === 'high'
                    ? 'bg-gradient-to-r from-purple-600/90 to-pink-600/90 border-purple-400'
                    : 'bg-gradient-to-r from-blue-600/90 to-cyan-600/90 border-cyan-400'
                }`}
              >
                {/* Close Button */}
                <button
                  onClick={() => dismissAlert(`${alert.type}-${alert.event.id}`)}
                  className="absolute top-2 right-2 p-1.5 rounded-full hover:bg-black/20 transition-colors"
                  aria-label="Dismiss alert"
                >
                  <X className="w-4 h-4 text-white/70 hover:text-white" />
                </button>

                <div className="flex items-start gap-3 pr-6">
                  <div className="flex-shrink-0">
                    {alert.type === 'encore' ? (
                      <Zap className="w-6 h-6 text-yellow-300 animate-pulse" />
                    ) : (
                      <Clock className="w-6 h-6 text-white" />
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`text-xs font-black uppercase tracking-wider ${
                        alert.type === 'encore' ? 'text-yellow-300' : 'text-white'
                      }`}>
                        {alert.type === 'encore' ? '🎤 ENCORE SURGE' : '🚪 DOORS OPEN'}
                      </span>
                      <span className="text-xs font-bold text-white/80">
                        in {alert.minutesUntil} min
                      </span>
                    </div>
                    <div className="text-sm font-bold text-white mb-1">
                      {alert.event.name}
                    </div>
                    <div className="flex items-center gap-2 text-xs text-white/90">
                      <MapPin className="w-3 h-3" />
                      {alert.event.venue}
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

