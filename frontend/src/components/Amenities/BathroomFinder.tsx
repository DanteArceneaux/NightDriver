import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MapPin, Navigation, Clock, CheckCircle, AlertCircle } from 'lucide-react';

interface Amenity {
  id: string;
  name: string;
  type: string;
  coordinates: { lat: number; lng: number };
  address?: string;
  hours?: string;
  is24Hours: boolean;
  verified: boolean;
  distance?: number;
  notes?: string;
  requiresPurchase?: boolean;
  hasCode?: boolean;
}

interface BathroomFinderProps {
  currentLocation: { lat: number; lng: number };
  onClose?: () => void;
}

export function BathroomFinder({ currentLocation, onClose }: BathroomFinderProps) {
  const [bathrooms, setBathrooms] = useState<Amenity[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | '24hr'>('all');

  // Fetch when filter changes (includes initial mount)
  useEffect(() => {
    const fetchBathrooms = async () => {
      setLoading(true);
      try {
        const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001';
        // Fix URL construction - use & for additional params when base already has ?
        const endpoint = filter === '24hr' 
          ? `/api/amenities/bathrooms?lat=${currentLocation.lat}&lng=${currentLocation.lng}&radius=5`
          : `/api/amenities?type=bathroom&lat=${currentLocation.lat}&lng=${currentLocation.lng}&radius=5`;
        
        const response = await fetch(`${backendUrl}${endpoint}`);
        const data = await response.json();
        setBathrooms(filter === '24hr' ? data.bathrooms : data.amenities || []);
      } catch (error) {
        console.error('Error fetching bathrooms:', error);
        setBathrooms([]);
      } finally {
        setLoading(false);
      }
    };

    fetchBathrooms();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter]); // Only re-fetch when filter changes, not on location updates

  const openNavigation = (bathroom: Amenity) => {
    const url = `https://www.google.com/maps/dir/?api=1&destination=${bathroom.coordinates.lat},${bathroom.coordinates.lng}`;
    window.open(url, '_blank');
  };

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
        className="bg-gray-900 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[85vh] overflow-hidden border border-cyan-500/30"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-cyan-600 to-blue-600 p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-white/20 p-3 rounded-xl">
                <MapPin className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white">Nearest Bathrooms</h2>
                <p className="text-cyan-100 text-sm">Driver-verified, reliable spots</p>
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

          {/* Filter */}
          <div className="flex gap-2 mt-4">
            <button
              onClick={() => setFilter('all')}
              className={`px-4 py-2 rounded-lg font-medium transition-all ${
                filter === 'all'
                  ? 'bg-white text-cyan-600'
                  : 'bg-white/20 text-white hover:bg-white/30'
              }`}
            >
              All Bathrooms
            </button>
            <button
              onClick={() => setFilter('24hr')}
              className={`px-4 py-2 rounded-lg font-medium transition-all ${
                filter === '24hr'
                  ? 'bg-white text-cyan-600'
                  : 'bg-white/20 text-white hover:bg-white/30'
              }`}
            >
              24/7 Only
            </button>
          </div>
        </div>

        {/* List */}
        <div className="overflow-y-auto max-h-[60vh] p-4 space-y-3">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-4 border-cyan-500 border-t-transparent"></div>
            </div>
          ) : bathrooms.length === 0 ? (
            <div className="text-center py-12 text-gray-400">
              <MapPin className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>No bathrooms found nearby</p>
            </div>
          ) : (
            <AnimatePresence>
              {bathrooms.map((bathroom, index) => (
                <motion.div
                  key={bathroom.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="bg-gray-800 rounded-xl p-4 border border-gray-700 hover:border-cyan-500/50 transition-all"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-semibold text-white">{bathroom.name}</h3>
                        {bathroom.verified && (
                          <CheckCircle className="w-4 h-4 text-green-400" />
                        )}
                        {bathroom.is24Hours && (
                          <span className="px-2 py-0.5 bg-green-500/20 text-green-400 text-xs font-medium rounded-full">
                            24/7
                          </span>
                        )}
                      </div>

                      <div className="space-y-1 text-sm text-gray-400">
                        {bathroom.address && (
                          <p className="flex items-center gap-2">
                            <MapPin className="w-4 h-4" />
                            {bathroom.address}
                          </p>
                        )}
                        {bathroom.hours && (
                          <p className="flex items-center gap-2">
                            <Clock className="w-4 h-4" />
                            {bathroom.hours}
                          </p>
                        )}
                        {bathroom.distance !== undefined && (
                          <p className="text-cyan-400 font-medium">
                            {bathroom.distance.toFixed(1)} mi away
                          </p>
                        )}
                      </div>

                      {bathroom.notes && (
                        <p className="mt-2 text-sm text-gray-300 italic">
                          💡 {bathroom.notes}
                        </p>
                      )}

                      {bathroom.requiresPurchase && (
                        <div className="mt-2 flex items-center gap-1 text-xs text-yellow-400">
                          <AlertCircle className="w-3 h-3" />
                          Purchase required
                          {bathroom.hasCode && ' • Ask for code'}
                        </div>
                      )}
                    </div>

                    <button
                      onClick={() => openNavigation(bathroom)}
                      className="flex-shrink-0 bg-cyan-600 hover:bg-cyan-500 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2"
                    >
                      <Navigation className="w-4 h-4" />
                      Navigate
                    </button>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}

