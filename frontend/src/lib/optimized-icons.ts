/**
 * Optimized icon imports to reduce bundle size
 * Instead of importing all icons from lucide-react, we import only what we need
 */

// Import icons individually to enable tree-shaking
import { 
  Map as MapIcon,
  Satellite,
  TrendingUp,
  Navigation2,
  Gauge,
  Crosshair,
  Battery,
  Car,
  Coffee,
  Wifi,
  Zap,
  Users,
  DollarSign,
  Target,
  Clock,
  Cloud,
  CloudRain,
  Sun,
  Wind,
  Thermometer,
  AlertCircle,
  CheckCircle,
  XCircle,
  Info,
  Settings,
  RefreshCw,
  Home,
  Navigation,
  Compass,
  MapPin,
  Star,
  Heart,
  Share2,
  Download,
  Upload,
  Filter,
  Search,
  Menu,
  X,
  ChevronRight,
  ChevronLeft,
  ChevronUp,
  ChevronDown,
  Plus,
  Minus,
  MoreVertical,
  MoreHorizontal,
} from 'lucide-react';

// Re-export with better names
export {
  MapIcon,
  Satellite,
  TrendingUp,
  Navigation2,
  Gauge,
  Crosshair,
  Battery,
  Car,
  Coffee,
  Wifi,
  Zap,
  Users,
  DollarSign,
  Target,
  Clock,
  Cloud,
  CloudRain,
  Sun,
  Wind,
  Thermometer,
  AlertCircle,
  CheckCircle,
  XCircle,
  Info,
  Settings,
  RefreshCw,
  Home,
  Navigation,
  Compass,
  MapPin,
  Star,
  Heart,
  Share2,
  Download,
  Upload,
  Filter,
  Search,
  Menu,
  X,
  ChevronRight,
  ChevronLeft,
  ChevronUp,
  ChevronDown,
  Plus,
  Minus,
  MoreVertical,
  MoreHorizontal,
};

// Icon mapping for dynamic usage
export const iconMap = {
  // Map & Navigation
  map: MapIcon,
  satellite: Satellite,
  trending: TrendingUp,
  navigation: Navigation2,
  gauge: Gauge,
  crosshair: Crosshair,
  compass: Compass,
  mapPin: MapPin,
  
  // Vehicle & Status
  battery: Battery,
  car: Car,
  wifi: Wifi,
  zap: Zap,
  
  // Amenities
  coffee: Coffee,
  users: Users,
  
  // Business
  dollar: DollarSign,
  target: Target,
  
  // Time & Weather
  clock: Clock,
  cloud: Cloud,
  rain: CloudRain,
  sun: Sun,
  wind: Wind,
  thermometer: Thermometer,
  
  // UI & Actions
  alert: AlertCircle,
  check: CheckCircle,
  error: XCircle,
  info: Info,
  settings: Settings,
  refresh: RefreshCw,
  home: Home,
  star: Star,
  heart: Heart,
  share: Share2,
  download: Download,
  upload: Upload,
  filter: Filter,
  search: Search,
  menu: Menu,
  close: X,
  chevronRight: ChevronRight,
  chevronLeft: ChevronLeft,
  chevronUp: ChevronUp,
  chevronDown: ChevronDown,
  plus: Plus,
  minus: Minus,
  moreVertical: MoreVertical,
  moreHorizontal: MoreHorizontal,
};

export type IconName = keyof typeof iconMap;

/**
 * Get an icon component by name
 * Useful for dynamic icon rendering
 */
export function getIcon(name: IconName) {
  return iconMap[name] || AlertCircle;
}

/**
 * Lazy load canvas-confetti only when needed
 */
export async function loadConfetti() {
  const { default: confetti } = await import('canvas-confetti');
  return confetti;
}

/**
 * Preload heavy dependencies
 */
export function preloadHeavyDependencies() {
  // Preload map dependencies
  import('leaflet');
  import('react-leaflet');
  
  // Preload confetti for celebrations
  loadConfetti().catch(() => {
    // Silently fail - confetti is not critical
  });
}


