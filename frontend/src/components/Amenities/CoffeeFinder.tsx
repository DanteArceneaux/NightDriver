import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Coffee, Play, Pause, RotateCcw, Check } from 'lucide-react';

interface CoffeeFinderProps {
  currentLocation?: { lat: number; lng: number };
  onClose?: () => void;
}

export function CoffeeFinder({ onClose }: CoffeeFinderProps) {
  const BREAK_DURATION = 15 * 60; // 15 minutes in seconds
  const [timeRemaining, setTimeRemaining] = useState(BREAK_DURATION);
  const [isActive, setIsActive] = useState(false);
  const [isComplete, setIsComplete] = useState(false);

  useEffect(() => {
    let interval: NodeJS.Timeout;

    if (isActive && timeRemaining > 0) {
      interval = setInterval(() => {
        setTimeRemaining((time) => {
          if (time <= 1) {
            setIsActive(false);
            setIsComplete(true);
            // Play notification sound or show alert
            if ('Notification' in window && Notification.permission === 'granted') {
              new Notification('Break Complete!', {
                body: '15 minutes are up. Time to get back on the road!',
                icon: '/icon-192.png',
              });
            }
            return 0;
          }
          return time - 1;
        });
      }, 1000);
    }

    return () => clearInterval(interval);
  }, [isActive, timeRemaining]);

  const startBreak = () => {
    // Request notification permission if needed
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
    setIsActive(true);
    setIsComplete(false);
  };

  const pauseBreak = () => {
    setIsActive(false);
  };

  const resetBreak = () => {
    setIsActive(false);
    setTimeRemaining(BREAK_DURATION);
    setIsComplete(false);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const progress = ((BREAK_DURATION - timeRemaining) / BREAK_DURATION) * 100;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/70 backdrop-blur-md"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="bg-gray-900 rounded-2xl shadow-2xl max-w-md w-full overflow-hidden border border-amber-500/30"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-amber-600 to-orange-600 p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-white/20 p-3 rounded-xl">
                <Coffee className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white">15 Minute Break</h2>
                <p className="text-amber-100 text-sm">Rest & recharge</p>
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

        {/* Timer */}
        <div className="p-8">
          {/* Circular Progress */}
          <div className="relative w-64 h-64 mx-auto mb-8">
            <svg className="w-full h-full transform -rotate-90">
              <circle
                cx="128"
                cy="128"
                r="120"
                stroke="currentColor"
                strokeWidth="8"
                fill="none"
                className="text-gray-800"
              />
              <circle
                cx="128"
                cy="128"
                r="120"
                stroke="currentColor"
                strokeWidth="8"
                fill="none"
                strokeDasharray={`${2 * Math.PI * 120}`}
                strokeDashoffset={`${2 * Math.PI * 120 * (1 - progress / 100)}`}
                className="text-amber-500 transition-all duration-1000"
                strokeLinecap="round"
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                {isComplete ? (
                  <>
                    <Check className="w-16 h-16 text-green-400 mx-auto mb-2" />
                    <div className="text-2xl font-bold text-white">Break Complete!</div>
                  </>
                ) : (
                  <>
                    <div className="text-6xl font-black text-white tabular-nums">
                      {formatTime(timeRemaining)}
                    </div>
                    <div className="text-sm text-gray-400 mt-2">
                      {isActive ? 'Break in progress' : 'Ready to start'}
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Controls */}
          <div className="flex items-center justify-center gap-4">
            {!isComplete ? (
              <>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={isActive ? pauseBreak : startBreak}
                  className="flex items-center gap-2 px-8 py-4 bg-amber-600 hover:bg-amber-500 text-white rounded-xl font-bold text-lg transition-colors"
                >
                  {isActive ? (
                    <>
                      <Pause className="w-5 h-5" />
                      Pause
                    </>
                  ) : (
                    <>
                      <Play className="w-5 h-5 fill-white" />
                      Start Break
                    </>
                  )}
                </motion.button>

                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={resetBreak}
                  className="flex items-center gap-2 px-6 py-4 bg-gray-800 hover:bg-gray-700 text-white rounded-xl font-medium transition-colors"
                >
                  <RotateCcw className="w-5 h-5" />
                  Reset
                </motion.button>
              </>
            ) : (
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={resetBreak}
                className="flex items-center gap-2 px-8 py-4 bg-green-600 hover:bg-green-500 text-white rounded-xl font-bold text-lg transition-colors"
              >
                <RotateCcw className="w-5 h-5" />
                Start New Break
              </motion.button>
            )}
          </div>

          {/* Tips */}
          <div className="mt-6 p-4 bg-gray-800 rounded-xl border border-gray-700">
            <h3 className="text-sm font-bold text-amber-400 mb-2">💡 Break Tips</h3>
            <ul className="text-sm text-gray-300 space-y-1">
              <li>• Stretch your legs and walk around</li>
              <li>• Hydrate with water or coffee</li>
              <li>• Check your earnings and next zone</li>
              <li>• Rest your eyes from the screen</li>
            </ul>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

