import { motion, AnimatePresence } from 'framer-motion';
import { Calendar, Clock, DollarSign, TrendingUp, Zap } from 'lucide-react';
import { useState } from 'react';
import { useTomorrowPrediction } from '../../hooks/useTomorrowPrediction';
import { DraggableCard } from '../UI/DraggableCard';

interface TomorrowPlannerCardProps {
  asPopup?: boolean;
  isOpen?: boolean;
  onClose?: () => void;
}

export function TomorrowPlannerCard({ asPopup = false, isOpen = true, onClose }: TomorrowPlannerCardProps) {
  const prediction = useTomorrowPrediction();
  const [internalOpen, setInternalOpen] = useState(true);

  if (!prediction) return null;

  const tomorrow = new Date(prediction.date);
  const dayName = tomorrow.toLocaleDateString('en-US', { weekday: 'long' });

  const handleClose = () => {
    if (onClose) {
      onClose();
    } else {
      setInternalOpen(false);
    }
  };

  const content = (
    <div className="p-4 space-y-4">
      {/* Best Start Time */}
      <div className="p-3 bg-gradient-to-r from-theme-primary/10 to-theme-accent/10 rounded-xl border border-theme-primary/30">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-theme-primary" />
            <span className="text-sm text-gray-300">Best Start Time</span>
          </div>
          <span className="text-2xl font-black text-theme-primary">
            {prediction.bestStartTime}
          </span>
        </div>
        <div className="text-xs text-gray-400">
          {prediction.peakHours[0]?.reason || 'Optimal for predicted demand'}
        </div>
      </div>

      {/* Estimated Earnings */}
      <div className="grid grid-cols-2 gap-3">
        <div className="p-3 bg-black/20 rounded-lg">
          <div className="flex items-center gap-2 mb-1">
            <DollarSign className="w-4 h-4 text-green-400" />
            <span className="text-xs text-gray-400">Estimated</span>
          </div>
          <div className="text-lg font-black text-white">
            ${prediction.estimatedEarningsLow}-{prediction.estimatedEarningsHigh}
          </div>
          <div className="text-xs text-gray-400">
            {prediction.recommendedShiftLength}hr shift
          </div>
        </div>

        <div className="p-3 bg-black/20 rounded-lg">
          <div className="flex items-center gap-2 mb-1">
            <TrendingUp className="w-4 h-4 text-blue-400" />
            <span className="text-xs text-gray-400">Avg Rate</span>
          </div>
          <div className="text-lg font-black text-white">
            ${Math.round((prediction.estimatedEarningsLow + prediction.estimatedEarningsHigh) / 2 / prediction.recommendedShiftLength)}/hr
          </div>
          <div className="text-xs text-gray-400">predicted</div>
        </div>
      </div>

      {/* Peak Hours Timeline */}
      <div>
        <div className="text-sm font-bold text-gray-300 mb-2 flex items-center gap-2">
          <Zap className="w-4 h-4 text-yellow-400" />
          Peak Hours
        </div>
        <div className="space-y-2">
          {prediction.peakHours.map((peak, idx) => (
            <div key={idx} className="flex items-center gap-3 p-2 bg-black/20 rounded-lg">
              <div className="font-bold text-theme-primary text-sm w-14">
                {peak.time}
              </div>
              <div className="flex-1">
                <div className="h-2 bg-black/40 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-theme-primary to-theme-accent rounded-full"
                    style={{ width: `${peak.score}%` }}
                  />
                </div>
              </div>
              <div className="text-xs text-gray-400 w-24 text-right truncate">
                {peak.reason}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  // Popup mode - uses DraggableCard
  if (asPopup) {
    const centerX = typeof window !== 'undefined' ? Math.max(16, (window.innerWidth - 380) / 2) : 100;
    const centerY = typeof window !== 'undefined' ? Math.max(80, (window.innerHeight - 450) / 2) : 100;

    return (
      <AnimatePresence>
        {(isOpen && internalOpen) && (
          <DraggableCard
            title={`Tomorrow's Plan (${dayName})`}
            icon={<Calendar className="w-5 h-5 text-theme-primary" />}
            isOpen={isOpen && internalOpen}
            onClose={handleClose}
            collapsible={true}
            resizable={true}
            draggable={true}
            defaultPosition={{ x: centerX, y: centerY }}
            defaultSize={{ width: Math.min(380, typeof window !== 'undefined' ? window.innerWidth - 32 : 380), height: 420 }}
            minSize={{ width: 300, height: 350 }}
            maxSize={{ width: 500, height: 600 }}
            zIndex={45}
          >
            {content}
          </DraggableCard>
        )}
      </AnimatePresence>
    );
  }

  // Inline mode - original card
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-strong rounded-2xl p-6 border border-theme-primary/20"
    >
      <div className="flex items-center gap-3 mb-4">
        <Calendar className="w-6 h-6 text-theme-primary" />
        <h3 className="text-xl font-black text-white">Tomorrow's Plan</h3>
        <span className="text-sm text-gray-400">({dayName})</span>
      </div>
      {content}
    </motion.div>
  );
}

