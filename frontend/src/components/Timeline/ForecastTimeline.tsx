import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, Clock } from 'lucide-react';
import { Forecast } from '../../types';
import { fetchForecast } from '../../lib/api';
import { useTheme } from '../../features/theme';

function formatHour(hour: number): string {
  if (hour === 0) return '12am';
  if (hour < 12) return `${hour}am`;
  if (hour === 12) return '12pm';
  return `${hour - 12}pm`;
}

function getScoreColor(score: number): string {
  if (score >= 80) return 'text-neon-pink';
  if (score >= 60) return 'text-neon-orange';
  if (score >= 40) return 'text-neon-cyan';
  return 'text-blue-400';
}

function getScoreBgColor(score: number): string {
  if (score >= 80) return 'bg-neon-pink/20 border-neon-pink/50';
  if (score >= 60) return 'bg-neon-orange/20 border-neon-orange/50';
  if (score >= 40) return 'bg-neon-cyan/20 border-neon-cyan/50';
  return 'bg-blue-500/20 border-blue-500/50';
}

export function ForecastTimeline() {
  const { tokens } = useTheme();
  const [forecast, setForecast] = useState<Forecast | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadForecast = async () => {
      try {
        const data = await fetchForecast();
        setForecast(data);
        setLoading(false);
      } catch (error) {
        console.error('Failed to load forecast:', error);
        setLoading(false);
      }
    };

    loadForecast();
  }, []);

  if (loading || !forecast) {
    return (
      <div className={`${tokens.cardBg} p-6 ${tokens.borderRadius} ${tokens.cardBorder}`}>
        <div className={`${tokens.textMuted} flex items-center gap-2`}>
          <Clock className="w-4 h-4 animate-spin" />
          Loading forecast...
        </div>
      </div>
    );
  }

  // Extract scores for sparkline
  const scores = forecast.points.map(p => p.topZones[0].score);
  const maxScore = Math.max(...scores);
  const minScore = Math.min(...scores);
  const scoreRange = maxScore - minScore || 1;

  // Create SVG path for sparkline
  const width = 100;
  const height = 40;
  const points = scores.map((score, i) => {
    const x = (i / (scores.length - 1)) * width;
    const y = height - ((score - minScore) / scoreRange) * height;
    return `${x},${y}`;
  }).join(' ');

  return (
    <div className={`${tokens.cardBg} ${tokens.borderRadius} p-6 ${tokens.cardBorder}`}>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-neon-cyan" />
          <h3 className="text-sm font-bold text-gray-300 uppercase tracking-widest">
            4-Hour Forecast
          </h3>
        </div>
        {/* Mini Sparkline */}
        <svg width={width} height={height} className="opacity-50">
          <polyline
            points={points}
            fill="none"
            stroke="url(#gradient)"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <defs>
            <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#00ffee" />
              <stop offset="100%" stopColor="#aa00ff" />
            </linearGradient>
          </defs>
        </svg>
      </div>

      {/* Horizontal Scrollable Timeline */}
      <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-thin">
        {forecast.points.map((point, index) => {
          const topZone = point.topZones[0];
          const colorClass = getScoreColor(topZone.score);
          const bgClass = getScoreBgColor(topZone.score);

          return (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="flex-shrink-0 w-40 glass rounded-xl p-4 border border-white/10 hover:border-neon-cyan/50 transition-all cursor-pointer"
            >
              {/* Time Label */}
              <div className="text-xs text-gray-400 font-medium mb-3 flex items-center justify-between">
                <span>+{index + 1}h</span>
                <span className="text-gray-500">{formatHour(point.hour)}</span>
              </div>

              {/* Zone Name */}
              <div className="text-sm font-bold text-white mb-2 truncate">
                {topZone.name}
              </div>

              {/* Score Badge */}
              <div className={`inline-flex items-center justify-center px-3 py-1 rounded-full border text-xs font-black ${bgClass} ${colorClass}`}>
                {topZone.score}
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Trend Indicator */}
      <div className="mt-4 flex items-center gap-2 text-xs text-gray-400">
        {scores[scores.length - 1] > scores[0] ? (
          <>
            <TrendingUp className="w-3 h-3 text-neon-green" />
            <span className="text-neon-green font-semibold">Trending Up</span>
          </>
        ) : (
          <>
            <TrendingUp className="w-3 h-3 rotate-180 text-neon-orange" />
            <span className="text-neon-orange font-semibold">Trending Down</span>
          </>
        )}
      </div>
    </div>
  );
}

