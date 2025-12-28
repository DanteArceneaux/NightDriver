import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Zap, X } from 'lucide-react';

export interface SurgeAlertData {
  zoneId: string;
  zoneName: string;
  newScore: number;
  scoreDiff: number;
  reason: string;
}

interface SurgeAlertProps {
  surges: SurgeAlertData[];
}

export function SurgeAlert({ surges }: SurgeAlertProps) {
  const [visible, setVisible] = useState(false);
  const [currentSurge, setCurrentSurge] = useState<SurgeAlertData | null>(null);

  useEffect(() => {
    if (surges.length > 0) {
      setCurrentSurge(surges[0]);
      setVisible(true);
      playSurgeSound();
      triggerHapticFeedback();

      const timer = setTimeout(() => {
        setVisible(false);
      }, 10000);

      return () => clearTimeout(timer);
    }
  }, [surges]);

  const playSurgeSound = () => {
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      oscillator.frequency.value = 800;
      oscillator.type = 'sine';
      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.5);
    } catch (error) {
      console.error('Failed to play surge sound:', error);
    }
  };

  const triggerHapticFeedback = () => {
    if ('vibrate' in navigator) {
      navigator.vibrate([200, 100, 200]);
    }
  };

  return (
    <AnimatePresence>
      {visible && currentSurge && (
        <motion.div 
          initial={{ x: 100, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: 100, opacity: 0 }}
          className="fixed top-24 right-4 z-[60] w-[calc(100%-32px)] md:w-80"
        >
          <div className="bg-gradient-to-r from-red-600 to-orange-500 text-white rounded-2xl shadow-2xl p-4 border-2 border-red-400 relative overflow-hidden">
            <div className="relative z-10">
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 bg-white/20 rounded-lg text-yellow-300">
                    <Zap className="w-5 h-5 fill-current" />
                  </div>
                  <h3 className="text-xs font-black uppercase tracking-wider">Surge Alert</h3>
                </div>
                <button
                  onClick={() => setVisible(false)}
                  className="p-1 hover:bg-white/10 rounded-full transition-colors text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              
              <div className="space-y-1">
                <p className="text-lg font-black leading-tight uppercase truncate">{currentSurge.zoneName}</p>
                <div className="flex items-center gap-2">
                  <span className="text-2xl font-black text-white">{currentSurge.newScore}</span>
                  <span className="text-xs font-bold px-2 py-0.5 bg-black/20 rounded-full">
                    +{currentSurge.scoreDiff}
                  </span>
                </div>
                <p className="text-[10px] font-bold opacity-90 uppercase tracking-tighter pt-1 border-t border-white/10 truncate">
                  {currentSurge.reason}
                </p>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
