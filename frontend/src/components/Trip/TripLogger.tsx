import { motion, AnimatePresence } from 'framer-motion';
import { DollarSign, Clock, MapPin, Plus } from 'lucide-react';
import { useState } from 'react';
import { useTripStore } from '../../features/trips';
import { DraggableCard } from '../UI/DraggableCard';

interface TripLoggerProps {
  isOpen: boolean;
  onClose: () => void;
  zones: Array<{ id: string; name: string }>;
}

export function TripLogger({ isOpen, onClose, zones }: TripLoggerProps) {
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

  // Center position for modal
  const centerX = typeof window !== 'undefined' ? Math.max(16, (window.innerWidth - 400) / 2) : 100;
  const centerY = typeof window !== 'undefined' ? Math.max(50, (window.innerHeight - 500) / 2) : 100;

  // Sort zones for faster scanning in the dropdown (micro-zones are numerous)
  const sortedZones = [...zones].sort((a, b) => a.name.localeCompare(b.name));

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

          {/* Draggable Trip Logger */}
          <DraggableCard
            title="Log Trip"
            icon={<Plus className="w-5 h-5 text-theme-accent" />}
            isOpen={isOpen}
            onClose={onClose}
            collapsible={true}
            resizable={true}
            draggable={true}
            defaultPosition={{ x: centerX, y: centerY }}
            defaultSize={{ width: Math.min(400, typeof window !== 'undefined' ? window.innerWidth - 32 : 400), height: 480 }}
            minSize={{ width: 320, height: 400 }}
            maxSize={{ width: 500, height: 600 }}
            zIndex={60}
          >
            <form onSubmit={handleSubmit} className="p-4 space-y-4">
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
                  className="w-full px-4 py-3 bg-black/40 border border-white/20 rounded-xl text-white font-medium focus:border-theme-primary focus:outline-none focus:ring-2 focus:ring-neon-cyan/30"
                >
                  <option value="">Select a zone...</option>
                  {sortedZones.map((zone) => (
                    <option key={zone.id} value={zone.id}>
                      {zone.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Earnings */}
              <div>
                <label className="flex items-center gap-2 text-sm font-bold text-white mb-2">
                  <DollarSign className="w-4 h-4 text-theme-accent" />
                  Actual Earnings *
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-theme-accent font-bold">$</span>
                  <input
                    type="number"
                    step="0.01"
                    value={earnings}
                    onChange={(e) => setEarnings(e.target.value)}
                    placeholder="0.00"
                    required
                    className="w-full pl-8 pr-4 py-3 bg-black/40 border border-white/20 rounded-xl text-white font-medium focus:border-theme-primary focus:outline-none focus:ring-2 focus:ring-neon-cyan/30"
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
                  className="w-full px-4 py-3 bg-black/40 border border-white/20 rounded-xl text-white font-medium focus:border-theme-primary focus:outline-none focus:ring-2 focus:ring-neon-cyan/30"
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
                  className="w-full px-4 py-3 bg-black/40 border border-white/20 rounded-xl text-white font-medium focus:border-theme-primary focus:outline-none focus:ring-2 focus:ring-neon-cyan/30 resize-none"
                />
              </div>

              {/* Submit Button */}
              <motion.button
                type="submit"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="w-full px-6 py-4 bg-gradient-to-r from-theme-primary to-theme-secondary rounded-xl text-black font-black text-lg uppercase tracking-wider shadow-lg hover:shadow-theme-primary/50 transition-all"
              >
                Log Trip
              </motion.button>
            </form>
          </DraggableCard>
        </>
      )}
    </AnimatePresence>
  );
}

