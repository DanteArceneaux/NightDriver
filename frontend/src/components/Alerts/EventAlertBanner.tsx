import { motion, AnimatePresence } from 'framer-motion';
import { Clock, Zap, MapPin, X } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useSettingsStore } from '../../features/settings';
import { BACKEND_URL } from '../../lib/api';

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
        const response = await fetch(`${BACKEND_URL}/api/event-alerts?alertMinutes=${eventAlertMinutes}`);
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

  const getAlertKey = (alert: EventAlert, idx: number) => {
    return `${alert.type}-${alert.event.id || `idx-${idx}`}`;
  };

  const dismissAlert = (key: string) => {
    setDismissedAlerts(prev => new Set([...prev, key]));
  };

  const dismissAll = () => {
    setDismissedAlerts(new Set(alerts.map((a, i) => getAlertKey(a, i))));
  };

  const visibleAlerts = alerts.filter((a, i) => !dismissedAlerts.has(getAlertKey(a, i)));

  return (
    <AnimatePresence>
      {visibleAlerts.length > 0 && (
        <motion.div
          initial={{ x: 100, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: 100, opacity: 0 }}
          className="fixed top-[180px] right-4 z-[55] w-[calc(100%-32px)] md:w-80 pointer-events-none"
        >
          <div className="space-y-3 pointer-events-auto">
            {/* Dismiss All Button */}
            {visibleAlerts.length > 1 && (
              <motion.button
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                onClick={dismissAll}
                className="mb-2 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-white/50 hover:text-white bg-black/30 hover:bg-black/50 rounded-full transition-colors ml-auto block border border-white/10"
              >
                Dismiss All ({visibleAlerts.length})
              </motion.button>
            )}
            
            {visibleAlerts.map((alert, idx) => {
              const key = getAlertKey(alert, idx);
              return (
                <motion.div
                  key={key}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ delay: idx * 0.1 }}
                  className={`p-4 rounded-2xl backdrop-blur-xl border-2 shadow-2xl relative ${
                    alert.type === 'encore'
                      ? 'bg-gradient-to-br from-purple-600/90 to-blue-600/90 border-purple-400'
                      : alert.urgency === 'high'
                      ? 'bg-gradient-to-br from-orange-600/90 to-red-600/90 border-orange-400'
                      : 'bg-gradient-to-br from-slate-800/90 to-slate-900/90 border-slate-700'
                  }`}
                >
                  {/* Close Button */}
                  <button
                    onClick={() => dismissAlert(key)}
                    className="absolute top-2 right-2 p-1 rounded-full hover:bg-black/20 transition-colors text-white/70 hover:text-white"
                    aria-label="Dismiss alert"
                  >
                    <X className="w-4 h-4" />
                  </button>

                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 mt-1">
                      {alert.type === 'encore' ? (
                        <Zap className="w-5 h-5 text-yellow-300 fill-yellow-300 animate-pulse" />
                      ) : (
                        <Clock className="w-5 h-5 text-white" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-[10px] font-black uppercase tracking-widest text-white/90">
                          {alert.type === 'encore' ? '🎤 Encore' : '🚪 Doors'}
                        </span>
                        <span className="text-[10px] font-bold px-1.5 py-0.5 bg-black/30 rounded text-white">
                          {alert.minutesUntil}m
                        </span>
                      </div>
                      <div className="text-sm font-black text-white leading-tight uppercase truncate">
                        {alert.event.name}
                      </div>
                      <div className="flex items-center gap-1.5 text-[10px] text-white/70 mt-1 font-bold">
                        <MapPin className="w-3 h-3 shrink-0" />
                        <span className="truncate">{alert.event.venue}</span>
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
