import { AnimatePresence } from 'framer-motion';
import { HelpCircle, TrendingUp, Music, CloudRain, Plane, Clock, Car } from 'lucide-react';
import { DraggableCard } from '../UI/DraggableCard';

interface ScoreLegendProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ScoreLegend({ isOpen, onClose }: ScoreLegendProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <DraggableCard
          isOpen={isOpen}
          onClose={onClose}
          title="How Scores Work"
          icon={<HelpCircle className="w-6 h-6 text-theme-primary" />}
          defaultSize={{ width: 600, height: 700 }}
          minSize={{ width: 320, height: 400 }}
          className="z-[60]"
        >
          <div className="p-6 md:p-8 space-y-6">
            {/* Intro */}
            <p className="text-gray-300 text-lg leading-relaxed">
              Your score (0-100) predicts ride demand in each zone. Higher scores mean more potential rides and better earnings.
            </p>

            {/* Score Components */}
            <div className="space-y-6">
              {/* Baseline */}
              <div className="glass rounded-2xl p-5 border border-white/10">
                <div className="flex items-center gap-3 mb-3">
                  <Clock className="w-6 h-6 text-blue-400" />
                  <h3 className="text-xl font-bold text-white">
                    Baseline (0-40 pts)
                  </h3>
                </div>
                <ul className="space-y-2 text-sm text-gray-300 ml-9">
                  <li>• Time of day patterns (rush hour, nightlife, etc.)</li>
                  <li>• Day of week (weekends vs weekdays)</li>
                  <li>• Historical demand data</li>
                </ul>
              </div>

              {/* Events */}
              <div className="glass rounded-2xl p-5 border border-neon-orange/30 bg-neon-orange/5">
                <div className="flex items-center gap-3 mb-3">
                  <Music className="w-6 h-6 text-neon-orange" />
                  <h3 className="text-xl font-bold text-white">
                    Events (+0-45 pts)
                  </h3>
                </div>
                <ul className="space-y-2 text-sm text-gray-300 ml-9">
                  <li className="font-semibold text-neon-orange">
                    • Sports games: +40 pts when ending (huge surge!)
                  </li>
                  <li className="font-semibold text-neon-orange">
                    • Concerts: +30 pts when ending
                  </li>
                  <li>• Conferences: +30 pts when starting</li>
                  <li>• General events: +15-25 pts</li>
                </ul>
              </div>

              {/* Weather */}
              <div className="glass rounded-2xl p-5 border border-blue-400/30 bg-blue-400/5">
                <div className="flex items-center gap-3 mb-3">
                  <CloudRain className="w-6 h-6 text-blue-400" />
                  <h3 className="text-xl font-bold text-white">
                    Weather (+0-23 pts)
                  </h3>
                </div>
                <ul className="space-y-2 text-sm text-gray-300 ml-9">
                  <li>• Currently raining: +15 pts</li>
                  <li>• Rain predicted soon: +8 pts</li>
                </ul>
              </div>

              {/* Flights */}
              <div className="glass rounded-2xl p-5 border border-neon-green/30 bg-neon-green/5">
                <div className="flex items-center gap-3 mb-3">
                  <Plane className="w-6 h-6 text-neon-green" />
                  <h3 className="text-xl font-bold text-white">
                    Flights (+0-25 pts)
                    <span className="text-sm text-gray-400 font-normal ml-2">[SeaTac only]</span>
                  </h3>
                </div>
                <ul className="space-y-2 text-sm text-gray-300 ml-9">
                  <li>• Each flight arriving in 30 min: +8 pts</li>
                  <li>• Each flight arriving in 60 min: +4 pts</li>
                </ul>
              </div>

              {/* Traffic */}
              <div className="glass rounded-2xl p-5 border border-yellow-400/30 bg-yellow-400/5">
                <div className="flex items-center gap-3 mb-3">
                  <Car className="w-6 h-6 text-yellow-400" />
                  <h3 className="text-xl font-bold text-white">
                    Traffic (+0-5 pts)
                  </h3>
                </div>
                <ul className="space-y-2 text-sm text-gray-300 ml-9">
                  <li>• Higher congestion = more ride demand</li>
                  <li>• People prefer rides over driving in traffic</li>
                </ul>
              </div>
            </div>

            {/* Score Colors */}
            <div className="glass-strong rounded-2xl p-6 border border-white/10">
              <div className="flex items-center gap-3 mb-4">
                <TrendingUp className="w-6 h-6 text-theme-primary" />
                <h3 className="text-xl font-bold text-white">Score Colors</h3>
              </div>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 rounded-xl bg-neon-pink/20 border border-neon-pink/50">
                  <span className="text-white font-bold">80-100: SURGE</span>
                  <span className="text-neon-pink font-black">🔥 Go now!</span>
                </div>
                <div className="flex items-center justify-between p-3 rounded-xl bg-neon-orange/20 border border-neon-orange/50">
                  <span className="text-white font-bold">60-79: HOT</span>
                  <span className="text-neon-orange font-bold">High demand</span>
                </div>
                <div className="flex items-center justify-between p-3 rounded-xl bg-theme-primary/20 border border-theme-primary/50">
                  <span className="text-white font-bold">40-59: WARM</span>
                  <span className="text-theme-primary font-semibold">Moderate</span>
                </div>
                <div className="flex items-center justify-between p-3 rounded-xl bg-blue-500/20 border border-blue-500/50">
                  <span className="text-white font-bold">0-39: COOL</span>
                  <span className="text-blue-400 font-semibold">Low demand</span>
                </div>
              </div>
            </div>

            {/* Formula */}
            <div className="mt-6 p-4 rounded-xl bg-gray-800/50 border border-gray-700">
              <div className="text-center text-sm text-gray-400 mb-2">Final Score Formula</div>
              <div className="text-center font-mono text-theme-primary font-bold">
                Baseline + Events + Weather + Flights + Traffic = Score (max 100)
              </div>
            </div>
          </div>
        </DraggableCard>
      )}
    </AnimatePresence>
  );
}

