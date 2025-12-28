import { TimePattern } from '../types/index.js';

// Define baseline scores for each zone by day of week and hour
// Score represents base demand level (0-50)
// 0 = Sunday, 1 = Monday, ... 6 = Saturday

interface ZonePatterns {
  [zoneId: string]: Map<number, Map<number, number>>; // zoneId -> dayOfWeek -> hour -> score
}

// Temporary structure to build the maps
const rawTimePatterns: { [zoneId: string]: TimePattern[] } = {
  seatac: [
    // Early morning flights (4am-8am) - all days high
    ...Array.from({ length: 7 }, (_, day) => 
      Array.from({ length: 4 }, (_, i) => ({
        hour: 4 + i,
        dayOfWeek: day,
        score: 35,
      }))
    ).flat(),
    // Late evening flights (6pm-10pm) - all days moderate
    ...Array.from({ length: 7 }, (_, day) => 
      Array.from({ length: 4 }, (_, i) => ({
        hour: 18 + i,
        dayOfWeek: day,
        score: 30,
      }))
    ).flat(),
    // Sunday morning (people leaving after weekend)
    ...Array.from({ length: 4 }, (_, i) => ({
      hour: 8 + i,
      dayOfWeek: 0,
      score: 40,
    })),
  ],
  
  downtown: [
    // Weekday morning commute (7am-9am)
    ...Array.from({ length: 5 }, (_, day) => 
      Array.from({ length: 2 }, (_, i) => ({
        hour: 7 + i,
        dayOfWeek: day + 1,
        score: 35,
      }))
    ).flat(),
    // Weekday evening commute (5pm-7pm)
    ...Array.from({ length: 5 }, (_, day) => 
      Array.from({ length: 2 }, (_, i) => ({
        hour: 17 + i,
        dayOfWeek: day + 1,
        score: 40,
      }))
    ).flat(),
    // Weekend lunch/shopping (11am-3pm)
    ...[0, 6].flatMap(day =>
      Array.from({ length: 4 }, (_, i) => ({
        hour: 11 + i,
        dayOfWeek: day,
        score: 30,
      }))
    ),
  ],

  capitol_hill: [
    // Friday/Saturday late night (10pm-2am)
    ...[5, 6].flatMap(day =>
      Array.from({ length: 4 }, (_, i) => ({
        hour: 22 + i,
        dayOfWeek: day,
        score: 45,
      }))
    ),
    // Thursday night (9pm-12am)
    ...Array.from({ length: 3 }, (_, i) => ({
      hour: 21 + i,
      dayOfWeek: 4,
      score: 35,
    })),
    // Weekend dinner (6pm-9pm)
    ...[5, 6].flatMap(day =>
      Array.from({ length: 3 }, (_, i) => ({
        hour: 18 + i,
        dayOfWeek: day,
        score: 30,
      }))
    ),
  ],

  slu: [
    // Weekday morning arrival (7am-9am)
    ...Array.from({ length: 5 }, (_, day) => 
      Array.from({ length: 2 }, (_, i) => ({
        hour: 7 + i,
        dayOfWeek: day + 1,
        score: 40,
      }))
    ).flat(),
    // Weekday evening departure (5pm-7pm)
    ...Array.from({ length: 5 }, (_, day) => 
      Array.from({ length: 2 }, (_, i) => ({
        hour: 17 + i,
        dayOfWeek: day + 1,
        score: 45,
      }))
    ).flat(),
    // Weekday lunch (11am-1pm)
    ...Array.from({ length: 5 }, (_, day) => 
      Array.from({ length: 2 }, (_, i) => ({
        hour: 11 + i,
        dayOfWeek: day + 1,
        score: 25,
      }))
    ).flat(),
  ],

  u_district: [
    // Weekday class times (9am-4pm)
    ...Array.from({ length: 5 }, (_, day) => 
      Array.from({ length: 7 }, (_, i) => ({
        hour: 9 + i,
        dayOfWeek: day + 1,
        score: 25,
      }))
    ).flat(),
    // Weekend evenings (7pm-11pm)
    ...[5, 6].flatMap(day =>
      Array.from({ length: 4 }, (_, i) => ({
        hour: 19 + i,
        dayOfWeek: day,
        score: 30,
      }))
    ),
  ],

  belltown: [
    // Friday/Saturday night (9pm-2am)
    ...[5, 6].flatMap(day =>
      Array.from({ length: 5 }, (_, i) => ({
        hour: 21 + i,
        dayOfWeek: day,
        score: 40,
      }))
    ),
    // Weekend dinner (6pm-9pm)
    ...[5, 6].flatMap(day =>
      Array.from({ length: 3 }, (_, i) => ({
        hour: 18 + i,
        dayOfWeek: day,
        score: 30,
      }))
    ),
  ],

  ballard: [
    // Friday/Saturday late night (9pm-1am)
    ...[5, 6].flatMap(day =>
      Array.from({ length: 4 }, (_, i) => ({
        hour: 21 + i,
        dayOfWeek: day,
        score: 38,
      }))
    ),
    // Sunday brunch (10am-2pm)
    ...Array.from({ length: 4 }, (_, i) => ({
      hour: 10 + i,
      dayOfWeek: 0,
      score: 32,
    })),
  ],

  fremont: [
    // Sunday market (9am-2pm)
    ...Array.from({ length: 5 }, (_, i) => ({
      hour: 9 + i,
      dayOfWeek: 0,
      score: 35,
    })),
    // Weekend evenings (6pm-10pm)
    ...[5, 6].flatMap(day =>
      Array.from({ length: 4 }, (_, i) => ({
        hour: 18 + i,
        dayOfWeek: day,
        score: 28,
      }))
    ),
  ],

  queen_anne: [
    // Event nights at Climate Pledge (varies, but moderate baseline 6pm-10pm)
    ...Array.from({ length: 7 }, (_, day) => 
      Array.from({ length: 4 }, (_, i) => ({
        hour: 18 + i,
        dayOfWeek: day,
        score: 25,
      }))
    ).flat(),
  ],

  stadium: [
    // Event times (6pm-10pm, will be boosted by actual events)
    ...Array.from({ length: 7 }, (_, day) => 
      Array.from({ length: 4 }, (_, i) => ({
        hour: 18 + i,
        dayOfWeek: day,
        score: 20,
      }))
    ).flat(),
  ],

  pioneer_square: [
    // Friday/Saturday night (9pm-2am)
    ...[5, 6].flatMap(day =>
      Array.from({ length: 5 }, (_, i) => ({
        hour: 21 + i,
        dayOfWeek: day,
        score: 35,
      }))
    ),
  ],

  waterfront: [
    // Weekend days (10am-6pm)
    ...[0, 6].flatMap(day =>
      Array.from({ length: 8 }, (_, i) => ({
        hour: 10 + i,
        dayOfWeek: day,
        score: 35,
      }))
    ),
    // Summer weekdays (11am-5pm) - moderate baseline
    ...Array.from({ length: 5 }, (_, day) => 
      Array.from({ length: 6 }, (_, i) => ({
        hour: 11 + i,
        dayOfWeek: day + 1,
        score: 25,
      }))
    ).flat(),
  ],
};

// Helper function to create standard suburban patterns
function createSuburbanPattern(): TimePattern[] {
  return [
    // Weekday morning commute (6am-9am)
    ...Array.from({ length: 5 }, (_, day) => 
      Array.from({ length: 3 }, (_, i) => ({
        hour: 6 + i,
        dayOfWeek: day + 1,
        score: 25,
      }))
    ).flat(),
    // Weekday evening commute (4pm-7pm)
    ...Array.from({ length: 5 }, (_, day) => 
      Array.from({ length: 3 }, (_, i) => ({
        hour: 16 + i,
        dayOfWeek: day + 1,
        score: 28,
      }))
    ).flat(),
    // Weekend evenings (6pm-10pm)
    ...Array.from({ length: 2 }, (_, day) => 
      Array.from({ length: 4 }, (_, i) => ({
        hour: 18 + i,
        dayOfWeek: day === 0 ? 6 : 0,
        score: 22,
      }))
    ).flat(),
  ];
}

// Add patterns for new zones
rawTimePatterns.marysville = createSuburbanPattern();
rawTimePatterns.everett = createSuburbanPattern();
rawTimePatterns.lynnwood = createSuburbanPattern();
rawTimePatterns.shoreline = createSuburbanPattern();
rawTimePatterns.bellevue = createSuburbanPattern();
rawTimePatterns.redmond = createSuburbanPattern();
rawTimePatterns.sammamish = createSuburbanPattern();
rawTimePatterns.kirkland = createSuburbanPattern();
rawTimePatterns.issaquah = createSuburbanPattern();
rawTimePatterns.renton = createSuburbanPattern();
rawTimePatterns.tukwila = createSuburbanPattern();
rawTimePatterns.burien = createSuburbanPattern();
rawTimePatterns.federal_way = createSuburbanPattern();
rawTimePatterns.kent = createSuburbanPattern();
rawTimePatterns.tacoma = createSuburbanPattern();
rawTimePatterns.lakewood = createSuburbanPattern();
rawTimePatterns.spanaway = createSuburbanPattern();

export const timePatterns: ZonePatterns = Object.entries(rawTimePatterns).reduce((acc, [zoneId, patterns]) => {
  const dayMap = new Map<number, Map<number, number>>();
  for (const p of patterns) {
    if (!dayMap.has(p.dayOfWeek)) {
      dayMap.set(p.dayOfWeek, new Map<number, number>());
    }
    dayMap.get(p.dayOfWeek)!.set(p.hour, p.score);
  }
  acc[zoneId] = dayMap;
  return acc;
}, {} as ZonePatterns);

export function getBaselineScore(zoneId: string, dayOfWeek: number, hour: number): number {
  const dayMap = timePatterns[zoneId];
  if (!dayMap) return 10; // Default low baseline
  
  return dayMap.get(dayOfWeek)?.get(hour) ?? 10;
}

