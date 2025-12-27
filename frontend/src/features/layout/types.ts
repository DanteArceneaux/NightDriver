import type { ZoneScore, TopPick, Coordinates } from '../../types';

export interface LayoutProps {
  // Shared data passed to all layouts
  zones: ZoneScore[];
  topPick: TopPick;
  topZone?: ZoneScore;
  driverLocation?: Coordinates | null;
  connected: boolean;
  countdown: number;
  weather?: { temp: number; description: string };
  lastUpdate?: Date | null;
  error?: string;
  onRefresh: () => void;
  onZoneClick?: (zone: ZoneScore) => void;
}

