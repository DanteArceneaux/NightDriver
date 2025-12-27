import { motion, AnimatePresence } from 'framer-motion';
import { X, BarChart3 } from 'lucide-react';
import { useState } from 'react';
import { WeeklyRecap } from './WeeklyRecap';
import { ShiftHistory } from './ShiftHistory';
import { PerformanceView } from '../Trip/PerformanceView';

interface AnalyticsViewProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AnalyticsView({ isOpen, onClose }: AnalyticsViewProps) {
  const [activeTab, setActiveTab] = useState<'weekly' | 'history' | 'performance'>('weekly');

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
            className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-full max-w-4xl max-h-[90vh] overflow-y-auto z-50"
          >
            <div className="glass-strong rounded-2xl border border-white/20 shadow-2xl m-4">
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b border-white/10">
                <div className="flex items-center gap-3">
                  <BarChart3 className="w-6 h-6 text-neon-cyan" />
                  <h2 className="text-2xl font-black text-white uppercase tracking-wider">
                    Analytics
                  </h2>
                </div>
                <button
                  onClick={onClose}
                  className="p-2 hover:bg-white/10 rounded-xl transition-colors"
                >
                  <X className="w-6 h-6 text-gray-400" />
                </button>
              </div>

              {/* Tabs */}
              <div className="flex gap-2 p-4 border-b border-white/10">
                <button
                  onClick={() => setActiveTab('weekly')}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold transition-all ${
                    activeTab === 'weekly'
                      ? 'bg-neon-cyan/20 text-neon-cyan border border-neon-cyan/50'
                      : 'text-gray-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  Weekly Recap
                </button>
                <button
                  onClick={() => setActiveTab('history')}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold transition-all ${
                    activeTab === 'history'
                      ? 'bg-neon-cyan/20 text-neon-cyan border border-neon-cyan/50'
                      : 'text-gray-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  Shift History
                </button>
                <button
                  onClick={() => setActiveTab('performance')}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold transition-all ${
                    activeTab === 'performance'
                      ? 'bg-neon-cyan/20 text-neon-cyan border border-neon-cyan/50'
                      : 'text-gray-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  Performance
                </button>
              </div>

              {/* Content */}
              <div className="p-6">
                {activeTab === 'weekly' && <WeeklyRecap />}
                {activeTab === 'history' && <ShiftHistory />}
                {activeTab === 'performance' && <PerformanceView />}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

