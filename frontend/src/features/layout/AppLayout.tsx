import { useTheme } from '../theme';
import { DreamLayout } from './DreamLayout';
// NeonCockpitLayout removed in v8.0
import { ProDashboardLayout } from './ProDashboardLayout';
import { CarModeLayout } from './CarModeLayout';
import type { LayoutProps } from './types';

export function AppLayout(props: LayoutProps) {
  const { layoutId } = useTheme();

  switch (layoutId) {
    case 'dream':
      return <DreamLayout {...props} />;
    // 'cockpit' case removed - Neon Cockpit eliminated in v8.0
    case 'dashboard':
      return <ProDashboardLayout {...props} />;
    case 'car':
      return <CarModeLayout {...props} />;
    default:
      return <ProDashboardLayout {...props} />; // Pro Dashboard is default in v8.0
  }
}

