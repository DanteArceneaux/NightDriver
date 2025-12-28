import { useTheme } from '../theme';
import { DreamLayout } from './DreamLayout';
import { NeonCockpitLayout } from './NeonCockpitLayout';
import { ProDashboardLayout } from './ProDashboardLayout';
import { GameHudLayout } from './GameHudLayout';
import { CarModeLayout } from './CarModeLayout';
import type { LayoutProps } from './types';

export function AppLayout(props: LayoutProps) {
  const { layoutId } = useTheme();

  switch (layoutId) {
    case 'dream':
      return <DreamLayout {...props} />;
    case 'cockpit':
      return <NeonCockpitLayout {...props} />;
    case 'dashboard':
      return <ProDashboardLayout {...props} />;
    case 'hud':
      return <GameHudLayout {...props} />;
    case 'car':
      return <CarModeLayout {...props} />;
    default:
      return <DreamLayout {...props} />; // Dream Layout is now the default
  }
}

