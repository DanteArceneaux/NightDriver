import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar, MapPin, Users, Clock, ChevronDown, ChevronUp } from 'lucide-react';
import { fetchConditions } from '../../lib/api';
import { useTheme } from '../../features/theme';
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

function getTimeUntil(startTime: string, endTime: string): { 
  text: string; 
  status: 'ending' | 'starting' | 'later' | 'live';
  urgency: number;
} {
  const now = new Date();
  const start = new Date(startTime);
  const end = new Date(endTime);
  const diffMsStart = start.getTime() - now.getTime();
  const diffMsEnd = end.getTime() - now.getTime();
  
  // Event is happening now
  if (diffMsStart < 0 && diffMsEnd > 0) {
    const minsLeft = Math.floor(diffMsEnd / (1000 * 60));
    return { 
      text: minsLeft < 60 ? `Ends in ${minsLeft}m` : `Ends in ${Math.floor(minsLeft / 60)}h`,
      status: 'live',
      urgency: 100 - minsLeft // Higher urgency = ending soon
    };
  }
  
  // Event ending soon (within 2 hours)
  if (diffMsStart < 0 && diffMsEnd <= 2 * 60 * 60 * 1000) {
    const minsLeft = Math.floor(diffMsEnd / (1000 * 60));
    return { 
      text: `Ending in ${minsLeft}m`,
      status: 'ending',
      urgency: 200 - minsLeft
    };
  }
  
  // Event starting soon (within 2 hours)
  if (diffMsStart > 0 && diffMsStart <= 2 * 60 * 60 * 1000) {
    const hoursUntil = Math.floor(diffMsStart / (1000 * 60 * 60));
    const minsUntil = Math.floor((diffMsStart % (1000 * 60 * 60)) / (1000 * 60));
    return { 
      text: hoursUntil === 0 ? `Starts in ${minsUntil}m` : `Starts in ${hoursUntil}h ${minsUntil}m`,
      status: 'starting',
      urgency: 120 - Math.floor(diffMsStart / (1000 * 60))
    };
  }
  
  // Later today
  const hoursUntil = Math.floor(diffMsStart / (1000 * 60 * 60));
  return { 
    text: hoursUntil < 24 ? `In ${hoursUntil}h` : `In ${Math.floor(hoursUntil / 24)}d`,
    status: 'later',
    urgency: -hoursUntil
  };
}

function formatEventTime(startTime: string): string {
  const date = new Date(startTime);
  return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
}

export function EventsPanel() {
  const { tokens } = useTheme();
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

  // Sort events by urgency (ending soon > starting soon > later)
  const sortedEvents = [...events].sort((a, b) => {
    const urgencyA = getTimeUntil(a.startTime, a.endTime).urgency;
    const urgencyB = getTimeUntil(b.startTime, b.endTime).urgency;
    return urgencyB - urgencyA;
  });

  return (
    <div className={`${tokens.cardBg} ${tokens.borderRadius} ${tokens.cardBorder} overflow-hidden`}>
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
              {sortedEvents.map((event, idx) => {
                const timeInfo = getTimeUntil(event.startTime, event.endTime);
                const isUrgent = timeInfo.status === 'ending' || timeInfo.status === 'live';
                const hasImage = !!event.imageUrl;

                return (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    className={`glass rounded-xl overflow-hidden border ${
                      isUrgent
                        ? 'border-neon-pink/60 bg-neon-pink/5 shadow-[0_0_15px_rgba(255,0,85,0.3)]'
                        : timeInfo.status === 'starting'
                        ? 'border-neon-orange/50 bg-neon-orange/5'
                        : 'border-white/5'
                    } ${event.url ? 'cursor-pointer hover:border-theme-primary/50' : ''}`}
                    onClick={() => event.url && window.open(event.url, '_blank')}
                  >
                    <div className="flex gap-3 p-4">
                      {/* Thumbnail */}
                      {hasImage ? (
                        <div className="flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden bg-gray-800">
                          <img
                            src={event.imageUrl}
                            alt={event.name}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              e.currentTarget.style.display = 'none';
                            }}
                          />
                        </div>
                      ) : (
                        <div className="flex-shrink-0 w-20 h-20 rounded-lg bg-gray-800/50 flex items-center justify-center text-4xl">
                          {getEventIcon(event.type)}
                        </div>
                      )}

                      {/* Event Details */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <h4 className="font-bold text-white text-base leading-tight">
                            {event.name}
                          </h4>
                          
                          {/* Urgency Badge */}
                          <div
                            className={`flex-shrink-0 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider ${
                              timeInfo.status === 'live'
                                ? 'bg-neon-green/30 text-neon-green border-2 border-neon-green/70 shadow-[0_0_10px_rgba(0,255,102,0.5)] animate-pulse'
                                : timeInfo.status === 'ending'
                                ? 'bg-neon-pink/30 text-neon-pink border-2 border-neon-pink/70 shadow-[0_0_10px_rgba(255,0,85,0.5)]'
                                : timeInfo.status === 'starting'
                                ? 'bg-neon-orange/20 text-neon-orange border border-neon-orange/50'
                                : 'bg-gray-700/50 text-gray-400 border border-gray-600'
                            }`}
                          >
                            {timeInfo.text}
                          </div>
                        </div>

                        <div className="space-y-1 mb-2">
                          {/* Venue */}
                          <div className="flex items-center gap-2 text-xs text-gray-400">
                            <MapPin className="w-3 h-3" />
                            <span className="truncate">{event.venue}</span>
                          </div>

                          {/* Time */}
                          <div className="flex items-center gap-2 text-xs text-gray-400">
                            <Clock className="w-3 h-3" />
                            <span>{formatEventTime(event.startTime)}</span>
                            {event.attendees && (
                              <>
                                <span className="text-gray-600">•</span>
                                <Users className="w-3 h-3" />
                                <span>{(event.attendees / 1000).toFixed(0)}k capacity</span>
                              </>
                            )}
                          </div>
                        </div>

                        {/* Zone Boost Badge - Updated for v9.0 scoring */}
                        <div className="inline-flex items-center gap-2 px-3 py-1 bg-theme-primary/20 border border-theme-primary/50 rounded-lg">
                          <span className="text-xs text-gray-300">
                            {timeInfo.status === 'ending' || timeInfo.status === 'live' ? '🔥 SURGE in:' : 'Boosting:'}
                          </span>
                          <span className="text-xs text-theme-primary font-bold uppercase">
                            {event.zoneId.replace('_', ' ')}
                          </span>
                          <span className={`font-bold text-sm ${
                            timeInfo.status === 'ending' || (timeInfo.status === 'live' && timeInfo.urgency > 40) 
                              ? 'text-neon-pink' 
                              : 'text-neon-orange'
                          }`}>
                            +{
                              // NEW v9.0 scoring: Ending is MASSIVE (up to 100pts)
                              timeInfo.status === 'ending' && event.type === 'sports' ? '80-100' :
                              timeInfo.status === 'ending' && event.type === 'concert' ? '60-80' :
                              timeInfo.status === 'ending' ? '50-70' :
                              timeInfo.status === 'live' && event.type === 'sports' ? '50-60' :
                              timeInfo.status === 'live' && event.type === 'concert' ? '40-45' :
                              timeInfo.status === 'live' ? '35-40' :
                              timeInfo.status === 'starting' ? '8-12' : 
                              '5'
                            } pts
                          </span>
                        </div>
                        
                        {/* Post-Event Decay Warning */}
                        {timeInfo.status === 'ending' && (
                          <div className="mt-2 text-xs text-gray-400 italic">
                            💡 Peak surge at ending, 60-min decay after
                          </div>
                        )}
                      </div>
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

