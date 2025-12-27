import { motion, AnimatePresence } from 'framer-motion';
import { X, Palette, Bell, Heart, DollarSign, Volume2, Wifi } from 'lucide-react';
import { useState } from 'react';
import { useSettingsStore } from '../../features/settings/store';
import { useTheme } from '../../features/theme';
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
      case 'neon':
        return settings.neonColorScheme;
      case 'pro':
        return settings.proColorScheme;
      case 'hud':
        return settings.hudColorScheme;
      case 'car':
        return settings.carColorScheme;
      default:
        return 'default';
    }
  };

  const setColorScheme = (scheme: ColorScheme) => {
    settings.setColorScheme(currentThemeId, scheme);
  };

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
            className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-full max-w-2xl max-h-[90vh] overflow-y-auto z-50"
          >
            <div className="glass-strong rounded-2xl border border-white/20 shadow-2xl m-4">
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b border-white/10">
                <h2 className="text-2xl font-black text-white uppercase tracking-wider">
                  Settings
                </h2>
                <button
                  onClick={onClose}
                  className="p-2 hover:bg-white/10 rounded-xl transition-colors"
                >
                  <X className="w-6 h-6 text-gray-400" />
                </button>
              </div>

              {/* Tabs */}
              <div className="flex gap-2 p-4 border-b border-white/10">
                {[
                  { id: 'appearance', label: 'Appearance', icon: Palette },
                  { id: 'alerts', label: 'Alerts', icon: Bell },
                  { id: 'preferences', label: 'Preferences', icon: Heart },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold transition-all ${
                      activeTab === tab.id
                        ? 'bg-theme-primary/20 text-theme-primary border border-theme-primary/50'
                        : 'text-gray-400 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    <tab.icon className="w-4 h-4" />
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* Content */}
              <div className="p-6 space-y-6">
                {/* Appearance Tab */}
                {activeTab === 'appearance' && (
                  <>
                    <div>
                      <h3 className="text-lg font-bold text-white mb-3 flex items-center gap-2">
                        <Palette className="w-5 h-5 text-theme-primary" />
                        Color Scheme for {currentThemeId === 'neon' ? 'Neon Cockpit' : currentThemeId === 'pro' ? 'Pro Dashboard' : currentThemeId === 'hud' ? 'Game HUD' : 'Car Mode'}
                      </h3>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                        {colorSchemes.map((scheme) => (
                          <motion.button
                            key={scheme.id}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => setColorScheme(scheme.id)}
                            className={`p-4 rounded-xl border-2 transition-all ${
                              getCurrentColorScheme() === scheme.id
                                ? 'border-theme-primary bg-theme-primary/10'
                                : 'border-white/10 hover:border-white/30'
                            }`}
                          >
                            <div className={`w-full h-12 rounded-lg mb-2 ${scheme.preview}`} />
                            <div className="text-sm font-bold text-white">{scheme.name}</div>
                          </motion.button>
                        ))}
                      </div>
                    </div>
                  </>
                )}

                {/* Alerts Tab */}
                {activeTab === 'alerts' && (
                  <>
                    <div>
                      <h3 className="text-lg font-bold text-white mb-3 flex items-center gap-2">
                        <Bell className="w-5 h-5 text-theme-primary" />
                        Alert Settings
                      </h3>
                      <div className="space-y-4">
                        {/* Voice Alerts */}
                        <div className="flex items-center justify-between p-4 glass rounded-xl">
                          <div className="flex items-center gap-3">
                            <Volume2 className="w-5 h-5 text-blue-400" />
                            <div>
                              <div className="font-bold text-white">Voice Alerts</div>
                              <div className="text-sm text-gray-400">Spoken notifications for surges</div>
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
                        <div className="p-4 glass rounded-xl">
                          <label className="block font-bold text-white mb-2">
                            Surge Alert Threshold: {settings.surgeAlertThreshold} points
                          </label>
                          <input
                            type="range"
                            min="10"
                            max="40"
                            step="5"
                            value={settings.surgeAlertThreshold}
                            onChange={(e) => settings.updateSettings({ surgeAlertThreshold: parseInt(e.target.value) })}
                            className="w-full"
                          />
                          <div className="text-sm text-gray-400 mt-1">
                            Alert when zone score jumps by this amount
                          </div>
                        </div>

                        {/* Event Alert Timing */}
                        <div className="p-4 glass rounded-xl">
                          <label className="block font-bold text-white mb-2">
                            Event Alert: {settings.eventAlertMinutes} minutes before
                          </label>
                          <input
                            type="range"
                            min="15"
                            max="120"
                            step="15"
                            value={settings.eventAlertMinutes}
                            onChange={(e) => settings.updateSettings({ eventAlertMinutes: parseInt(e.target.value) })}
                            className="w-full"
                          />
                          <div className="text-sm text-gray-400 mt-1">
                            How early to alert before events start/end
                          </div>
                        </div>
                      </div>
                    </div>
                  </>
                )}

                {/* Preferences Tab */}
                {activeTab === 'preferences' && (
                  <>
                    <div>
                      <h3 className="text-lg font-bold text-white mb-3 flex items-center gap-2">
                        <DollarSign className="w-5 h-5 text-theme-accent" />
                        Personal Settings
                      </h3>
                      <div className="space-y-4">
                        {/* Base Hourly Rate */}
                        <div className="p-4 glass rounded-xl">
                          <label className="block font-bold text-white mb-2">
                            Your Base Hourly Rate: ${settings.baseHourlyRate}/hr
                          </label>
                          <input
                            type="range"
                            min="10"
                            max="40"
                            step="1"
                            value={settings.baseHourlyRate}
                            onChange={(e) => settings.updateSettings({ baseHourlyRate: parseInt(e.target.value) })}
                            className="w-full"
                          />
                          <div className="text-sm text-gray-400 mt-1">
                            Used to calculate estimated earnings
                          </div>
                        </div>

                        {/* Offline Mode */}
                        <div className="flex items-center justify-between p-4 glass rounded-xl">
                          <div className="flex items-center gap-3">
                            <Wifi className="w-5 h-5 text-blue-400" />
                            <div>
                              <div className="font-bold text-white">Offline Mode</div>
                              <div className="text-sm text-gray-400">Cache data for offline use</div>
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
                      </div>
                    </div>

                    {/* Reset Button */}
                    <div className="pt-4 border-t border-white/10">
                      <button
                        onClick={() => {
                          if (confirm('Reset all settings to default?')) {
                            settings.reset();
                          }
                        }}
                        className="w-full px-6 py-3 bg-red-600/20 border-2 border-red-500/50 rounded-xl text-red-400 font-bold hover:bg-red-600/30 transition-colors"
                      >
                        Reset All Settings
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

