import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Battery, Zap, Car, Settings2, Info } from 'lucide-react';

export function VehicleCard() {
  const [batteryPercent, setBatteryPercent] = useState(() => {
    const saved = localStorage.getItem('teslaBatteryPercent');
    return saved ? parseInt(saved) : 80;
  });
  
  const [vehicleType, setVehicleType] = useState<'ev' | 'gas'>(() => {
    const saved = localStorage.getItem('vehicleType');
    return (saved as 'ev' | 'gas') || 'gas';
  });

  const [showSettings, setShowSettings] = useState(false);

  useEffect(() => {
    localStorage.setItem('teslaBatteryPercent', batteryPercent.toString());
    localStorage.setItem('vehicleType', vehicleType);
  }, [batteryPercent, vehicleType]);

  const getBatteryColor = () => {
    if (batteryPercent > 60) return 'text-green-400';
    if (batteryPercent > 30) return 'text-yellow-400';
    return 'text-red-400';
  };

  const getBatteryGradient = () => {
    if (batteryPercent > 60) return 'from-green-600/20 to-emerald-600/20 border-green-500/30';
    if (batteryPercent > 30) return 'from-yellow-600/20 to-orange-600/20 border-yellow-500/30';
    return 'from-red-600/20 to-pink-600/20 border-red-500/30';
  };

  const estimatedRange = Math.round((batteryPercent / 100) * 300);

  return (
    <div className="p-4 space-y-6 relative min-h-[200px]">
      {/* Settings Button */}
      <button 
        onClick={() => setShowSettings(!showSettings)}
        className="absolute top-4 right-4 z-10 p-2 bg-white/5 hover:bg-white/10 rounded-full border border-white/10 transition-all"
      >
        <Settings2 className="w-4 h-4 text-gray-400" />
      </button>

      {/* Mode Indicator */}
      <div className="flex items-center gap-3 mb-2">
        <div className={`p-2 rounded-xl ${vehicleType === 'ev' ? 'bg-green-500/20 text-green-400' : 'bg-blue-500/20 text-blue-400'}`}>
          <Car className="w-5 h-5" />
        </div>
        <div>
          <h3 className="text-lg font-black text-white uppercase leading-none">
            {vehicleType === 'ev' ? 'Tesla Model 3' : 'Standard Gas'}
          </h3>
          <span className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">
            Vehicle Profile
          </span>
        </div>
      </div>

      {vehicleType === 'ev' ? (
        <div className="space-y-6">
          {/* Battery Status */}
          <div className={`bg-gradient-to-br ${getBatteryGradient()} border rounded-2xl p-5 relative overflow-hidden`}>
            {/* Visual Battery Bar in background */}
            <div 
              className="absolute inset-y-0 left-0 bg-white/5 transition-all duration-1000"
              style={{ width: `${batteryPercent}%` }}
            />
            
            <div className="relative z-10 flex items-center justify-between">
              <div>
                <div className="text-4xl font-black text-white mb-1">
                  {batteryPercent}%
                </div>
                <div className="text-xs text-gray-400 font-bold uppercase tracking-wider">
                  Remaining Charge
                </div>
              </div>
              <div className="text-right">
                <div className="text-2xl font-black text-white mb-1">
                  ~{estimatedRange}<span className="text-xs text-gray-500 ml-1">mi</span>
                </div>
                <div className="text-xs text-gray-400 font-bold uppercase tracking-wider">
                  Estimated Range
                </div>
              </div>
            </div>
          </div>

          {/* Quick Range Slider */}
          <div className="space-y-3">
            <div className="flex justify-between items-center px-1">
              <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest flex items-center gap-1">
                <Battery className="w-3 h-3" /> Update Battery
              </span>
              <span className={`text-xs font-black ${getBatteryColor()}`}>{batteryPercent}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              value={batteryPercent}
              onChange={(e) => setBatteryPercent(parseInt(e.target.value))}
              className="w-full h-2 bg-white/5 rounded-lg appearance-none cursor-pointer accent-theme-primary transition-all hover:bg-white/10"
            />
          </div>

          {batteryPercent < 30 && (
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl flex items-start gap-3"
            >
              <Zap className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
              <div>
                <div className="text-xs font-black text-red-400 uppercase mb-1">Low Battery Warning</div>
                <p className="text-[10px] text-red-300 leading-tight">Find a charger soon to maintain your earnings pace. Tap the ⚡ icon in the footer.</p>
              </div>
            </motion.div>
          )}
        </div>
      ) : (
        <div className="py-8 text-center space-y-4">
          <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto border border-white/5">
            <Car className="w-8 h-8 text-gray-600" />
          </div>
          <div>
            <p className="text-sm text-gray-400 font-medium">Gas vehicle mode active.</p>
            <p className="text-[10px] text-gray-500 uppercase font-bold mt-1">Change settings to enable EV features</p>
          </div>
          <button 
            onClick={() => setVehicleType('ev')}
            className="px-6 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-xs font-black text-white uppercase transition-all"
          >
            Switch to EV Mode
          </button>
        </div>
      )}

      {/* Footer Info */}
      <div className="pt-2 flex items-center gap-2 text-[10px] text-gray-600 font-bold uppercase tracking-tighter">
        <Info className="w-3 h-3" />
        Connect your Tesla account coming in v5.1
      </div>

      {/* Settings Overlay */}
      <AnimatePresence>
        {showSettings && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-20 bg-slate-950/95 backdrop-blur-md rounded-[2.5rem] p-6 flex flex-col items-center justify-center"
          >
            <Settings2 className="w-10 h-10 text-theme-primary mb-4" />
            <h3 className="text-lg font-black text-white mb-6 uppercase">Vehicle Settings</h3>
            
            <div className="grid grid-cols-2 gap-4 w-full">
              <button
                onClick={() => { setVehicleType('gas'); setShowSettings(false); }}
                className={`p-4 rounded-2xl border-2 transition-all flex flex-col items-center gap-2 ${
                  vehicleType === 'gas' ? 'border-theme-primary bg-theme-primary/10' : 'border-white/10 hover:border-white/20'
                }`}
              >
                <Car className="w-6 h-6 text-blue-400" />
                <span className="text-xs font-black text-white uppercase">Gas</span>
              </button>
              <button
                onClick={() => { setVehicleType('ev'); setShowSettings(false); }}
                className={`p-4 rounded-2xl border-2 transition-all flex flex-col items-center gap-2 ${
                  vehicleType === 'ev' ? 'border-theme-primary bg-theme-primary/10' : 'border-white/10 hover:border-white/20'
                }`}
              >
                <Zap className="w-6 h-6 text-green-400" />
                <span className="text-xs font-black text-white uppercase">Tesla EV</span>
              </button>
            </div>
            
            <button 
              onClick={() => setShowSettings(false)}
              className="mt-8 text-xs text-gray-500 hover:text-white font-bold transition-colors uppercase tracking-widest"
            >
              Back to Status
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

