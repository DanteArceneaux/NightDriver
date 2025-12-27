import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar, MapPin, Users, Clock, ChevronDown, ChevronUp } from 'lucide-react';
import { fetchConditions } from '../../lib/api';
import type { Event } from '../../types';

function getEventIcon(type?: string) {
  switch (type) {
    case 'sports':
      return '⚽';
    case 'concert':
      return '🎵';
    case 'conference':
      return '💼';
    case 'festival':
      return '🎉';
    default:
      return '🎫';
  }
}

function getTimeUntil(startTime: string): string {
  const now = new Date();
  const start = new Date(startTime);
  const diffMs = start.getTime() - now.getTime();
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffMins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

  if (diffMs < 0) return 'In progress';
  if (diffHours === 0) return `${diffMins}m`;
  if (diffHours < 24) return `${diffHours}h ${diffMins}m`;
  return `${Math.floor(diffHours / 24)}d`;
}

function formatEventTime(startTime: string): string {
  const date = new Date(startTime);
  return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
}

export function EventsPanel() {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(true);

  useEffect(() => {
    const loadEvents = async () => {
      try {
        const conditions = await fetchConditions();
        setEvents(conditions.events);
        setLoading(false);
      } catch (error) {
        console.error('Failed to load events:', error);
        setLoading(false);
      }
    };

    loadEvents();
    const interval = setInterval(loadEvents, 300000); // Refresh every 5 minutes

    return () => clearInterval(interval);
  }, []);

  if (loading) return null;
  if (events.length === 0) return null;

  return (
    <div className="glass-strong rounded-2xl border border-white/10 overflow-hidden">
      {/* Header */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full px-6 py-4 flex items-center justify-between hover:bg-white/5 transition-colors"
      >
        <div className="flex items-center gap-2">
          <Calendar className="w-5 h-5 text-neon-orange" />
          <h3 className="text-sm font-bold text-gray-300 uppercase tracking-widest">
            Upcoming Events ({events.length})
          </h3>
        </div>
        {expanded ? (
          <ChevronUp className="w-5 h-5 text-gray-400" />
        ) : (
          <ChevronDown className="w-5 h-5 text-gray-400" />
        )}
      </button>

      {/* Event List */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden"
          >
            <div className="px-6 pb-4 space-y-3">
              {events.map((event, idx) => {
                const timeUntil = getTimeUntil(event.startTime);
                const isStartingSoon = timeUntil !== 'In progress' && !timeUntil.includes('d') && parseInt(timeUntil) < 120;

                return (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    className={`glass rounded-xl p-4 border ${
                      isStartingSoon
                        ? 'border-neon-orange/50 bg-neon-orange/10'
                        : 'border-white/5'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      {/* Event Icon */}
                      <div className="text-3xl flex-shrink-0">
                        {getEventIcon(event.type)}
                      </div>

                      {/* Event Details */}
                      <div className="flex-1 min-w-0">
                        <h4 className="font-bold text-white text-sm mb-1 truncate">
                          {event.name}
                        </h4>

                        <div className="space-y-1">
                          {/* Venue */}
                          <div className="flex items-center gap-2 text-xs text-gray-400">
                            <MapPin className="w-3 h-3" />
                            <span className="truncate">{event.venue}</span>
                          </div>

                          {/* Time */}
                          <div className="flex items-center gap-2 text-xs text-gray-400">
                            <Clock className="w-3 h-3" />
                            <span>{formatEventTime(event.startTime)}</span>
                          </div>

                          {/* Attendees */}
                          {event.attendees && (
                            <div className="flex items-center gap-2 text-xs text-gray-400">
                              <Users className="w-3 h-3" />
                              <span>{event.attendees.toLocaleString()} capacity</span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Time Until Badge */}
                      <div
                        className={`flex-shrink-0 px-3 py-1 rounded-full text-xs font-bold ${
                          isStartingSoon
                            ? 'bg-neon-orange/20 text-neon-orange border border-neon-orange/50'
                            : timeUntil === 'In progress'
                            ? 'bg-neon-green/20 text-neon-green border border-neon-green/50'
                            : 'bg-gray-700/50 text-gray-300'
                        }`}
                      >
                        {timeUntil === 'In progress' ? (
                          <div className="flex items-center gap-1">
                            <span className="w-2 h-2 bg-neon-green rounded-full animate-pulse" />
                            LIVE
                          </div>
                        ) : (
                          timeUntil
                        )}
                      </div>
                    </div>

                    {/* Zone Badge */}
                    <div className="mt-2 inline-block px-2 py-1 bg-neon-cyan/10 border border-neon-cyan/30 rounded text-xs text-neon-cyan font-semibold">
                      {event.zoneId.replace('_', ' ').toUpperCase()}
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

