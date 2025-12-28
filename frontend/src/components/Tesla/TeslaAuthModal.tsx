import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Key, ExternalLink, Info, CheckCircle, AlertCircle } from 'lucide-react';
import { getBackendUrl } from '../../lib/api';

interface TeslaAuthModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

export function TeslaAuthModal({ onClose, onSuccess }: TeslaAuthModalProps) {
  const [token, setToken] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [step, setStep] = useState<'input' | 'instructions'>('input');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token.trim()) {
      setError('Please enter your access token');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const backendUrl = getBackendUrl();
      const response = await fetch(`${backendUrl}/api/tesla/auth`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: token.trim() })
      });

      if (response.ok) {
        // Store token locally (encrypted in production)
        localStorage.setItem('teslaToken', token.trim());
        localStorage.setItem('isTeslaConnected', 'true');
        onSuccess();
        onClose();
      } else {
        const data = await response.json();
        setError(data.error || 'Failed to connect. Please check your token.');
      }
    } catch (err) {
      setError('Connection error. Please check your internet connection.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="bg-gray-900 rounded-2xl shadow-2xl max-w-2xl w-full border border-red-500/30 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-red-600 to-red-700 p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-white/20 p-3 rounded-xl">
                <Key className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white">Connect Tesla Account</h2>
                <p className="text-red-100 text-sm">Get real-time battery and range data</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-white/80 hover:text-white transition-colors p-2 hover:bg-white/10 rounded-lg"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          <AnimatePresence mode="wait">
            {step === 'input' ? (
              <motion.div
                key="input"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
              >
                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Info Box */}
                  <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-4 flex gap-3">
                    <Info className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
                    <div className="text-sm text-blue-100">
                      <p className="font-semibold mb-2">You'll need a Tesla Access Token</p>
                      <p className="text-blue-200/80">
                        This allows Night Driver to securely access your vehicle's battery level and range without storing your Tesla password.
                      </p>
                    </div>
                  </div>

                  {/* Token Input */}
                  <div>
                    <label className="block text-sm font-semibold text-white mb-2">
                      Tesla Access Token
                    </label>
                    <input
                      type="password"
                      value={token}
                      onChange={(e) => setToken(e.target.value)}
                      placeholder="Paste your access token here"
                      className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent font-mono text-sm"
                      disabled={isLoading}
                    />
                  </div>

                  {/* Error Message */}
                  {error && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 flex gap-3"
                    >
                      <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
                      <p className="text-sm text-red-200">{error}</p>
                    </motion.div>
                  )}

                  {/* Buttons */}
                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={() => setStep('instructions')}
                      className="flex-1 px-6 py-3 bg-gray-800 hover:bg-gray-700 text-white rounded-xl font-medium transition-colors border border-gray-700"
                    >
                      How to Get Token
                    </button>
                    <button
                      type="submit"
                      disabled={isLoading || !token.trim()}
                      className="flex-1 px-6 py-3 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 disabled:from-gray-700 disabled:to-gray-700 text-white rounded-xl font-medium transition-all disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      {isLoading ? (
                        <>
                          <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent" />
                          Connecting...
                        </>
                      ) : (
                        <>
                          <CheckCircle className="w-5 h-5" />
                          Connect Tesla
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </motion.div>
            ) : (
              <motion.div
                key="instructions"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-4 flex gap-3">
                  <Info className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-yellow-100">
                    <p className="font-semibold mb-1">Important</p>
                    <p className="text-yellow-200/80">
                      Never share your token with anyone. Night Driver stores it locally and only uses it to fetch your vehicle data.
                    </p>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-lg font-bold text-white">How to Get Your Access Token</h3>
                  
                  <div className="space-y-3">
                    {/* Option 1 */}
                    <div className="bg-gray-800 rounded-xl p-4 border border-gray-700">
                      <h4 className="font-semibold text-white mb-2 flex items-center gap-2">
                        <span className="bg-red-500 text-white text-xs w-6 h-6 rounded-full flex items-center justify-center font-bold">1</span>
                        Use Tesla Auth App (Recommended)
                      </h4>
                      <p className="text-sm text-gray-300 mb-3">
                        Download the "Tesla Auth" app from your app store. It generates tokens securely without storing your password.
                      </p>
                      <a
                        href="https://github.com/adriankumpf/tesla_auth"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 text-sm text-red-400 hover:text-red-300 transition-colors"
                      >
                        <ExternalLink className="w-4 h-4" />
                        View on GitHub
                      </a>
                    </div>

                    {/* Option 2 */}
                    <div className="bg-gray-800 rounded-xl p-4 border border-gray-700">
                      <h4 className="font-semibold text-white mb-2 flex items-center gap-2">
                        <span className="bg-red-500 text-white text-xs w-6 h-6 rounded-full flex items-center justify-center font-bold">2</span>
                        Use auth.tesla.com
                      </h4>
                      <p className="text-sm text-gray-300 mb-3">
                        Tesla's official token generator (requires developer account).
                      </p>
                      <a
                        href="https://auth.tesla.com"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 text-sm text-red-400 hover:text-red-300 transition-colors"
                      >
                        <ExternalLink className="w-4 h-4" />
                        Open auth.tesla.com
                      </a>
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => setStep('input')}
                  className="w-full px-6 py-3 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white rounded-xl font-medium transition-all"
                >
                  Back to Token Input
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </motion.div>
  );
}

