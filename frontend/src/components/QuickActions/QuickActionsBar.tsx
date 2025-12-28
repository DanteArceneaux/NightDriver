import { useState } from 'react';
import { MapPin, Zap, Coffee, Calendar, Plus } from 'lucide-react';
import { BathroomFinder } from '../Amenities/BathroomFinder';
import { ChargingStationFinder } from '../Amenities/ChargingStationFinder';
import { CoffeeFinder } from '../Amenities/CoffeeFinder';
import { ShiftPlannerModal } from '../ShiftPlanner/ShiftPlannerModal';
import { PaceTracker } from './PaceTracker';
import { TripLogger } from '../Trip/TripLogger';
import type { ZoneScore } from '../../types';

interface QuickActionsBarProps {
  currentLocation?: { lat: number; lng: number };
  zones?: ZoneScore[];
}

export function QuickActionsBar({ currentLocation, zones = [] }: QuickActionsBarProps) {
  const [showBathrooms, setShowBathrooms] = useState(false);
  const [showCharging, setShowCharging] = useState(false);
  const [showCoffee, setShowCoffee] = useState(false);
  const [showShiftPlanner, setShowShiftPlanner] = useState(false);
  const [showPace, setShowPace] = useState(false);
  const [showTripLogger, setShowTripLogger] = useState(false);

  return (
    <>
      {/* Quick Actions Bar - Bottom navigation */}
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[100] w-[95%] max-w-[500px] pb-safe">
        <div className="bg-gray-900/95 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/10 p-2 sm:p-3">
          <div className="flex items-center justify-between gap-1">
            {/* Log Trip Primary Button */}
            <button
              onClick={() => setShowTripLogger(true)}
              className="flex-[1.5] flex items-center justify-center gap-2 py-3 px-4 bg-gradient-to-r from-theme-primary to-theme-secondary rounded-2xl active:scale-95 transition-all shadow-lg shadow-theme-primary/20"
              title="Log Trip"
            >
              <Plus className="w-5 h-5 text-black" strokeWidth={3} />
              <span className="text-xs text-black font-black uppercase tracking-wider">Log Trip</span>
            </button>

            <div className="w-px h-8 bg-white/10 mx-1" />

            {/* Bathroom Finder */}
            <button
              onClick={() => setShowBathrooms(true)}
              className="flex-1 flex flex-col items-center gap-1 py-2 rounded-2xl active:bg-white/10 transition-all touch-target"
              title="Find Bathrooms"
            >
              <MapPin className="w-5 h-5 text-cyan-400" />
              <span className="text-[9px] uppercase tracking-tighter text-gray-400 font-bold">Bath</span>
            </button>

            {/* Charging Stations */}
            <button
              onClick={() => setShowCharging(true)}
              className="flex-1 flex flex-col items-center gap-1 py-2 rounded-2xl active:bg-white/10 transition-all touch-target"
              title="Find Charging"
            >
              <Zap className="w-5 h-5 text-green-400" />
              <span className="text-[9px] uppercase tracking-tighter text-gray-400 font-bold">Charge</span>
            </button>

            {/* Coffee/Break */}
            <button
              onClick={() => setShowCoffee(true)}
              className="flex-1 flex flex-col items-center gap-1 py-2 rounded-2xl active:bg-white/10 transition-all touch-target"
              title="Find Coffee"
            >
              <Coffee className="w-5 h-5 text-amber-400" />
              <span className="text-[9px] uppercase tracking-tighter text-gray-400 font-bold">Break</span>
            </button>

            {/* Shift Planner */}
            <button
              onClick={() => setShowShiftPlanner(true)}
              className="flex-1 flex flex-col items-center gap-1 py-2 rounded-2xl active:bg-white/10 transition-all touch-target"
              title="Plan Shift"
            >
              <Calendar className="w-5 h-5 text-purple-400" />
              <span className="text-[9px] uppercase tracking-tighter text-gray-400 font-bold">Plan</span>
            </button>
          </div>
        </div>
      </div>

      {/* Modals */}
      {showBathrooms && currentLocation && (
        <BathroomFinder
          currentLocation={currentLocation}
          onClose={() => setShowBathrooms(false)}
        />
      )}

      {showCharging && currentLocation && (
        <ChargingStationFinder
          currentLocation={currentLocation}
          onClose={() => setShowCharging(false)}
        />
      )}

      {showCoffee && (
        <CoffeeFinder
          onClose={() => setShowCoffee(false)}
        />
      )}

      {showShiftPlanner && currentLocation && (
        <ShiftPlannerModal
          currentLocation={currentLocation}
          onClose={() => setShowShiftPlanner(false)}
        />
      )}

      {showPace && (
        <PaceTracker
          onClose={() => setShowPace(false)}
        />
      )}

      {showTripLogger && (
        <TripLogger
          isOpen={showTripLogger}
          onClose={() => setShowTripLogger(false)}
          zones={zones}
        />
      )}
    </>
  );
}

