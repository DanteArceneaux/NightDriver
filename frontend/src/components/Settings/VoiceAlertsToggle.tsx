import { motion } from 'framer-motion';
import { Volume2, VolumeX } from 'lucide-react';
import { useState, useEffect } from 'react';
import { voiceAlerts } from '../../lib/voiceAlerts';

export function VoiceAlertsToggle() {
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    setEnabled(voiceAlerts.isEnabled());
  }, []);

  const toggleVoiceAlerts = () => {
    if (enabled) {
      voiceAlerts.disable();
      setEnabled(false);
    } else {
      voiceAlerts.enable();
      setEnabled(true);
      // Test voice
      voiceAlerts.speak('Voice alerts enabled', 'normal');
    }
  };

  return (
    <motion.button
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      onClick={toggleVoiceAlerts}
      className={`flex items-center gap-3 px-4 py-3 rounded-xl border-2 transition-all ${
        enabled
          ? 'bg-neon-green/20 border-neon-green/50 text-neon-green'
          : 'bg-gray-800/50 border-gray-700 text-gray-400'
      }`}
    >
      {enabled ? (
        <>
          <Volume2 className="w-5 h-5" />
          <span className="font-bold">Voice Alerts ON</span>
        </>
      ) : (
        <>
          <VolumeX className="w-5 h-5" />
          <span className="font-bold">Voice Alerts OFF</span>
        </>
      )}
    </motion.button>
  );
}

