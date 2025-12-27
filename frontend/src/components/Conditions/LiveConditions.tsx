import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { CloudRain, Music, Plane, Droplets, Activity } from 'lucide-react';
import { Conditions } from '../../types';
import { fetchConditions } from '../../lib/api';
import { useTheme } from '../../features/theme';

export function LiveConditions() {
  const { tokens } = useTheme();
  const [conditions, setConditions] = useState<Conditions | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadConditions = async () => {
      try {
        const data = await fetchConditions();
        setConditions(data);
        setLoading(false);
      } catch (error) {
        console.error('Failed to load conditions:', error);
        setLoading(false);
      }
    };

    loadConditions();
    const interval = setInterval(loadConditions, 300000); // Refresh every 5 minutes

    return () => clearInterval(interval);
  }, []);

  if (loading || !conditions) {
    return null;
  }

  const pills = [
    {
      icon: CloudRain,
      label: 'Weather',
      value: `${conditions.weather.temperature}°F`,
      subtitle: conditions.weather.description,
      color: 'text-blue-400',
      bg: 'bg-blue-500/20'
    },
  ];

  if (conditions.weather.rainPrediction) {
    pills.push({
      icon: Droplets,
      label: 'Rain',
      value: conditions.weather.rainPrediction.split(' ')[0],
      subtitle: 'predicted',
      color: 'text-cyan-400',
      bg: 'bg-cyan-500/20'
    });
  }

  if (conditions.events.length > 0) {
    pills.push({
      icon: Music,
      label: 'Events',
      value: conditions.events.length.toString(),
      subtitle: conditions.events[0].name.slice(0, 30) + (conditions.events[0].name.length > 30 ? '...' : ''),
      color: 'text-neon-orange',
      bg: 'bg-neon-orange/20'
    });
  }

  if (conditions.flights.length > 0) {
    pills.push({
      icon: Plane,
      label: 'Flights',
      value: conditions.flights.length.toString(),
      subtitle: 'arrivals',
      color: 'text-neon-green',
      bg: 'bg-neon-green/20'
    });
  }

  return (
    <div className={`${tokens.cardBg} ${tokens.borderRadius} p-6 ${tokens.cardBorder}`}>
      <div className="flex items-center gap-2 mb-4">
        <Activity className="w-5 h-5 text-neon-green" />
        <h3 className="text-sm font-bold text-gray-300 uppercase tracking-widest">
          Live Conditions
        </h3>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {pills.map((pill, idx) => (
          <motion.div
            key={idx}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: idx * 0.1 }}
            className={`glass rounded-xl p-4 border border-white/10 ${pill.bg}`}
          >
            <div className="flex items-start gap-3">
              <pill.icon className={`w-6 h-6 ${pill.color} flex-shrink-0`} />
              <div className="flex-1 min-w-0">
                <div className="text-xs text-gray-400 font-medium mb-1 uppercase tracking-wider">
                  {pill.label}
                </div>
                <div className={`text-2xl font-black ${pill.color} mb-1`}>
                  {pill.value}
                </div>
                <div className="text-xs text-gray-400 line-clamp-2">
                  {pill.subtitle}
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

