import { motion } from 'framer-motion';
import { AlertTriangle, Zap, Clock, Car, Volume2 } from 'lucide-react';
import { useState } from 'react';
import { getBackendUrl, isStaticHost } from '../../lib/api';

interface PulseReporterProps {
  zoneId: string;
  zoneName: string;
  onClose: () => void;
}

type PulseType = 'airport_full' | 'surge_fake' | 'traffic_bad' | 'high_demand' | 'quiet';

const pulseOptions: Array<{
  type: PulseType;
  label: string;
  description: string;
  icon: React.ReactNode;
  color: string;
}> = [
  {
    type: 'high_demand',
    label: 'High Demand 🔥',
    description: 'Lots of riders, good money',
    icon: <Zap className="w-6 h-6" />,
    color: 'from-green-600 to-green-800 border-green-400',
  },
  {
    type: 'airport_full',
    label: 'Airport Queue Full ✈️',
    description: 'Long wait, avoid for now',
    icon: <Clock className="w-6 h-6" />,
    color: 'from-orange-600 to-orange-800 border-orange-400',
  },
  {
    type: 'traffic_bad',
    label: 'Traffic Hell 🚗',
    description: 'Gridlock, low $/hr',
    icon: <Car className="w-6 h-6" />,
    color: 'from-red-600 to-red-800 border-red-400',
  },
  {
    type: 'surge_fake',
    label: 'Fake Surge ❌',
    description: 'No actual demand',
    icon: <AlertTriangle className="w-6 h-6" />,
    color: 'from-purple-600 to-purple-800 border-purple-400',
  },
  {
    type: 'quiet',
    label: 'Dead Quiet 💤',
    description: 'No rides here',
    icon: <Volume2 className="w-6 h-6" />,
    color: 'from-gray-600 to-gray-800 border-gray-400',
  },
];

export function PulseReporter({ zoneId, zoneName, onClose }: PulseReporterProps) {
  const [submitting, setSubmitting] = useState(false);

  const handleReport = async (type: PulseType) => {
    setSubmitting(true);
    try {
      // Skip API call on static hosts - just simulate success
      if (isStaticHost) {
        console.log(`[Demo] Pulse reported: ${type} for ${zoneName}`);
        onClose();
        return;
      }
      
      const backendUrl = getBackendUrl();
      if (!backendUrl) {
        console.log(`[Demo] Pulse reported: ${type} for ${zoneName}`);
        onClose();
        return;
      }
      
      const response = await fetch(`${backendUrl}/api/pulse/report`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ zoneId, type }),
      });

      if (response.ok) {
        console.log(`Pulse reported: ${type} for ${zoneName}`);
        onClose();
      }
    } catch (error) {
      console.error('Failed to report pulse:', error);
      // On error, still close for better UX
      onClose();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="p-4">
      <h3 className="text-lg font-bold text-white mb-2">
        Report Ground Truth for {zoneName}
      </h3>
      <p className="text-sm text-gray-400 mb-4">
        Help improve predictions by reporting actual conditions
      </p>

      <div className="grid grid-cols-1 gap-3">
        {pulseOptions.map((option) => (
          <motion.button
            key={option.type}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => handleReport(option.type)}
            disabled={submitting}
            className={`flex items-center gap-3 p-4 rounded-xl bg-gradient-to-r ${option.color} border-2 text-white hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            <div className="flex-shrink-0">{option.icon}</div>
            <div className="flex-1 text-left">
              <div className="font-bold text-base">{option.label}</div>
              <div className="text-xs opacity-90">{option.description}</div>
            </div>
          </motion.button>
        ))}
      </div>
    </div>
  );
}

