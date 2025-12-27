import { useState } from 'react';
import { motion } from 'framer-motion';
import { Calendar, Clock, MapPin, DollarSign, Battery, Coffee, Zap } from 'lucide-react';

interface ShiftPlanSegment {
  startTime: string;
  endTime: string;
  zoneId: string;
  zoneName: string;
  coordinates: { lat: number; lng: number };
  expectedScore: number;
  activity: 'drive' | 'charge' | 'break';
  reason: string;
  estimatedEarnings?: number;
}

interface ShiftPlan {
  startTime: string;
  endTime: string;
  totalHours: number;
  segments: ShiftPlanSegment[];
  estimatedTotalEarnings: number;
  chargeStops: number;
  breakTime: number;
}

interface ShiftPlannerModalProps {
  currentLocation: { lat: number; lng: number };
  onClose?: () => void;
}

export function ShiftPlannerModal({ currentLocation, onClose }: ShiftPlannerModalProps) {
  const [plan, setPlan] = useState<ShiftPlan | null>(null);
  const [loading, setLoading] = useState(false);
  const [vehicleType, setVehicleType] = useState<'ev' | 'gas'>('gas');
  const [batteryPercent, setBatteryPercent] = useState(80);

  const generatePlan = async () => {
    setLoading(true);
    try {
      const now = new Date();
      const endTime = new Date(now.getTime() + 8 * 60 * 60 * 1000); // 8 hours from now

      const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/shift-planner`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          startTime: now.toISOString(),
          endTime: endTime.toISOString(),
          startingLocation: currentLocation,
          vehicleType,
          currentBatteryPercent: vehicleType === 'ev' ? batteryPercent : undefined,
          goals: ['max_earnings'],
        }),
      });

      const data = await response.json();
      setPlan(data);
    } catch (error) {
      console.error('Error generating shift plan:', error);
      alert('Failed to generate shift plan');
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (isoString: string) => {
    const date = new Date(isoString);
    return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  };

  const getActivityIcon = (activity: string) => {
    if (activity === 'charge') return <Zap className="w-5 h-5 text-green-400" />;
    if (activity === 'break') return <Coffee className="w-5 h-5 text-amber-400" />;
    return <MapPin className="w-5 h-5 text-cyan-400" />;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        className="bg-gray-900 rounded-2xl shadow-2xl max-w-3xl w-full max-h-[85vh] overflow-hidden border border-purple-500/30"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-600 to-pink-600 p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-white/20 p-3 rounded-xl">
                <Calendar className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white">AI Shift Planner</h2>
                <p className="text-purple-100 text-sm">Optimize your earnings with smart routing</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-white/80 hover:text-white transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        <div className="p-6 overflow-y-auto max-h-[calc(85vh-120px)]">
          {!plan ? (
            <div className="space-y-6">
              {/* Configuration */}
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Vehicle Type
                  </label>
                  <div className="flex gap-3">
                    <button
                      onClick={() => setVehicleType('gas')}
                      className={`flex-1 px-4 py-3 rounded-lg font-medium transition-all ${
                        vehicleType === 'gas'
                          ? 'bg-purple-600 text-white'
                          : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                      }`}
                    >
                      ⛽ Gas
                    </button>
                    <button
                      onClick={() => setVehicleType('ev')}
                      className={`flex-1 px-4 py-3 rounded-lg font-medium transition-all ${
                        vehicleType === 'ev'
                          ? 'bg-purple-600 text-white'
                          : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                      }`}
                    >
                      ⚡ Electric
                    </button>
                  </div>
                </div>

                {vehicleType === 'ev' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Current Battery: {batteryPercent}%
                    </label>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={batteryPercent}
                      onChange={(e) => setBatteryPercent(parseInt(e.target.value))}
                      className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-green-500"
                    />
                    <div className="flex justify-between text-xs text-gray-500 mt-1">
                      <span>0%</span>
                      <span>50%</span>
                      <span>100%</span>
                    </div>
                  </div>
                )}
              </div>

              <button
                onClick={generatePlan}
                disabled={loading}
                className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-bold py-4 px-6 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                    Generating Plan...
                  </>
                ) : (
                  <>
                    <Calendar className="w-5 h-5" />
                    Generate 8-Hour Shift Plan
                  </>
                )}
              </button>

              <div className="bg-gray-800 rounded-xl p-4 border border-gray-700">
                <h3 className="font-semibold text-white mb-2">What this does:</h3>
                <ul className="space-y-1 text-sm text-gray-300">
                  <li>✅ Optimizes zone routing for max earnings</li>
                  <li>✅ Includes break reminders every 4 hours</li>
                  <li>✅ Plans charging stops for EVs</li>
                  <li>✅ Targets high-demand time windows</li>
                  <li>✅ Estimates total earnings</li>
                </ul>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Summary */}
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-gradient-to-br from-green-600 to-emerald-600 rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-1">
                    <DollarSign className="w-5 h-5 text-white" />
                    <span className="text-sm text-green-100">Est. Earnings</span>
                  </div>
                  <p className="text-2xl font-bold text-white">
                    ${plan.estimatedTotalEarnings}
                  </p>
                </div>

                <div className="bg-gradient-to-br from-blue-600 to-cyan-600 rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-1">
                    <Clock className="w-5 h-5 text-white" />
                    <span className="text-sm text-blue-100">Total Hours</span>
                  </div>
                  <p className="text-2xl font-bold text-white">
                    {plan.totalHours.toFixed(1)}h
                  </p>
                </div>

                <div className="bg-gradient-to-br from-purple-600 to-pink-600 rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-1">
                    <Battery className="w-5 h-5 text-white" />
                    <span className="text-sm text-purple-100">Stops</span>
                  </div>
                  <p className="text-2xl font-bold text-white">
                    {plan.chargeStops} charge, {Math.round(plan.breakTime / 15)} breaks
                  </p>
                </div>
              </div>

              {/* Timeline */}
              <div className="space-y-3">
                <h3 className="font-semibold text-white text-lg">Your Shift Plan</h3>
                {plan.segments.map((segment, index) => (
                  <div
                    key={index}
                    className="bg-gray-800 rounded-xl p-4 border border-gray-700"
                  >
                    <div className="flex items-start gap-4">
                      <div className="flex-shrink-0">
                        {getActivityIcon(segment.activity)}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-semibold text-white">{segment.zoneName}</h4>
                          {segment.estimatedEarnings !== undefined && segment.estimatedEarnings > 0 && (
                            <span className="text-green-400 font-bold">
                              +${segment.estimatedEarnings}
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-gray-400 mb-2">
                          {formatTime(segment.startTime)} - {formatTime(segment.endTime)}
                        </p>
                        <p className="text-sm text-gray-300">{segment.reason}</p>
                        {segment.expectedScore > 0 && (
                          <div className="mt-2">
                            <span className="px-2 py-1 bg-cyan-500/20 text-cyan-400 text-xs font-medium rounded-full">
                              Score: {segment.expectedScore}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <button
                onClick={() => setPlan(null)}
                className="w-full bg-gray-800 hover:bg-gray-700 text-white font-medium py-3 px-6 rounded-xl transition-all"
              >
                Generate New Plan
              </button>
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}

