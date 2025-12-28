/**
 * Event Duration Database
 * 
 * Provides accurate event duration estimates based on:
 * 1. Venue-specific data (most accurate)
 * 2. Event type defaults
 * 3. Historical averages
 * 
 * Durations are in minutes.
 */

export interface DurationInfo {
  typical: number;      // Most common duration
  minimum: number;      // Shortest expected
  maximum: number;      // Longest expected (overtime, encores)
  bufferBefore: number; // Minutes before event for early arrivals
  bufferAfter: number;  // Minutes after event ends for stragglers
}

// Venue-specific durations (Seattle area)
export const VENUE_DURATIONS: Record<string, DurationInfo> = {
  // Major Sports Venues
  'lumen field': {
    typical: 195,    // NFL games ~3h 15m
    minimum: 165,
    maximum: 240,    // Overtime
    bufferBefore: 60,
    bufferAfter: 45,
  },
  't-mobile park': {
    typical: 180,    // MLB games ~3h
    minimum: 150,
    maximum: 240,    // Extra innings
    bufferBefore: 45,
    bufferAfter: 30,
  },
  'climate pledge arena': {
    typical: 165,    // NHL/concerts ~2h 45m
    minimum: 120,
    maximum: 210,
    bufferBefore: 45,
    bufferAfter: 30,
  },
  'husky stadium': {
    typical: 210,    // College football ~3h 30m
    minimum: 180,
    maximum: 270,
    bufferBefore: 90,  // Tailgating!
    bufferAfter: 45,
  },
  'alaska airlines arena': {
    typical: 120,    // Basketball ~2h
    minimum: 100,
    maximum: 150,
    bufferBefore: 30,
    bufferAfter: 20,
  },

  // Concert Venues
  'paramount theatre': {
    typical: 150,    // Theater shows ~2h 30m
    minimum: 90,
    maximum: 180,
    bufferBefore: 30,
    bufferAfter: 20,
  },
  'moore theatre': {
    typical: 150,
    minimum: 90,
    maximum: 180,
    bufferBefore: 30,
    bufferAfter: 20,
  },
  'benaroya hall': {
    typical: 120,    // Symphony ~2h
    minimum: 90,
    maximum: 150,
    bufferBefore: 30,
    bufferAfter: 20,
  },
  'mccaw hall': {
    typical: 150,    // Opera/Ballet ~2h 30m
    minimum: 120,
    maximum: 180,
    bufferBefore: 30,
    bufferAfter: 20,
  },
  'showbox': {
    typical: 150,    // Live music
    minimum: 90,
    maximum: 210,
    bufferBefore: 30,
    bufferAfter: 20,
  },
  'the crocodile': {
    typical: 150,
    minimum: 90,
    maximum: 210,
    bufferBefore: 30,
    bufferAfter: 20,
  },
  'neumos': {
    typical: 150,
    minimum: 90,
    maximum: 210,
    bufferBefore: 30,
    bufferAfter: 20,
  },
  'neptune theatre': {
    typical: 120,
    minimum: 90,
    maximum: 150,
    bufferBefore: 20,
    bufferAfter: 15,
  },

  // Regional Venues
  'tacoma dome': {
    typical: 180,    // Concerts/events ~3h
    minimum: 120,
    maximum: 240,
    bufferBefore: 45,
    bufferAfter: 45,
  },
  'angel of the winds arena': {
    typical: 165,    // Silvertips hockey
    minimum: 140,
    maximum: 200,
    bufferBefore: 30,
    bufferAfter: 25,
  },
  'accesso showare center': {
    typical: 165,
    minimum: 140,
    maximum: 200,
    bufferBefore: 30,
    bufferAfter: 25,
  },
  'showare center': {
    typical: 165,
    minimum: 140,
    maximum: 200,
    bufferBefore: 30,
    bufferAfter: 25,
  },
  'tulalip resort casino': {
    typical: 120,    // Shows
    minimum: 90,
    maximum: 150,
    bufferBefore: 30,
    bufferAfter: 20,
  },
  'meydenbauer center': {
    typical: 180,    // Conferences
    minimum: 60,
    maximum: 480,
    bufferBefore: 30,
    bufferAfter: 30,
  },
};

// Event type defaults (when venue not matched)
export const EVENT_TYPE_DURATIONS: Record<string, DurationInfo> = {
  sports: {
    typical: 180,
    minimum: 120,
    maximum: 240,
    bufferBefore: 45,
    bufferAfter: 30,
  },
  concert: {
    typical: 150,
    minimum: 90,
    maximum: 210,
    bufferBefore: 30,
    bufferAfter: 20,
  },
  festival: {
    typical: 600,   // 10 hours
    minimum: 360,
    maximum: 720,
    bufferBefore: 60,
    bufferAfter: 60,
  },
  conference: {
    typical: 480,   // 8 hours
    minimum: 240,
    maximum: 600,
    bufferBefore: 30,
    bufferAfter: 30,
  },
  theater: {
    typical: 150,
    minimum: 90,
    maximum: 180,
    bufferBefore: 30,
    bufferAfter: 15,
  },
  comedy: {
    typical: 90,
    minimum: 60,
    maximum: 120,
    bufferBefore: 20,
    bufferAfter: 15,
  },
  other: {
    typical: 150,
    minimum: 60,
    maximum: 240,
    bufferBefore: 30,
    bufferAfter: 20,
  },
};

// Sport-specific durations (more precise than generic "sports")
export const SPORT_DURATIONS: Record<string, DurationInfo> = {
  nfl: {
    typical: 195,    // 3h 15m
    minimum: 165,
    maximum: 240,
    bufferBefore: 60,
    bufferAfter: 45,
  },
  mlb: {
    typical: 180,    // 3h
    minimum: 150,
    maximum: 270,    // Extra innings can go long
    bufferBefore: 45,
    bufferAfter: 30,
  },
  nhl: {
    typical: 165,    // 2h 45m
    minimum: 140,
    maximum: 210,    // Overtime
    bufferBefore: 30,
    bufferAfter: 25,
  },
  nba: {
    typical: 150,    // 2h 30m
    minimum: 120,
    maximum: 180,
    bufferBefore: 30,
    bufferAfter: 20,
  },
  wnba: {
    typical: 120,    // 2h
    minimum: 100,
    maximum: 150,
    bufferBefore: 30,
    bufferAfter: 20,
  },
  mls: {
    typical: 135,    // 2h 15m
    minimum: 120,
    maximum: 165,    // Extra time + penalties
    bufferBefore: 30,
    bufferAfter: 20,
  },
  ncaaf: {
    typical: 210,    // 3h 30m (college = more stoppages)
    minimum: 180,
    maximum: 270,
    bufferBefore: 90,  // Tailgating
    bufferAfter: 45,
  },
  ncaab: {
    typical: 120,
    minimum: 100,
    maximum: 150,
    bufferBefore: 30,
    bufferAfter: 20,
  },
};

// Keywords to identify sport type from event name
export const SPORT_KEYWORDS: Record<string, string[]> = {
  nfl: ['seahawks', 'nfl', 'football'],
  mlb: ['mariners', 'mlb', 'baseball'],
  nhl: ['kraken', 'nhl', 'hockey'],
  mls: ['sounders', 'mls', 'soccer', 'fc'],
  wnba: ['storm', 'wnba'],
  ncaaf: ['huskies football', 'cougars football', 'college football'],
  ncaab: ['huskies basketball', 'college basketball'],
};

/**
 * Get duration info for an event
 * Priority: Venue > Sport Type > Event Type > Default
 */
export function getEventDuration(
  venue: string,
  eventType: string,
  eventName: string
): DurationInfo {
  const venueLower = venue.toLowerCase();
  const nameLower = eventName.toLowerCase();

  // 1. Try venue-specific duration
  for (const [venueKey, duration] of Object.entries(VENUE_DURATIONS)) {
    if (venueLower.includes(venueKey)) {
      return duration;
    }
  }

  // 2. Try sport-specific duration (for sports events)
  if (eventType === 'sports') {
    for (const [sport, keywords] of Object.entries(SPORT_KEYWORDS)) {
      if (keywords.some(k => nameLower.includes(k))) {
        return SPORT_DURATIONS[sport] || EVENT_TYPE_DURATIONS.sports;
      }
    }
    return EVENT_TYPE_DURATIONS.sports;
  }

  // 3. Fall back to event type
  return EVENT_TYPE_DURATIONS[eventType] || EVENT_TYPE_DURATIONS.other;
}

/**
 * Calculate end time with optional buffer
 */
export function calculateEndTime(
  startTime: string,
  venue: string,
  eventType: string,
  eventName: string,
  includeBuffer: boolean = false
): { endTime: string; duration: DurationInfo } {
  const duration = getEventDuration(venue, eventType, eventName);
  const start = new Date(startTime);
  
  let totalMinutes = duration.typical;
  if (includeBuffer) {
    totalMinutes += duration.bufferAfter;
  }

  const endTime = new Date(start.getTime() + totalMinutes * 60 * 1000);
  
  return {
    endTime: endTime.toISOString(),
    duration,
  };
}

/**
 * Get surge windows for an event
 * Returns times when ride demand will spike
 */
export function getSurgeWindows(
  startTime: string,
  venue: string,
  eventType: string,
  eventName: string
): { preSurge: { start: string; end: string }; postSurge: { start: string; end: string } } {
  const duration = getEventDuration(venue, eventType, eventName);
  const start = new Date(startTime);
  const end = new Date(start.getTime() + duration.typical * 60 * 1000);

  return {
    // Pre-event surge: people arriving
    preSurge: {
      start: new Date(start.getTime() - duration.bufferBefore * 60 * 1000).toISOString(),
      end: new Date(start.getTime() + 15 * 60 * 1000).toISOString(), // 15 min after start
    },
    // Post-event surge: people leaving
    postSurge: {
      start: new Date(end.getTime() - 15 * 60 * 1000).toISOString(), // 15 min before end
      end: new Date(end.getTime() + duration.bufferAfter * 60 * 1000).toISOString(),
    },
  };
}


