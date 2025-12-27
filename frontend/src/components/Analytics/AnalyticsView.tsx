import { AnimatePresence } from 'framer-motion';
import { BarChart3 } from 'lucide-react';
import { useState } from 'react';
import { WeeklyRecap } from './WeeklyRecap';
import { ShiftHistory } from './ShiftHistory';
import { PerformanceView } from '../Trip/PerformanceView';
import { DraggableCard } from '../UI/DraggableCard';

interface AnalyticsViewProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AnalyticsView({ isOpen, onClose }: AnalyticsViewProps) {
  const [activeTab, setActiveTab] = useState<'weekly' | 'history' | 'performance'>('weekly');

  return (
    <AnimatePresence>
      {isOpen && (
        <DraggableCard
          isOpen={isOpen}
          onClose={onClose}
          title="Analytics"
          icon={<BarChart3 className="w-6 h-6 text-theme-primary" />}
          defaultSize={{ width: 800, height: 600 }}
          minSize={{ width: 400, height: 400 }}
          className="z-[60]"
        >
          <div className="flex flex-col h-full bg-gray-900/95">
            {/* Tabs */}
            <div className="flex gap-2 p-4 border-b border-white/10 overflow-x-auto">
              <button
                onClick={() => setActiveTab('weekly')}
                className={`flex-shrink-0 flex items-center gap-2 px-4 py-2 rounded-xl font-bold transition-all ${
                  activeTab === 'weekly'
                    ? 'bg-theme-primary/20 text-theme-primary border border-theme-primary/50'
                    : 'text-gray-400 hover:text-white hover:bg-white/5'
                }`}
              >
                Weekly Recap
              </button>
              <button
                onClick={() => setActiveTab('history')}
                className={`flex-shrink-0 flex items-center gap-2 px-4 py-2 rounded-xl font-bold transition-all ${
                  activeTab === 'history'
                    ? 'bg-theme-primary/20 text-theme-primary border border-theme-primary/50'
                    : 'text-gray-400 hover:text-white hover:bg-white/5'
                }`}
              >
                Shift History
              </button>
              <button
                onClick={() => setActiveTab('performance')}
                className={`flex-shrink-0 flex items-center gap-2 px-4 py-2 rounded-xl font-bold transition-all ${
                  activeTab === 'performance'
                    ? 'bg-theme-primary/20 text-theme-primary border border-theme-primary/50'
                    : 'text-gray-400 hover:text-white hover:bg-white/5'
                }`}
              >
                Performance
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6">
              {activeTab === 'weekly' && <WeeklyRecap />}
              {activeTab === 'history' && <ShiftHistory />}
              {activeTab === 'performance' && <PerformanceView />}
            </div>
          </div>
        </DraggableCard>
      )}
    </AnimatePresence>
  );
}

