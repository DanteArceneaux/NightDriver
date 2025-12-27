import { useState, useEffect } from 'react';

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

      // Play sound
      playSurgeSound();

      // Haptic vibration
      triggerHapticFeedback();

      // Auto-hide after 10 seconds
      const timer = setTimeout(() => {
        setVisible(false);
      }, 10000);

      return () => clearTimeout(timer);
    }
  }, [surges]);

  // Play surge alert sound
  const playSurgeSound = () => {
    try {
      // Create a simple beep using Web Audio API
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      oscillator.frequency.value = 800; // Frequency in Hz
      oscillator.type = 'sine';

      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);

      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.5);

      // Second beep
      setTimeout(() => {
        const osc2 = audioContext.createOscillator();
        const gain2 = audioContext.createGain();
        osc2.connect(gain2);
        gain2.connect(audioContext.destination);
        osc2.frequency.value = 1000;
        osc2.type = 'sine';
        gain2.gain.setValueAtTime(0.3, audioContext.currentTime);
        gain2.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
        osc2.start(audioContext.currentTime);
        osc2.stop(audioContext.currentTime + 0.5);
      }, 200);
    } catch (error) {
      console.error('Failed to play surge sound:', error);
    }
  };

  // Trigger haptic feedback
  const triggerHapticFeedback = () => {
    if ('vibrate' in navigator) {
      // Pattern: vibrate for 200ms, pause 100ms, vibrate 200ms, pause 100ms, vibrate 300ms
      navigator.vibrate([200, 100, 200, 100, 300]);
    }
  };

  if (!visible || !currentSurge) return null;

  return (
    <div className="fixed top-20 left-4 right-4 md:left-auto md:right-4 md:w-96 z-50 animate-bounce">
      <div className="bg-gradient-to-r from-red-600 to-orange-500 text-white rounded-xl shadow-2xl p-4 border-2 border-red-400">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-2xl">🔥</span>
              <h3 className="text-lg font-bold">SURGE ALERT!</h3>
            </div>
            <p className="text-xl font-bold mb-1">{currentSurge.zoneName}</p>
            <p className="text-sm opacity-90 mb-2">
              Score jumped to {currentSurge.newScore} (+{currentSurge.scoreDiff})
            </p>
            <p className="text-xs opacity-75">{currentSurge.reason}</p>
          </div>
          <button
            onClick={() => setVisible(false)}
            className="text-white hover:text-gray-200 text-xl font-bold ml-2"
          >
            ×
          </button>
        </div>
      </div>
    </div>
  );
}

