/**
 * Bar Close Times & Late Night Surge
 * 
 * Seattle bars close at 2am. Smart drivers position 15-30min before close
 * for the surge of drunk people needing rides home.
 * 
 * Different neighborhoods have different bar densities and surge potential.
 */

export interface BarZone {
  zoneId: string;
  name: string;
  closeTime: string; // "02:00"
  barCount: number;
  surgeIntensity: 'low' | 'medium' | 'high' | 'extreme';
  peakSurgeStart: string; // When to position
  peakSurgeEnd: string;   // When surge ends
  notes: string;
}

export const BAR_ZONES: BarZone[] = [
  {
    zoneId: 'capitol_hill',
    name: 'Capitol Hill',
    closeTime: '02:00',
    barCount: 50,
    surgeIntensity: 'extreme',
    peakSurgeStart: '01:45',
    peakSurgeEnd: '02:30',
    notes: 'Highest bar density in Seattle. Pine St, Pike St, Broadway. Long rides to suburbs = big $$$.',
  },
  {
    zoneId: 'belltown',
    name: 'Belltown',
    closeTime: '02:00',
    barCount: 35,
    surgeIntensity: 'high',
    peakSurgeStart: '01:45',
    peakSurgeEnd: '02:30',
    notes: '2nd/3rd Ave bars + clubs. Mix of downtown hotels and residential rides.',
  },
  {
    zoneId: 'fremont',
    name: 'Fremont',
    closeTime: '02:00',
    barCount: 15,
    surgeIntensity: 'medium',
    peakSurgeStart: '01:50',
    peakSurgeEnd: '02:20',
    notes: 'Smaller but consistent. Less competition from other drivers.',
  },
  {
    zoneId: 'ballard',
    name: 'Ballard',
    closeTime: '02:00',
    barCount: 25,
    surgeIntensity: 'high',
    peakSurgeStart: '01:50',
    peakSurgeEnd: '02:25',
    notes: 'Ballard Ave is packed. Young professionals = good tips.',
  },
  {
    zoneId: 'u_district',
    name: 'U-District',
    closeTime: '02:00',
    barCount: 20,
    surgeIntensity: 'medium',
    peakSurgeStart: '01:45',
    peakSurgeEnd: '02:30',
    notes: 'College bars on The Ave. Shorter rides (dorms/Greek Row) but high volume.',
  },
  {
    zoneId: 'downtown',
    name: 'Downtown',
    closeTime: '02:00',
    barCount: 30,
    surgeIntensity: 'high',
    peakSurgeStart: '01:45',
    peakSurgeEnd: '02:30',
    notes: 'Pioneer Square bars + clubs. Mix of hotel and residential. Watch for problem riders.',
  },
  {
    zoneId: 'queen_anne',
    name: 'Queen Anne',
    closeTime: '02:00',
    barCount: 12,
    surgeIntensity: 'low',
    peakSurgeStart: '01:50',
    peakSurgeEnd: '02:15',
    notes: 'Fewer bars but less driver competition. Residential rides.',
  },
  {
    zoneId: 'wallingford',
    name: 'Wallingford',
    closeTime: '02:00',
    barCount: 8,
    surgeIntensity: 'low',
    peakSurgeStart: '01:50',
    peakSurgeEnd: '02:15',
    notes: 'Small neighborhood bar scene. Mostly locals.',
  },
];

/**
 * Calculate bar close surge impact
 */
export function getBarCloseSurgeImpact(zoneId: string, currentTime: Date): number {
  const barZone = BAR_ZONES.find(z => z.zoneId === zoneId);
  if (!barZone) return 0;

  const hour = currentTime.getHours();
  const minute = currentTime.getMinutes();
  const timeValue = hour * 60 + minute;

  // Convert peak times to minutes
  const [peakStartHour, peakStartMin] = barZone.peakSurgeStart.split(':').map(Number);
  const [peakEndHour, peakEndMin] = barZone.peakSurgeEnd.split(':').map(Number);
  
  let peakStart = peakStartHour * 60 + peakStartMin;
  let peakEnd = peakEndHour * 60 + peakEndMin;

  // Handle midnight crossing
  if (peakStart > 12 * 60) peakStart -= 24 * 60;
  if (peakEnd < 3 * 60) peakEnd += 24 * 60;
  let currentTimeAdjusted = timeValue;
  if (currentTimeAdjusted < 3 * 60) currentTimeAdjusted += 24 * 60;

  // Check if we're in surge window
  if (currentTimeAdjusted >= peakStart && currentTimeAdjusted <= peakEnd) {
    const intensityMultipliers = {
      low: 15,
      medium: 25,
      high: 35,
      extreme: 50,
    };

    return intensityMultipliers[barZone.surgeIntensity];
  }

  return 0;
}

/**
 * Get bar close alerts
 */
export function getBarCloseAlerts(currentTime: Date): string[] {
  const alerts: string[] = [];
  const hour = currentTime.getHours();
  const minute = currentTime.getMinutes();

  // Alert 30 min before close
  if (hour === 1 && minute === 30) {
    const topZones = BAR_ZONES.filter(z => 
      z.surgeIntensity === 'extreme' || z.surgeIntensity === 'high'
    ).sort((a, b) => {
      const intensityOrder = { extreme: 0, high: 1, medium: 2, low: 3 };
      return intensityOrder[a.surgeIntensity] - intensityOrder[b.surgeIntensity];
    });

    alerts.push(`🍺 BARS CLOSING SOON! Position at ${topZones[0].name} NOW for 2am surge!`);
  }

  // Alert at close time
  if (hour === 2 && minute === 0) {
    alerts.push(`🔥 BAR CLOSE SURGE! High demand in Capitol Hill, Belltown, Ballard!`);
  }

  // Weekend bonus alert
  const day = currentTime.getDay();
  if ((day === 5 || day === 6) && hour === 1 && minute === 15) {
    alerts.push(`🎉 Friday/Saturday = MASSIVE bar close surge incoming. Get positioned!`);
  }

  return alerts;
}

/**
 * Get recommended bar zone based on day and time
 */
export function getRecommendedBarZone(currentTime: Date): BarZone | null {
  const hour = currentTime.getHours();
  const day = currentTime.getDay();

  // Only relevant late at night
  if (hour < 1 || hour > 2) return null;

  // Thursday-Saturday = best bar nights
  const isWeekend = day >= 4 && day <= 6;

  if (isWeekend) {
    // Weekends = go for highest intensity
    return BAR_ZONES.find(z => z.surgeIntensity === 'extreme') || BAR_ZONES[0];
  } else {
    // Weekdays = medium zones have less competition
    return BAR_ZONES.find(z => z.surgeIntensity === 'high') || BAR_ZONES[0];
  }
}

