import { motion } from 'framer-motion';
import { Plus } from 'lucide-react';
import { useState } from 'react';
import { TripLogger } from './TripLogger';
import { useTheme } from '../../features/theme';

export function QuickLogButton() {
  const [showLogger, setShowLogger] = useState(false);
  const { id: themeId } = useTheme();

  // Don't show in Car Mode
  if (themeId === 'car') {
    return null;
  }

  return (
    <>
      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={() => setShowLogger(true)}
        className="fixed bottom-6 right-6 z-40 w-16 h-16 bg-gradient-to-r from-theme-primary to-theme-secondary rounded-full shadow-2xl flex items-center justify-center hover:shadow-theme-primary/50 transition-shadow"
        title="Log Trip"
      >
        <Plus className="w-8 h-8 text-black" strokeWidth={3} />
      </motion.button>

      <TripLogger isOpen={showLogger} onClose={() => setShowLogger(false)} />
    </>
  );
}

