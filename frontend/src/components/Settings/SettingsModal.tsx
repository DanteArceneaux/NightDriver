import { motion, AnimatePresence } from 'framer-motion';
import { Palette, Bell, Heart, DollarSign, Volume2, Wifi, Settings } from 'lucide-react';
import { useState } from 'react';
import { useSettingsStore } from '../../features/settings/store';
import { useTheme } from '../../features/theme';
import { DraggableCard } from '../UI/DraggableCard';
import type { ColorScheme } from '../../features/settings/types';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
  const settings = useSettingsStore();
  const { id: currentThemeId } = useTheme();
  const [activeTab, setActiveTab] = useState<'appearance' | 'alerts' | 'preferences'>('appearance');

  const colorSchemes: Array<{ id: ColorScheme; name: string; preview: string }> = [
    { id: 'default', name: 'Default', preview: 'bg-gradient-to-r from-cyan-500 to-purple-500' },
    { id: 'blue', name: 'Ocean Blue', preview: 'bg-gradient-to-r from-blue-500 to-blue-700' },
    { id: 'purple', name: 'Royal Purple', preview: 'bg-gradient-to-r from-purple-500 to-purple-700' },
    { id: 'green', name: 'Forest Green', preview: 'bg-gradient-to-r from-green-500 to-green-700' },
    { id: 'orange', name: 'Sunset Orange', preview: 'bg-gradient-to-r from-orange-500 to-orange-700' },
    { id: 'red', name: 'Crimson Red', preview: 'bg-gradient-to-r from-red-500 to-red-700' },
  ];

  const getCurrentColorScheme = (): ColorScheme => {
    switch (currentThemeId) {
      case 'dream':
        return settings.proColorScheme; // Dream uses pro color scheme in v8.0
      // 'neon' case removed in v8.0
      case 'pro':
        return settings.proColorScheme;
      case 'car':
        return settings.carColorScheme;
      default:
        return 'default';
    }
  };

  const setColorScheme = (scheme: ColorScheme) => {
    settings.setColorScheme(currentThemeId, scheme);
  };

  // Center position for modal
  const centerX = typeof window !== 'undefined' ? (window.innerWidth - Math.min(600, window.innerWidth - 32)) / 2 : 0;
  const centerY = typeof window !== 'undefined' ? Math.max(50, (window.innerHeight - 600) / 2) : 50;

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

          {/* Draggable Settings Panel */}
          <DraggableCard
            title="Settings"
            icon={<Settings className="w-5 h-5 text-theme-primary" />}
            isOpen={isOpen}
            onClose={onClose}
            collapsible={true}
            resizable={true}
            draggable={true}
            defaultPosition={{ x: centerX, y: centerY }}
            defaultSize={{ width: Math.min(600, typeof window !== 'undefined' ? window.innerWidth - 32 : 600), height: 500 }}
            minSize={{ width: 320, height: 300 }}
            maxSize={{ width: 800, height: 700 }}
            zIndex={60}
          >
            {/* Tabs */}
            <div className="flex flex-wrap gap-2 p-3 border-b border-white/10 bg-black/20">
              {[
                { id: 'appearance', label: 'Appearance', icon: Palette },
                { id: 'alerts', label: 'Alerts', icon: Bell },
                { id: 'preferences', label: 'Preferences', icon: Heart },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg font-bold text-sm transition-all ${
                    activeTab === tab.id
                      ? 'bg-theme-primary/20 text-theme-primary border border-theme-primary/50'
                      : 'text-gray-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <tab.icon className="w-4 h-4" />
                  <span className="hidden sm:inline">{tab.label}</span>
                </button>
              ))}
            </div>

            {/* Content */}
            <div className="p-4 space-y-4 overflow-y-auto max-h-[calc(100%-60px)]">
              {/* Appearance Tab */}
              {activeTab === 'appearance' && (
                <div>
                  <h3 className="text-base font-bold text-white mb-3 flex items-center gap-2">
                    <Palette className="w-4 h-4 text-theme-primary" />
                    Color Scheme
                  </h3>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {colorSchemes.map((scheme) => (
                      <motion.button
                        key={scheme.id}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => setColorScheme(scheme.id)}
                        className={`p-3 rounded-xl border-2 transition-all ${
                          getCurrentColorScheme() === scheme.id
                            ? 'border-theme-primary bg-theme-primary/10'
                            : 'border-white/10 hover:border-white/30'
                        }`}
                      >
                        <div className={`w-full h-8 rounded-lg mb-2 ${scheme.preview}`} />
                        <div className="text-xs font-bold text-white">{scheme.name}</div>
                      </motion.button>
                    ))}
                  </div>
                </div>
              )}

              {/* Alerts Tab */}
              {activeTab === 'alerts' && (
                <div className="space-y-4">
                  <h3 className="text-base font-bold text-white mb-3 flex items-center gap-2">
                    <Bell className="w-4 h-4 text-theme-primary" />
                    Alert Settings
                  </h3>
                  
                  {/* Voice Alerts */}
                  <div className="flex items-center justify-between p-3 glass rounded-xl">
                    <div className="flex items-center gap-3">
                      <Volume2 className="w-5 h-5 text-blue-400" />
                      <div>
                        <div className="font-bold text-white text-sm">Voice Alerts</div>
                        <div className="text-xs text-gray-400">Spoken notifications</div>
                      </div>
                    </div>
                    <button
                      onClick={() => settings.updateSettings({ voiceAlerts: !settings.voiceAlerts })}
                      className={`w-12 h-6 rounded-full transition-colors ${
                        settings.voiceAlerts ? 'bg-theme-primary' : 'bg-gray-600'
                      }`}
                    >
                      <div className={`w-5 h-5 bg-white rounded-full transform transition-transform ${
                        settings.voiceAlerts ? 'translate-x-6' : 'translate-x-0.5'
                      }`} />
                    </button>
                  </div>

                  {/* Surge Threshold */}
                  <div className="p-3 glass rounded-xl">
                    <label className="block font-bold text-white text-sm mb-2">
                      Surge Threshold: {settings.surgeAlertThreshold} pts
                    </label>
                    <input
                      type="range"
                      min="10"
                      max="40"
                      step="5"
                      value={settings.surgeAlertThreshold}
                      onChange={(e) => settings.updateSettings({ surgeAlertThreshold: parseInt(e.target.value) })}
                      className="w-full accent-theme-primary"
                    />
                  </div>

                  {/* Event Alert Timing */}
                  <div className="p-3 glass rounded-xl">
                    <label className="block font-bold text-white text-sm mb-2">
                      Event Alert: {settings.eventAlertMinutes}min before
                    </label>
                    <input
                      type="range"
                      min="15"
                      max="120"
                      step="15"
                      value={settings.eventAlertMinutes}
                      onChange={(e) => settings.updateSettings({ eventAlertMinutes: parseInt(e.target.value) })}
                      className="w-full accent-theme-primary"
                    />
                  </div>
                </div>
              )}

              {/* Preferences Tab */}
              {activeTab === 'preferences' && (
                <div className="space-y-4">
                  <h3 className="text-base font-bold text-white mb-3 flex items-center gap-2">
                    <DollarSign className="w-4 h-4 text-theme-accent" />
                    Personal Settings
                  </h3>

                  {/* Base Hourly Rate */}
                  <div className="p-3 glass rounded-xl">
                    <label className="block font-bold text-white text-sm mb-2">
                      Base Rate: ${settings.baseHourlyRate}/hr
                    </label>
                    <input
                      type="range"
                      min="10"
                      max="40"
                      step="1"
                      value={settings.baseHourlyRate}
                      onChange={(e) => settings.updateSettings({ baseHourlyRate: parseInt(e.target.value) })}
                      className="w-full accent-theme-primary"
                    />
                  </div>

                  {/* Offline Mode */}
                  <div className="flex items-center justify-between p-3 glass rounded-xl">
                    <div className="flex items-center gap-3">
                      <Wifi className="w-5 h-5 text-blue-400" />
                      <div>
                        <div className="font-bold text-white text-sm">Offline Mode</div>
                        <div className="text-xs text-gray-400">Cache for offline use</div>
                      </div>
                    </div>
                    <button
                      onClick={() => settings.updateSettings({ offlineMode: !settings.offlineMode })}
                      className={`w-12 h-6 rounded-full transition-colors ${
                        settings.offlineMode ? 'bg-theme-primary' : 'bg-gray-600'
                      }`}
                    >
                      <div className={`w-5 h-5 bg-white rounded-full transform transition-transform ${
                        settings.offlineMode ? 'translate-x-6' : 'translate-x-0.5'
                      }`} />
                    </button>
                  </div>

                  {/* Reset Button */}
                  <div className="pt-4 border-t border-white/10">
                    <button
                      onClick={() => {
                        if (confirm('Reset all settings to default?')) {
                          settings.reset();
                        }
                      }}
                      className="w-full px-4 py-3 bg-red-600/20 border-2 border-red-500/50 rounded-xl text-red-400 font-bold text-sm hover:bg-red-600/30 transition-colors"
                    >
                      Reset All Settings
                    </button>
                  </div>
                </div>
              )}
            </div>
          </DraggableCard>
        </>
      )}
    </AnimatePresence>
  );
}
