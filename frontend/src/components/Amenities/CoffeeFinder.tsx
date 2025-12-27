import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Coffee, MapPin, Navigation, Clock, CheckCircle } from 'lucide-react';

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
}

interface CoffeeFinderProps {
  currentLocation: { lat: number; lng: number };
  onClose?: () => void;
}

export function CoffeeFinder({ currentLocation, onClose }: CoffeeFinderProps) {
  const [spots, setSpots] = useState<Amenity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSpots();
  }, [currentLocation]);

  const fetchSpots = async () => {
    setLoading(true);
    try {
      const response = await fetch(
        `${import.meta.env.VITE_BACKEND_URL}/api/amenities?type=coffee&lat=${currentLocation.lat}&lng=${currentLocation.lng}&radius=2`
      );
      const data = await response.json();
      setSpots(data.amenities);
    } catch (error) {
      console.error('Error fetching coffee spots:', error);
    } finally {
      setLoading(false);
    }
  };

  const openNavigation = (spot: Amenity) => {
    const url = `https://www.google.com/maps/dir/?api=1&destination=${spot.coordinates.lat},${spot.coordinates.lng}`;
    window.open(url, '_blank');
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        className="bg-gray-900 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[80vh] overflow-hidden border border-amber-500/30"
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
                <h2 className="text-2xl font-bold text-white">Coffee & Breaks</h2>
                <p className="text-amber-100 text-sm">Best spots to recharge</p>
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

        {/* List */}
        <div className="overflow-y-auto max-h-[60vh] p-4 space-y-3">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-4 border-amber-500 border-t-transparent"></div>
            </div>
          ) : spots.length === 0 ? (
            <div className="text-center py-12 text-gray-400">
              <Coffee className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>No coffee spots found nearby</p>
            </div>
          ) : (
            <AnimatePresence>
              {spots.map((spot, index) => (
                <motion.div
                  key={spot.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="bg-gray-800 rounded-xl p-4 border border-gray-700 hover:border-amber-500/50 transition-all"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-semibold text-white">{spot.name}</h3>
                        {spot.verified && (
                          <CheckCircle className="w-4 h-4 text-green-400" />
                        )}
                      </div>

                      <div className="space-y-1 text-sm text-gray-400">
                        {spot.address && (
                          <p className="flex items-center gap-2">
                            <MapPin className="w-4 h-4" />
                            {spot.address}
                          </p>
                        )}
                        {spot.hours && (
                          <p className="flex items-center gap-2">
                            <Clock className="w-4 h-4" />
                            {spot.hours}
                          </p>
                        )}
                        {spot.distance !== undefined && (
                          <p className="text-amber-400 font-medium">
                            {spot.distance.toFixed(1)} mi away
                          </p>
                        )}
                      </div>

                      {spot.notes && (
                        <p className="mt-2 text-sm text-gray-300 italic">
                          💡 {spot.notes}
                        </p>
                      )}
                    </div>

                    <button
                      onClick={() => openNavigation(spot)}
                      className="flex-shrink-0 bg-amber-600 hover:bg-amber-500 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2"
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

