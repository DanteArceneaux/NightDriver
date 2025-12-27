import { motion, AnimatePresence } from 'framer-motion';
import { X, DollarSign, Clock, MapPin, Plus } from 'lucide-react';
import { useState } from 'react';
import { useTripStore } from '../../features/trips';
import { zones } from '../../data/zones';

interface TripLoggerProps {
  isOpen: boolean;
  onClose: () => void;
}

export function TripLogger({ isOpen, onClose }: TripLoggerProps) {
  const { addTrip } = useTripStore();
  const [zoneId, setZoneId] = useState('');
  const [earnings, setEarnings] = useState('');
  const [duration, setDuration] = useState('');
  const [note, setNote] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!zoneId || !earnings || !duration) {
      alert('Please fill in all required fields');
      return;
    }

    addTrip({
      id: `trip-${Date.now()}`,
      timestamp: new Date().toISOString(),
      zoneId,
      actualEarnings: parseFloat(earnings),
      durationMinutes: parseInt(duration),
      note: note || undefined,
    });

    // Reset form
    setZoneId('');
    setEarnings('');
    setDuration('');
    setNote('');
    
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-full max-w-md z-50"
          >
            <form onSubmit={handleSubmit} className="glass-strong rounded-2xl border border-white/20 shadow-2xl m-4">
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b border-white/10">
                <div className="flex items-center gap-3">
                  <Plus className="w-6 h-6 text-neon-green" />
                  <h2 className="text-2xl font-black text-white uppercase tracking-wider">
                    Log Trip
                  </h2>
                </div>
                <button
                  type="button"
                  onClick={onClose}
                  className="p-2 hover:bg-white/10 rounded-xl transition-colors"
                >
                  <X className="w-6 h-6 text-gray-400" />
                </button>
              </div>

              {/* Form */}
              <div className="p-6 space-y-4">
                {/* Zone Selection */}
                <div>
                  <label className="flex items-center gap-2 text-sm font-bold text-white mb-2">
                    <MapPin className="w-4 h-4 text-purple-400" />
                    Zone *
                  </label>
                  <select
                    value={zoneId}
                    onChange={(e) => setZoneId(e.target.value)}
                    required
                    className="w-full px-4 py-3 bg-black/40 border border-white/20 rounded-xl text-white font-medium focus:border-neon-cyan focus:outline-none focus:ring-2 focus:ring-neon-cyan/30"
                  >
                    <option value="">Select a zone...</option>
                    {zones.map((zone) => (
                      <option key={zone.id} value={zone.id}>
                        {zone.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Earnings */}
                <div>
                  <label className="flex items-center gap-2 text-sm font-bold text-white mb-2">
                    <DollarSign className="w-4 h-4 text-neon-green" />
                    Actual Earnings *
                  </label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-neon-green font-bold">$</span>
                    <input
                      type="number"
                      step="0.01"
                      value={earnings}
                      onChange={(e) => setEarnings(e.target.value)}
                      placeholder="0.00"
                      required
                      className="w-full pl-8 pr-4 py-3 bg-black/40 border border-white/20 rounded-xl text-white font-medium focus:border-neon-cyan focus:outline-none focus:ring-2 focus:ring-neon-cyan/30"
                    />
                  </div>
                </div>

                {/* Duration */}
                <div>
                  <label className="flex items-center gap-2 text-sm font-bold text-white mb-2">
                    <Clock className="w-4 h-4 text-blue-400" />
                    Duration (minutes) *
                  </label>
                  <input
                    type="number"
                    value={duration}
                    onChange={(e) => setDuration(e.target.value)}
                    placeholder="30"
                    required
                    className="w-full px-4 py-3 bg-black/40 border border-white/20 rounded-xl text-white font-medium focus:border-neon-cyan focus:outline-none focus:ring-2 focus:ring-neon-cyan/30"
                  />
                </div>

                {/* Note */}
                <div>
                  <label className="text-sm font-bold text-white mb-2 block">
                    Note (optional)
                  </label>
                  <textarea
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    placeholder="Any notes about this trip..."
                    rows={2}
                    className="w-full px-4 py-3 bg-black/40 border border-white/20 rounded-xl text-white font-medium focus:border-neon-cyan focus:outline-none focus:ring-2 focus:ring-neon-cyan/30 resize-none"
                  />
                </div>

                {/* Submit Button */}
                <motion.button
                  type="submit"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="w-full px-6 py-4 bg-gradient-to-r from-neon-green to-neon-cyan rounded-xl text-black font-black text-lg uppercase tracking-wider shadow-lg hover:shadow-neon-green/50 transition-all"
                >
                  Log Trip
                </motion.button>
              </div>
            </form>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

