export type ColorScheme = 'default' | 'blue' | 'purple' | 'green' | 'orange' | 'red';

export interface AppSettings {
  // Color schemes per theme
  // neonColorScheme removed in v8.0
  proColorScheme: ColorScheme;
  carColorScheme: ColorScheme;
  
  // Feature toggles
  offlineMode: boolean;
  voiceAlerts: boolean;
  driverPulse: boolean;
  
  // Personalization
  baseHourlyRate: number; // User's estimated base rate
  preferredZones: string[]; // Favorite zones
  avoidZones: string[]; // No-go zones
  
  // Notifications
  surgeAlertThreshold: number;
  eventAlertMinutes: number; // How early to alert before event
}

export const defaultSettings: AppSettings = {
  // neonColorScheme removed in v8.0
  proColorScheme: 'default',
  carColorScheme: 'default',
  offlineMode: true,
  voiceAlerts: false,
  driverPulse: false,
  baseHourlyRate: 18,
  preferredZones: [],
  avoidZones: [],
  surgeAlertThreshold: 20,
  eventAlertMinutes: 60,
};

