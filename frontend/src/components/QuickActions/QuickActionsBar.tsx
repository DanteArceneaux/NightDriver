import { useState } from 'react';
import { MapPin, Zap, Coffee, Calendar, TrendingUp } from 'lucide-react';
import { BathroomFinder } from '../Amenities/BathroomFinder';
import { ChargingStationFinder } from '../Amenities/ChargingStationFinder';
import { CoffeeFinder } from '../Amenities/CoffeeFinder';
import { ShiftPlannerModal } from '../ShiftPlanner/ShiftPlannerModal';
import { PaceTracker } from './PaceTracker';

interface QuickActionsBarProps {
  currentLocation?: { lat: number; lng: number };
}

export function QuickActionsBar({ currentLocation }: QuickActionsBarProps) {
  const [showBathrooms, setShowBathrooms] = useState(false);
  const [showCharging, setShowCharging] = useState(false);
  const [showCoffee, setShowCoffee] = useState(false);
  const [showShiftPlanner, setShowShiftPlanner] = useState(false);
  const [showPace, setShowPace] = useState(false);

  return (
    <>
      {/* Quick Actions Bar - Bottom navigation */}
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[100] w-[95%] max-w-[440px] pb-safe">
        <div className="bg-gray-900/95 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/10 p-3 sm:p-4">
          <div className="flex items-center justify-between gap-1">
            {/* Bathroom Finder */}
            <button
              onClick={() => setShowBathrooms(true)}
              className="flex-1 flex flex-col items-center gap-1 sm:gap-2 py-2 sm:py-3 rounded-2xl active:bg-white/10 transition-all touch-target"
              title="Find Bathrooms"
            >
              <MapPin className="w-5 h-5 sm:w-6 sm:h-6 text-cyan-400" />
              <span className="text-[10px] sm:text-xs uppercase tracking-tighter text-gray-300 font-bold">Bath</span>
            </button>

            {/* Charging Stations */}
            <button
              onClick={() => setShowCharging(true)}
              className="flex-1 flex flex-col items-center gap-1 sm:gap-2 py-2 sm:py-3 rounded-2xl active:bg-white/10 transition-all touch-target"
              title="Find Charging"
            >
              <Zap className="w-5 h-5 sm:w-6 sm:h-6 text-green-400" />
              <span className="text-[10px] sm:text-xs uppercase tracking-tighter text-gray-300 font-bold">Charge</span>
            </button>

            {/* Coffee/Break */}
            <button
              onClick={() => setShowCoffee(true)}
              className="flex-1 flex flex-col items-center gap-1 sm:gap-2 py-2 sm:py-3 rounded-2xl active:bg-white/10 transition-all touch-target"
              title="Find Coffee"
            >
              <Coffee className="w-5 h-5 sm:w-6 sm:h-6 text-amber-400" />
              <span className="text-[10px] sm:text-xs uppercase tracking-tighter text-gray-300 font-bold">Break</span>
            </button>

            {/* Shift Planner */}
            <button
              onClick={() => setShowShiftPlanner(true)}
              className="flex-1 flex flex-col items-center gap-1 sm:gap-2 py-2 sm:py-3 rounded-2xl active:bg-white/10 transition-all touch-target"
              title="Plan Shift"
            >
              <Calendar className="w-5 h-5 sm:w-6 sm:h-6 text-purple-400" />
              <span className="text-[10px] sm:text-xs uppercase tracking-tighter text-gray-300 font-bold">Plan</span>
            </button>

            {/* Earnings Pace */}
            <button
              onClick={() => setShowPace(true)}
              className="flex-1 flex flex-col items-center gap-1 sm:gap-2 py-2 sm:py-3 rounded-2xl active:bg-white/10 transition-all touch-target"
              title="Check Pace"
            >
              <TrendingUp className="w-5 h-5 sm:w-6 sm:h-6 text-pink-400" />
              <span className="text-[10px] sm:text-xs uppercase tracking-tighter text-gray-300 font-bold">Pace</span>
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
    </>
  );
}

