/**
 * Dead Zones - Times/places to AVOID
 * 
 * Some zones are dead at certain times. Don't waste gas/time there.
 */

export interface DeadZoneWarning {
  zoneId: string;
  zoneName: string;
  timeWindow: {
    start: string; // "14:00"
    end: string;   // "17:00"
  };
  daysOfWeek: number[]; // 0-6, Sunday = 0
  reason: string;
  severity: 'mild' | 'moderate' | 'severe';
  alternativeZones: string[];
}

export const DEAD_ZONES: DeadZoneWarning[] = [
  {
    zoneId: 'downtown',
    zoneName: 'Downtown',
    timeWindow: { start: '02:30', end: '05:00' },
    daysOfWeek: [0, 1, 2, 3, 4, 5, 6],
    reason: 'Bars closed, no business traffic yet. Ghost town.',
    severity: 'severe',
    alternativeZones: ['seatac'],
  },
  {
    zoneId: 'belltown',
    zoneName: 'Belltown',
    timeWindow: { start: '03:00', end: '06:00' },
    daysOfWeek: [0, 1, 2, 3, 4, 5, 6],
    reason: 'Post-bar close dead period.',
    severity: 'severe',
    alternativeZones: ['seatac'],
  },
  {
    zoneId: 'capitol_hill',
    zoneName: 'Capitol Hill',
    timeWindow: { start: '03:00', end: '06:00' },
    daysOfWeek: [0, 1, 2, 3, 4, 5, 6],
    reason: 'After bar surge ends, completely dead.',
    severity: 'severe',
    alternativeZones: ['seatac'],
  },
  {
    zoneId: 'u_district',
    zoneName: 'U-District',
    timeWindow: { start: '14:00', end: '16:00' },
    daysOfWeek: [1, 2, 3, 4, 5], // Weekdays
    reason: 'Students in class. Low demand.',
    severity: 'moderate',
    alternativeZones: ['downtown', 'bellevue'],
  },
  {
    zoneId: 'stadium',
    zoneName: 'SoDo/Stadium',
    timeWindow: { start: '10:00', end: '15:00' },
    daysOfWeek: [1, 2, 3, 4], // Mon-Thu (no games)
    reason: 'No events = industrial wasteland. Zero demand.',
    severity: 'severe',
    alternativeZones: ['downtown', 'capitol_hill'],
  },
  {
    zoneId: 'fremont',
    zoneName: 'Fremont',
    timeWindow: { start: '22:00', end: '01:00' },
    daysOfWeek: [0, 1, 2, 3, 4], // Sun-Thu
    reason: 'Quiet neighborhood. Early close times.',
    severity: 'mild',
    alternativeZones: ['capitol_hill', 'belltown'],
  },
  {
    zoneId: 'ballard',
    zoneName: 'Ballard',
    timeWindow: { start: '03:00', end: '07:00' },
    daysOfWeek: [0, 1, 2, 3, 4, 5, 6],
    reason: 'Residential area, dead after bars close.',
    severity: 'moderate',
    alternativeZones: ['seatac', 'downtown'],
  },
  {
    zoneId: 'magnolia',
    zoneName: 'Magnolia',
    timeWindow: { start: '20:00', end: '07:00' },
    daysOfWeek: [0, 1, 2, 3, 4, 5, 6],
    reason: 'Residential, no nightlife. Dead except cruise days.',
    severity: 'severe',
    alternativeZones: ['ballard', 'queen_anne'],
  },
];

/**
 * Check if a zone is currently dead
 */
export function isDeadZone(zoneId: string, currentTime: Date = new Date()): DeadZoneWarning | null {
  const hour = currentTime.getHours();
  const minute = currentTime.getMinutes();
  const timeValue = hour * 60 + minute;
  const dayOfWeek = currentTime.getDay();

  for (const warning of DEAD_ZONES) {
    if (warning.zoneId !== zoneId) continue;
    if (!warning.daysOfWeek.includes(dayOfWeek)) continue;

    const [startHour, startMin] = warning.timeWindow.start.split(':').map(Number);
    const [endHour, endMin] = warning.timeWindow.end.split(':').map(Number);
    
    let startTime = startHour * 60 + startMin;
    let endTime = endHour * 60 + endMin;

    // Handle midnight crossing
    if (endTime < startTime) {
      // Time window crosses midnight
      if (timeValue >= startTime || timeValue <= endTime) {
        return warning;
      }
    } else {
      if (timeValue >= startTime && timeValue <= endTime) {
        return warning;
      }
    }
  }

  return null;
}

/**
 * Get all current dead zone warnings
 */
export function getCurrentDeadZones(currentTime: Date = new Date()): DeadZoneWarning[] {
  const warnings: DeadZoneWarning[] = [];
  
  const uniqueZones = [...new Set(DEAD_ZONES.map(d => d.zoneId))];
  
  for (const zoneId of uniqueZones) {
    const warning = isDeadZone(zoneId, currentTime);
    if (warning) {
      warnings.push(warning);
    }
  }

  return warnings;
}

/**
 * Get dead zone penalty for scoring
 */
export function getDeadZonePenalty(zoneId: string, currentTime: Date = new Date()): number {
  const warning = isDeadZone(zoneId, currentTime);
  if (!warning) return 0;

  const penalties = {
    mild: -10,
    moderate: -20,
    severe: -35,
  };

  return penalties[warning.severity];
}

