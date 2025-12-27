import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Battery, Zap } from 'lucide-react';

interface TeslaBatteryWidgetProps {
  onBatteryChange?: (percent: number) => void;
}

export function TeslaBatteryWidget({ onBatteryChange }: TeslaBatteryWidgetProps) {
  const [batteryPercent, setBatteryPercent] = useState(() => {
    const saved = localStorage.getItem('teslaBatteryPercent');
    return saved ? parseInt(saved) : 80;
  });
  const [showWidget, setShowWidget] = useState(false);
  const [vehicleType, setVehicleType] = useState<'ev' | 'gas'>(() => {
    const saved = localStorage.getItem('vehicleType');
    return (saved as 'ev' | 'gas') || 'gas';
  });

  useEffect(() => {
    localStorage.setItem('teslaBatteryPercent', batteryPercent.toString());
    localStorage.setItem('vehicleType', vehicleType);
    onBatteryChange?.(batteryPercent);
  }, [batteryPercent, vehicleType, onBatteryChange]);

  const getBatteryColor = () => {
    if (batteryPercent > 60) return 'text-green-400';
    if (batteryPercent > 30) return 'text-yellow-400';
    return 'text-red-400';
  };

  const getBatteryGradient = () => {
    if (batteryPercent > 60) return 'from-green-600 to-emerald-600';
    if (batteryPercent > 30) return 'from-yellow-600 to-orange-600';
    return 'from-red-600 to-pink-600';
  };

  const estimatedRange = Math.round((batteryPercent / 100) * 300); // Assume 300 mi max range

  if (vehicleType === 'gas') {
    return (
      <button
        onClick={() => setShowWidget(true)}
        className="fixed top-24 right-4 z-40 bg-gray-800/90 backdrop-blur-sm border border-gray-700 rounded-xl px-3 py-2 text-sm text-gray-400 hover:text-white hover:border-cyan-500/50 transition-all"
      >
        Switch to EV Mode
      </button>
    );
  }

  return (
    <>
      {/* Compact Battery Indicator */}
      <motion.button
        onClick={() => setShowWidget(!showWidget)}
        className={`fixed top-24 right-4 z-40 bg-gray-900/95 backdrop-blur-lg border rounded-xl px-4 py-3 shadow-lg transition-all ${
          showWidget ? 'border-green-500/50' : 'border-gray-700 hover:border-green-500/50'
        }`}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        <div className="flex items-center gap-3">
          <Battery className={`w-5 h-5 ${getBatteryColor()}`} />
          <div className="text-left">
            <div className={`text-lg font-bold ${getBatteryColor()}`}>
              {batteryPercent}%
            </div>
            <div className="text-xs text-gray-400">
              ~{estimatedRange} mi
            </div>
          </div>
        </div>
      </motion.button>

      {/* Expanded Widget */}
      {showWidget && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="fixed top-44 right-4 z-40 bg-gray-900/95 backdrop-blur-lg border border-green-500/30 rounded-2xl p-6 shadow-2xl w-80"
        >
          <div className={`bg-gradient-to-r ${getBatteryGradient()} rounded-xl p-4 mb-4`}>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Battery className="w-6 h-6 text-white" />
                <span className="text-white font-semibold">Tesla Battery</span>
              </div>
              <button
                onClick={() => setVehicleType('gas')}
                className="text-white/80 hover:text-white text-xs"
              >
                Switch to Gas
              </button>
            </div>
            <div className="text-3xl font-bold text-white mb-1">
              {batteryPercent}%
            </div>
            <div className="text-white/80 text-sm">
              Estimated range: {estimatedRange} miles
            </div>
          </div>

          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Current Battery Level
              </label>
              <input
                type="range"
                min="0"
                max="100"
                value={batteryPercent}
                onChange={(e) => setBatteryPercent(parseInt(e.target.value))}
                className="w-full h-3 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-green-500"
              />
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>0%</span>
                <span>50%</span>
                <span>100%</span>
              </div>
            </div>

            {batteryPercent < 30 && (
              <div className="bg-red-500/20 border border-red-500/30 rounded-lg p-3">
                <div className="flex items-center gap-2 mb-1">
                  <Zap className="w-4 h-4 text-red-400" />
                  <span className="text-sm font-semibold text-red-400">
                    Low Battery Warning
                  </span>
                </div>
                <p className="text-xs text-red-300">
                  Find a Supercharger soon. Tap the ⚡ button below to see nearby stations.
                </p>
              </div>
            )}

            <div className="bg-gray-800 rounded-lg p-3 text-xs text-gray-400">
              <p className="mb-2">
                💡 <strong className="text-white">Future:</strong> Connect your Tesla account for real-time battery data.
              </p>
              <p className="text-gray-500">
                For now, manually update your battery % as you drive.
              </p>
            </div>
          </div>
        </motion.div>
      )}
    </>
  );
}

