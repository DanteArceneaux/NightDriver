import { useState } from 'react';
import { MapPin, Zap, Coffee, Calendar, TrendingUp } from 'lucide-react';
import { BathroomFinder } from '../Amenities/BathroomFinder';
import { ChargingStationFinder } from '../Amenities/ChargingStationFinder';
import { CoffeeFinder } from '../Amenities/CoffeeFinder';
import { ShiftPlannerModal } from '../ShiftPlanner/ShiftPlannerModal';
import { PaceTracker } from './PaceTracker';

interface QuickActionsBarProps {
  currentLocation: { lat: number; lng: number };
}

export function QuickActionsBar({ currentLocation }: QuickActionsBarProps) {
  const [showBathrooms, setShowBathrooms] = useState(false);
  const [showCharging, setShowCharging] = useState(false);
  const [showCoffee, setShowCoffee] = useState(false);
  const [showShiftPlanner, setShowShiftPlanner] = useState(false);
  const [showPace, setShowPace] = useState(false);

  return (
    <>
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[100]">
        <div className="bg-gray-900/95 backdrop-blur-lg rounded-2xl shadow-2xl border border-cyan-500/30 p-3">
          <div className="flex items-center gap-3">
            {/* Bathroom Finder */}
            <button
              onClick={() => setShowBathrooms(true)}
              className="group relative flex flex-col items-center gap-1 px-4 py-2 rounded-xl hover:bg-cyan-600/20 transition-all"
              title="Find Bathrooms"
            >
              <MapPin className="w-5 h-5 text-cyan-400 group-hover:scale-110 transition-transform" />
              <span className="text-xs text-gray-300 font-medium">Bathroom</span>
            </button>

            {/* Charging Stations */}
            <button
              onClick={() => setShowCharging(true)}
              className="group relative flex flex-col items-center gap-1 px-4 py-2 rounded-xl hover:bg-green-600/20 transition-all"
              title="Find Charging"
            >
              <Zap className="w-5 h-5 text-green-400 group-hover:scale-110 transition-transform" />
              <span className="text-xs text-gray-300 font-medium">Charging</span>
            </button>

            {/* Coffee/Break */}
            <button
              onClick={() => setShowCoffee(true)}
              className="group relative flex flex-col items-center gap-1 px-4 py-2 rounded-xl hover:bg-amber-600/20 transition-all"
              title="Find Coffee"
            >
              <Coffee className="w-5 h-5 text-amber-400 group-hover:scale-110 transition-transform" />
              <span className="text-xs text-gray-300 font-medium">Coffee</span>
            </button>

            {/* Shift Planner */}
            <button
              onClick={() => setShowShiftPlanner(true)}
              className="group relative flex flex-col items-center gap-1 px-4 py-2 rounded-xl hover:bg-purple-600/20 transition-all"
              title="Plan Shift"
            >
              <Calendar className="w-5 h-5 text-purple-400 group-hover:scale-110 transition-transform" />
              <span className="text-xs text-gray-300 font-medium">Plan Shift</span>
            </button>

            {/* Earnings Pace */}
            <button
              onClick={() => setShowPace(true)}
              className="group relative flex flex-col items-center gap-1 px-4 py-2 rounded-xl hover:bg-pink-600/20 transition-all"
              title="Check Pace"
            >
              <TrendingUp className="w-5 h-5 text-pink-400 group-hover:scale-110 transition-transform" />
              <span className="text-xs text-gray-300 font-medium">Pace</span>
            </button>
          </div>
        </div>
      </div>

      {/* Modals */}
      {showBathrooms && (
        <BathroomFinder
          currentLocation={currentLocation}
          onClose={() => setShowBathrooms(false)}
        />
      )}

      {showCharging && (
        <ChargingStationFinder
          currentLocation={currentLocation}
          onClose={() => setShowCharging(false)}
        />
      )}

      {showCoffee && (
        <CoffeeFinder
          currentLocation={currentLocation}
          onClose={() => setShowCoffee(false)}
        />
      )}

      {showShiftPlanner && (
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

