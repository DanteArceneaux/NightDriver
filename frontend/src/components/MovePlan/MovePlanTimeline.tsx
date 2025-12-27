import { motion } from 'framer-motion';
import { Clock, TrendingUp, MapPin, Calendar } from 'lucide-react';
import type { ZoneScore, Event } from '../../types';
import { useTheme } from '../../features/theme';

interface MovePlanStep {
  time: string;
  zone: ZoneScore;
  reason: string;
  duration: string;
  estimatedEarnings: number;
}

interface MovePlanTimelineProps {
  zones: ZoneScore[];
  events: Event[];
}

export function MovePlanTimeline({ zones, events }: MovePlanTimelineProps) {
  const { tokens } = useTheme();

  // Generate a 4-hour move plan based on events and zone scores
  const generateMovePlan = (): MovePlanStep[] => {
    const now = new Date();
    const steps: MovePlanStep[] = [];

    // Sort zones by score
    const topZones = [...zones].sort((a, b) => b.score - a.score).slice(0, 5);

    // Find events ending in the next 4 hours
    const upcomingEventEndings = events
      .filter(event => {
        const endTime = new Date(event.endTime);
        const hoursUntilEnd = (endTime.getTime() - now.getTime()) / (1000 * 60 * 60);
        return hoursUntilEnd > 0 && hoursUntilEnd <= 4;
      })
      .sort((a, b) => new Date(a.endTime).getTime() - new Date(b.endTime).getTime());

    // Build plan
    let currentTime = new Date(now);

    // Step 1: Start with highest score zone
    if (topZones.length > 0) {
      steps.push({
        time: currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        zone: topZones[0],
        reason: 'Highest current demand',
        duration: upcomingEventEndings.length > 0 ? 'Until next event' : '1 hour',
        estimatedEarnings: topZones[0].estimatedHourlyRate || 0,
      });

      if (upcomingEventEndings.length > 0) {
        currentTime = new Date(upcomingEventEndings[0].endTime);
      } else {
        currentTime = new Date(currentTime.getTime() + 60 * 60 * 1000); // +1 hour
      }
    }

    // Step 2-4: Move to event zones as they end
    for (let i = 0; i < Math.min(upcomingEventEndings.length, 3); i++) {
      const event = upcomingEventEndings[i];
      const eventZone = zones.find(z => z.id === event.zoneId);
      
      if (eventZone) {
        steps.push({
          time: new Date(event.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          zone: eventZone,
          reason: `${event.name} ending - pickup surge`,
          duration: i < upcomingEventEndings.length - 1 ? 'Until next event' : '30 min',
          estimatedEarnings: (eventZone.estimatedHourlyRate || 0) * 1.3, // 30% boost for post-event
        });

        if (i < upcomingEventEndings.length - 1) {
          currentTime = new Date(upcomingEventEndings[i + 1].endTime);
        }
      }
    }

    // Fill remaining time with high-score zones
    while (steps.length < 4 && topZones.length > steps.length) {
      const nextZone = topZones[steps.length];
      currentTime = new Date(currentTime.getTime() + 45 * 60 * 1000); // +45 min

      if (currentTime.getTime() - now.getTime() <= 4 * 60 * 60 * 1000) {
        steps.push({
          time: currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          zone: nextZone,
          reason: 'High demand zone',
          duration: '45 min',
          estimatedEarnings: nextZone.estimatedHourlyRate || 0,
        });
      }
    }

    return steps.slice(0, 4);
  };

  const movePlan = generateMovePlan();

  if (movePlan.length === 0) {
    return null;
  }

  const totalEstimatedEarnings = movePlan.reduce((sum, step) => sum + step.estimatedEarnings, 0);

  return (
    <div className={`${tokens.cardBg} ${tokens.borderRadius} p-6 ${tokens.cardBorder}`}>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Calendar className="w-6 h-6 text-neon-cyan" />
          <h3 className={`text-lg ${tokens.fontDisplay} ${tokens.primaryText}`}>
            4-Hour Move Plan
          </h3>
        </div>
        <div className="text-right">
          <div className="text-2xl font-black text-neon-green">
            ${totalEstimatedEarnings.toFixed(0)}
          </div>
          <div className="text-xs text-gray-400">Potential Earnings</div>
        </div>
      </div>

      <div className="space-y-4">
        {movePlan.map((step, idx) => (
          <motion.div
            key={idx}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: idx * 0.1 }}
            className={`${tokens.glassBg} ${tokens.borderRadius} p-4 ${tokens.glassBorder} relative`}
          >
            {/* Timeline connector */}
            {idx < movePlan.length - 1 && (
              <div className="absolute left-8 top-full w-0.5 h-4 bg-neon-cyan/30" />
            )}

            <div className="flex items-start gap-4">
              {/* Step number */}
              <div className="flex-shrink-0">
                <div className="w-12 h-12 rounded-full bg-neon-cyan/20 border-2 border-neon-cyan flex items-center justify-center">
                  <span className="text-xl font-black text-neon-cyan">{idx + 1}</span>
                </div>
              </div>

              {/* Content */}
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <Clock className="w-4 h-4 text-gray-400" />
                  <span className="text-sm font-mono text-gray-300">{step.time}</span>
                  <span className="text-xs text-gray-500">• {step.duration}</span>
                </div>

                <div className="flex items-center gap-2 mb-2">
                  <MapPin className="w-5 h-5 text-neon-cyan" />
                  <span className="text-lg font-bold text-white">{step.zone.name}</span>
                  <span className={`px-2 py-1 rounded-lg text-xs font-bold ${
                    step.zone.score >= 80 ? 'bg-neon-pink/20 text-neon-pink' :
                    step.zone.score >= 60 ? 'bg-neon-orange/20 text-neon-orange' :
                    'bg-neon-cyan/20 text-neon-cyan'
                  }`}>
                    {step.zone.score}
                  </span>
                </div>

                <div className="text-sm text-gray-400 mb-2">
                  {step.reason}
                </div>

                <div className="flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-neon-green" />
                  <span className="text-sm font-bold text-neon-green">
                    ${step.estimatedEarnings.toFixed(0)}/hr
                  </span>
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="mt-6 p-4 bg-neon-cyan/10 rounded-xl border border-neon-cyan/30">
        <p className="text-sm text-gray-300 text-center">
          💡 <span className="font-bold">Pro Tip:</span> Follow this plan to maximize earnings during your shift
        </p>
      </div>
    </div>
  );
}

