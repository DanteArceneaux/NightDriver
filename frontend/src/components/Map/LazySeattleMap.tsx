/**
 * Lazy-loaded version of SeattleMap with dynamic imports
 * This reduces initial bundle size by ~200KB
 */

import { lazy, Suspense } from 'react';
import { ZoneScore } from '../../types';
import { Skeleton } from '../Skeleton/Skeleton';

// Lazy load the heavy map component
const SeattleMap = lazy(() => 
  import('./SeattleMap').then(module => ({ 
    default: module.SeattleMap 
  }))
);

interface LazySeattleMapProps {
  zones: ZoneScore[];
  onZoneClick?: (zone: ZoneScore) => void;
}

export function LazySeattleMap({ zones, onZoneClick }: LazySeattleMapProps) {
  return (
    <Suspense fallback={<Skeleton />}>
      <SeattleMap zones={zones} onZoneClick={onZoneClick} />
    </Suspense>
  );
}

// Also export a hook for conditional loading
export function useMapPreload() {
  return () => {
    // Preload the map component when needed
    import('./SeattleMap');
  };
}
