import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Coffee, X, MapPin } from 'lucide-react';

interface BreakReminderProps {
  shiftStartTime?: Date;
}

export function BreakReminder({ shiftStartTime }: BreakReminderProps) {
  const [showReminder, setShowReminder] = useState(false);
  const [hoursWorked, setHoursWorked] = useState(0);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (!shiftStartTime || dismissed) return;

    const interval = setInterval(() => {
      const now = new Date();
      const elapsed = (now.getTime() - shiftStartTime.getTime()) / (1000 * 60 * 60);
      setHoursWorked(elapsed);

      // Show reminder every 4 hours
      if (elapsed >= 4 && elapsed % 4 < 0.017) { // ~1 minute window
        setShowReminder(true);
      }
    }, 60000); // Check every minute

    return () => clearInterval(interval);
  }, [shiftStartTime, dismissed]);

  const handleDismiss = () => {
    setShowReminder(false);
    setDismissed(true);
    
    // Reset dismissed state after 4 hours
    setTimeout(() => setDismissed(false), 4 * 60 * 60 * 1000);
  };

  const handleTakeBreak = () => {
    // Open bathroom/coffee finder
    setShowReminder(false);
    // TODO: Integrate with amenities finder
    alert('Opening break spot finder...');
  };

  return (
    <AnimatePresence>
      {showReminder && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className="fixed top-20 left-1/2 -translate-x-1/2 z-50 w-full max-w-md px-4"
        >
          <div className="bg-gradient-to-r from-amber-600 to-orange-600 rounded-2xl shadow-2xl p-6 border border-amber-400/30">
            <div className="flex items-start gap-4">
              <div className="bg-white/20 p-3 rounded-xl">
                <Coffee className="w-6 h-6 text-white" />
              </div>
              
              <div className="flex-1">
                <h3 className="text-xl font-bold text-white mb-1">
                  Time for a Break! ☕
                </h3>
                <p className="text-amber-100 text-sm mb-3">
                  You've been driving for {hoursWorked.toFixed(1)} hours. Take a 15-minute break to stay fresh and safe.
                </p>
                
                <div className="flex gap-2">
                  <button
                    onClick={handleTakeBreak}
                    className="flex-1 bg-white text-amber-600 font-semibold py-2 px-4 rounded-lg hover:bg-amber-50 transition-colors flex items-center justify-center gap-2"
                  >
                    <MapPin className="w-4 h-4" />
                    Find Break Spot
                  </button>
                  <button
                    onClick={handleDismiss}
                    className="bg-white/20 hover:bg-white/30 text-white p-2 rounded-lg transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}








