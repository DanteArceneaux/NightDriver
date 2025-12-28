import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Zap, Navigation, DollarSign, Battery } from 'lucide-react';
import { getBackendUrl, isStaticHost } from '../../lib/api';

interface ChargingStation {
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
  chargerType?: string;
  numStalls?: number;
  powerKw?: number;
  cost?: string;
}

// Mock charging stations for static hosting
const MOCK_STATIONS: ChargingStation[] = [
  { id: '1', name: 'Tesla Supercharger - SLU', type: 'charging', coordinates: { lat: 47.6232, lng: -122.3365 }, is24Hours: true, verified: true, distance: 0.5, chargerType: 'Tesla Supercharger', numStalls: 12, powerKw: 250 },
  { id: '2', name: 'Electrify America - Northgate', type: 'charging', coordinates: { lat: 47.7081, lng: -122.3297 }, is24Hours: true, verified: true, distance: 2.1, chargerType: 'CCS', numStalls: 8, powerKw: 150 },
  { id: '3', name: 'ChargePoint - Downtown', type: 'charging', coordinates: { lat: 47.6062, lng: -122.3321 }, is24Hours: true, verified: true, distance: 0.8, chargerType: 'CCS', numStalls: 4, powerKw: 50 },
];

interface ChargingStationFinderProps {
  currentLocation: { lat: number; lng: number };
  teslaOnly?: boolean;
  onClose?: () => void;
}

export function ChargingStationFinder({ currentLocation, teslaOnly = false, onClose }: ChargingStationFinderProps) {
  const [stations, setStations] = useState<ChargingStation[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'tesla'>(teslaOnly ? 'tesla' : 'all');

  // Fetch when filter changes (includes initial mount)
  useEffect(() => {
    const fetchStations = async () => {
      setLoading(true);
      
      // Use mock data on static hosts
      if (isStaticHost) {
        const filtered = filter === 'tesla'
          ? MOCK_STATIONS.filter(s => s.chargerType?.toLowerCase().includes('tesla'))
          : MOCK_STATIONS;
        setStations(filtered);
        setLoading(false);
        return;
      }
      
      try {
        const backendUrl = getBackendUrl();
        if (!backendUrl) {
          setStations(MOCK_STATIONS);
          setLoading(false);
          return;
        }
        
        const teslaParam = filter === 'tesla' ? '&tesla=true' : '';
        const response = await fetch(
          `${backendUrl}/api/amenities/charging?lat=${currentLocation.lat}&lng=${currentLocation.lng}&radius=10${teslaParam}`
        );
        const data = await response.json();
        setStations(data.chargers || []);
      } catch (error) {
        console.error('Error fetching charging stations:', error);
        setStations(MOCK_STATIONS);
      } finally {
        setLoading(false);
      }
    };

    fetchStations();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter]); // Only re-fetch when filter changes, not on location updates

  const openNavigation = (station: ChargingStation) => {
    const url = `https://www.google.com/maps/dir/?api=1&destination=${station.coordinates.lat},${station.coordinates.lng}`;
    window.open(url, '_blank');
  };

  const getChargerIcon = (type?: string) => {
    if (type === 'tesla') return '⚡';
    if (type === 'ccs') return '🔌';
    if (type === 'chademo') return '🔋';
    return '⚡';
  };

  const getChargerColor = (type?: string) => {
    if (type === 'tesla') return 'text-red-400';
    if (type === 'ccs') return 'text-blue-400';
    return 'text-green-400';
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
        className="bg-gray-900 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[85vh] overflow-hidden border border-green-500/30"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-green-600 to-emerald-600 p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-white/20 p-3 rounded-xl">
                <Zap className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white">EV Charging Stations</h2>
                <p className="text-green-100 text-sm">Fast chargers near you</p>
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
                  ? 'bg-white text-green-600'
                  : 'bg-white/20 text-white hover:bg-white/30'
              }`}
            >
              All Chargers
            </button>
            <button
              onClick={() => setFilter('tesla')}
              className={`px-4 py-2 rounded-lg font-medium transition-all ${
                filter === 'tesla'
                  ? 'bg-white text-green-600'
                  : 'bg-white/20 text-white hover:bg-white/30'
              }`}
            >
              Tesla Superchargers
            </button>
          </div>
        </div>

        {/* List */}
        <div className="overflow-y-auto max-h-[60vh] p-4 space-y-3">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-4 border-green-500 border-t-transparent"></div>
            </div>
          ) : stations.length === 0 ? (
            <div className="text-center py-12 text-gray-400">
              <Zap className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>No charging stations found nearby</p>
            </div>
          ) : (
            <AnimatePresence>
              {stations.map((station, index) => (
                <motion.div
                  key={station.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="bg-gray-800 rounded-xl p-4 border border-gray-700 hover:border-green-500/50 transition-all"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className={`text-2xl ${getChargerColor(station.chargerType)}`}>
                          {getChargerIcon(station.chargerType)}
                        </span>
                        <h3 className="font-semibold text-white">{station.name}</h3>
                        {station.is24Hours && (
                          <span className="px-2 py-0.5 bg-green-500/20 text-green-400 text-xs font-medium rounded-full">
                            24/7
                          </span>
                        )}
                      </div>

                      <div className="grid grid-cols-2 gap-3 mb-3">
                        {station.powerKw && (
                          <div className="flex items-center gap-2 text-sm">
                            <Battery className="w-4 h-4 text-green-400" />
                            <span className="text-white font-medium">{station.powerKw} kW</span>
                          </div>
                        )}
                        {station.numStalls && (
                          <div className="flex items-center gap-2 text-sm">
                            <Zap className="w-4 h-4 text-yellow-400" />
                            <span className="text-white">{station.numStalls} stalls</span>
                          </div>
                        )}
                        {station.cost && (
                          <div className="flex items-center gap-2 text-sm">
                            <DollarSign className="w-4 h-4 text-cyan-400" />
                            <span className="text-gray-300">{station.cost}</span>
                          </div>
                        )}
                        {station.distance !== undefined && (
                          <div className="text-sm">
                            <span className="text-green-400 font-medium">
                              {station.distance.toFixed(1)} mi away
                            </span>
                          </div>
                        )}
                      </div>

                      {station.address && (
                        <p className="text-sm text-gray-400 mb-2">{station.address}</p>
                      )}

                      {station.notes && (
                        <p className="text-sm text-gray-300 italic">
                          💡 {station.notes}
                        </p>
                      )}
                    </div>

                    <button
                      onClick={() => openNavigation(station)}
                      className="flex-shrink-0 bg-green-600 hover:bg-green-500 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2"
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

