import axios from 'axios';
import { Event } from '../types/index.js';
import { EventBlacklistService } from './eventBlacklist.service.js';
import { SeatGeekService } from './seatgeek.service.js';
import { calculateEndTime, getSurgeWindows } from '../data/eventDurations.js';
import { ESPNService } from './espn.service.js';

export class EventsService {
  private apiKey: string;
  private baseUrl = 'https://app.ticketmaster.com/discovery/v2';
  private blacklistService: EventBlacklistService;
  private seatGeekService: SeatGeekService;
  private espnService: ESPNService;

  getBlacklistService(): EventBlacklistService {
    return this.blacklistService;
  }

  getESPNService(): ESPNService {
    return this.espnService;
  }

  // Map of venue names/keywords to zone IDs
  private venueToZoneMap: Record<string, string> = {
    // SEATTLE CORE
    // Stadiums / Arenas (micro-zones)
    'lumen field': 'stadium_district',
    't-mobile park': 'stadium_district',
    'tmobile park': 'stadium_district',
    'showbox sodo': 'stadium_district',

    // Seattle Center (micro-zone)
    'climate pledge arena': 'seattle_center',
    'seattle center': 'seattle_center',
    'mccaw hall': 'seattle_center',

    // Downtown/Belltown (micro-zones)
    'paramount theatre': 'convention_center',
    'moore theatre': 'belltown_bars',
    'showbox': 'pike_place_market', // The Showbox (1st Ave)
    'crocodile': 'belltown_bars',
    'benaroya hall': 'financial_district',

    // Capitol Hill (micro-zone)
    'neumos': 'pike_pine_bars',

    // UW / U-District (micro-zones)
    'neptune theatre': 'the_ave',
    'uw': 'uw_campus_west',
    'university of washington': 'uw_campus_west',

    // Waterfront (micro-zones)
    'pike place': 'pike_place_market',
    'pier': 'waterfront_piers',

    // NORTH
    'angel of the winds arena': 'everett',
    'everett': 'everett',
    'tulalip': 'marysville',
    'tulalip casino': 'marysville',
    'tulalip resort': 'marysville',
    'marysville': 'marysville',
    'lynnwood': 'lynnwood',
    'alderwood': 'lynnwood',
    'shoreline': 'shoreline',

    // EAST
    'meydenbauer': 'bellevue',
    'bellevue': 'bellevue',
    'redmond': 'redmond',
    'sammamish': 'sammamish',
    'kirkland': 'kirkland',
    'issaquah': 'issaquah',
    'microsoft': 'redmond',

    // SOUTH
    'tacoma dome': 'tacoma',
    'tacoma': 'tacoma',
    'theater on the square': 'tacoma',
    'spanish ballroom': 'tacoma',
    'showare center': 'kent',
    'kent': 'kent',
    'renton': 'renton',
    'the landing': 'renton',
    'tukwila': 'tukwila',
    'southcenter': 'tukwila',
    'burien': 'burien',
    'federal way': 'federal_way',
    'lakewood': 'lakewood',
    'spanaway': 'spanaway',
  };

  constructor(apiKey: string, blacklistService?: EventBlacklistService) {
    this.apiKey = apiKey;
    this.blacklistService = blacklistService || new EventBlacklistService();
    this.seatGeekService = new SeatGeekService();
    this.espnService = new ESPNService();
  }

  async getUpcomingEvents(): Promise<Event[]> {
    // Fetch from multiple sources in parallel
    const [ticketmasterEvents, seatGeekEvents] = await Promise.all([
      this.getTicketmasterEvents(),
      this.seatGeekService.getUpcomingEvents(),
    ]);

    console.log(`🎫 Ticketmaster: ${ticketmasterEvents.length} events`);
    console.log(`🎟️ SeatGeek: ${seatGeekEvents.length} events`);

    // Merge and deduplicate
    const mergedEvents = this.mergeAndDeduplicateEvents(ticketmasterEvents, seatGeekEvents);
    console.log(`📊 Total unique events: ${mergedEvents.length}`);

    return mergedEvents;
  }

  /**
   * Merge events from multiple sources and remove duplicates
   */
  private mergeAndDeduplicateEvents(ticketmaster: Event[], seatGeek: Event[]): Event[] {
    const uniqueEvents = new Map<string, Event>();

    // Add Ticketmaster events first (higher priority)
    for (const event of ticketmaster) {
      const key = this.getEventKey(event);
      uniqueEvents.set(key, event);
    }

    // Add SeatGeek events (skip if duplicate)
    for (const event of seatGeek) {
      const key = this.getEventKey(event);
      if (!uniqueEvents.has(key)) {
        uniqueEvents.set(key, event);
      }
    }

    // Sort by start time
    return Array.from(uniqueEvents.values())
      .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());
  }

  /**
   * Create a unique key for event deduplication
   * Based on venue + approximate start time (same hour)
   */
  private getEventKey(event: Event): string {
    const venueLower = event.venue.toLowerCase().replace(/[^a-z]/g, '');
    const startDate = new Date(event.startTime);
    const dateHour = `${startDate.toISOString().slice(0, 13)}`; // YYYY-MM-DDTHH
    
    // Also include first word of event name for better matching
    const nameStart = event.name.toLowerCase().split(/\s+/)[0].replace(/[^a-z]/g, '');
    
    return `${venueLower}-${dateHour}-${nameStart}`;
  }

  private async getTicketmasterEvents(): Promise<Event[]> {
    const hasValidKey = this.apiKey && this.apiKey.length > 10 && this.apiKey !== 'your_key_here';
    
    if (!hasValidKey) {
      // Return mock events if no API key
      return this.getMockEvents();
    }

    try {
      // Ticketmaster API date format: YYYY-MM-DDTHH:mm:ssZ
      const now = new Date();
      const startDate = now.toISOString().split('.')[0] + 'Z'; // Remove milliseconds
      
      // Get events for today and tomorrow
      const tomorrow = new Date(now);
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(23, 59, 59, 0);
      const endDate = tomorrow.toISOString().split('.')[0] + 'Z';

      // Use radius search centered on Seattle metro area
      // Center point: approximately between Seattle and Tacoma
      const centerLat = 47.5500;
      const centerLng = -122.2000;
      const radiusKm = 50; // 50km radius covers Marysville to Spanaway

      const response = await axios.get(`${this.baseUrl}/events.json`, {
        params: {
          apikey: this.apiKey,
          geoPoint: `${centerLat},${centerLng}`,
          radius: radiusKm,
          unit: 'km',
          startDateTime: startDate,
          endDateTime: endDate,
          size: 100, // Get more events since we're covering larger area
          sort: 'date,asc',
        },
      });

      const events = response.data._embedded?.events || [];

      // Filter out suspicious/non-public events and canceled/postponed
      const validEvents = events.filter((event: any) => {
        const name = event.name?.toLowerCase() || '';
        const status = event.dates?.status?.code?.toLowerCase() || '';
        
        // Exclude canceled, postponed, rescheduled events
        if (status === 'cancelled' || status === 'canceled') return false;
        if (status === 'postponed') return false;
        if (status === 'rescheduled') return false;
        
        // Exclude non-public/junk events by keywords
        const junkKeywords = [
          'suite pass', 'guest pass', 'vip pass', 'vip package',
          'parking pass', 'upgrade', 'meet and greet pass',
          'early entry', 'soundcheck', 'pre-party pass',
          'lounge access', 'club access'
        ];
        
        for (const keyword of junkKeywords) {
          if (name.includes(keyword)) return false;
        }
        
        // Exclude if name is just "suite" or "pass" alone
        if (name.includes('suite') && name.includes('pass')) return false;
        
        return true;
      });

      // Further filter out blacklisted events
      const nonBlacklistedEvents = validEvents.filter((event: any) => {
        return !this.blacklistService.isBlacklisted(event.id, event.name);
      });

      const mappedEvents: Event[] = nonBlacklistedEvents.map((event: any) => {
        const venue = event._embedded?.venues?.[0];
        const venueName = venue?.name?.toLowerCase() || '';
        const venueCity = venue?.city?.name?.toLowerCase() || '';
        const zoneId = this.mapVenueToZone(venueName, venueCity);
        const eventType = this.classifyEvent(event);

        // Get the best image (prefer 16:9 ratio or largest width)
        let imageUrl: string | undefined;
        if (event.images && event.images.length > 0) {
          // Sort by width descending and prefer ratio close to 16:9
          const sortedImages = [...event.images].sort((a: any, b: any) => {
            const ratioA = a.width && a.height ? a.width / a.height : 0;
            const ratioB = b.width && b.height ? b.width / b.height : 0;
            const targetRatio = 16 / 9;
            const diffA = Math.abs(ratioA - targetRatio);
            const diffB = Math.abs(ratioB - targetRatio);
            
            // If one is much closer to 16:9, prefer it
            if (Math.abs(diffA - diffB) > 0.3) {
              return diffA - diffB;
            }
            // Otherwise prefer larger width
            return (b.width || 0) - (a.width || 0);
          });
          imageUrl = sortedImages[0]?.url;
        }

        const startTime = event.dates.start.dateTime || event.dates.start.localDate;
        const venueFull = venue?.name || 'Unknown Venue';
        const eventName = event.name;
        
        // Use smart duration database for accurate end time
        const { endTime, duration } = calculateEndTime(startTime, venueFull, eventType, eventName);
        
        // Get surge windows for this event
        const surgeWindows = getSurgeWindows(startTime, venueFull, eventType, eventName);

        return {
          name: eventName,
          venue: venueFull,
          startTime,
          endTime,
          zoneId,
          type: eventType,
          attendees: event.sales?.public?.startDateTime ? 1000 : undefined,
          imageUrl,
          url: event.url,
          // Enhanced data from duration database
          durationMinutes: duration.typical,
          surgeWindows,
        };
      });
      
      return mappedEvents.filter((e: Event) => e.zoneId !== 'unknown');
    } catch (error) {
      console.error('Error fetching Ticketmaster events:', error);
      return this.getMockEvents();
    }
  }

  private mapVenueToZone(venueName: string, venueCity: string = ''): string {
    const lowerVenue = venueName.toLowerCase();
    const lowerCity = venueCity.toLowerCase();

    for (const [keyword, zoneId] of Object.entries(this.venueToZoneMap)) {
      if (lowerVenue.includes(keyword)) {
        return zoneId;
      }
    }

    // Try to map by city name if venue name doesn't match
    const cityOrVenue = `${lowerVenue} ${lowerCity}`;

    // Seattle fallback: if we know it's Seattle but can't map venue,
    // default to a central micro-zone rather than dropping it.
    if (lowerCity.includes('seattle') || lowerVenue.includes('seattle')) return 'retail_core';

    if (cityOrVenue.includes('everett')) return 'everett';
    if (cityOrVenue.includes('marysville')) return 'marysville';
    if (cityOrVenue.includes('lynnwood')) return 'lynnwood';
    if (cityOrVenue.includes('bellevue')) return 'bellevue';
    if (cityOrVenue.includes('redmond')) return 'redmond';
    if (cityOrVenue.includes('sammamish')) return 'sammamish';
    if (cityOrVenue.includes('kirkland')) return 'kirkland';
    if (cityOrVenue.includes('issaquah')) return 'issaquah';
    if (cityOrVenue.includes('tacoma')) return 'tacoma';
    if (cityOrVenue.includes('kent')) return 'kent';
    if (cityOrVenue.includes('renton')) return 'renton';
    if (cityOrVenue.includes('tukwila')) return 'tukwila';
    if (cityOrVenue.includes('burien')) return 'burien';
    if (cityOrVenue.includes('federal way')) return 'federal_way';
    if (cityOrVenue.includes('lakewood')) return 'lakewood';
    if (cityOrVenue.includes('spanaway')) return 'spanaway';

    // Default to unknown for venues outside our coverage area
    return 'unknown';
  }

  private classifyEvent(event: any): 'sports' | 'concert' | 'conference' | 'festival' | 'other' {
    const name = event.name.toLowerCase();
    const classifications = event.classifications || [];

    // Check official classification first
    for (const classification of classifications) {
      const segment = classification.segment?.name?.toLowerCase() || '';
      const genre = classification.genre?.name?.toLowerCase() || '';

      if (segment.includes('sports')) return 'sports';
      if (segment.includes('music') || genre.includes('concert')) return 'concert';
    }

    // Fallback to name-based classification
    if (name.includes('game') || name.includes('vs') || name.includes('seahawks') || 
        name.includes('mariners') || name.includes('sounders') || name.includes('kraken')) {
      return 'sports';
    }
    if (name.includes('concert') || name.includes('tour') || name.includes('live')) {
      return 'concert';
    }
    if (name.includes('conference') || name.includes('summit') || name.includes('expo')) {
      return 'conference';
    }
    if (name.includes('festival') || name.includes('fest')) {
      return 'festival';
    }

    return 'other';
  }

  private getMockEvents(): Event[] {
    const now = new Date();
    const events: Event[] = [];

    // Mock Seahawks game (if it's a Sunday)
    if (now.getDay() === 0) {
      const gameTime = new Date(now);
      gameTime.setHours(13, 0, 0, 0); // 1 PM game

      if (gameTime > now) {
        events.push({
          name: 'Seattle Seahawks vs. Opponent',
          venue: 'Lumen Field',
          startTime: gameTime.toISOString(),
          endTime: new Date(gameTime.getTime() + 3.5 * 60 * 60 * 1000).toISOString(),
          zoneId: 'stadium',
          type: 'sports',
          attendees: 68000,
          imageUrl: 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?w=400',
          url: 'https://www.seahawks.com',
        });
      }
    }

    // Mock evening concert
    const concertTime = new Date(now);
    concertTime.setHours(20, 0, 0, 0);

    if (concertTime > now) {
      events.push({
        name: 'Live Music Event',
        venue: 'Climate Pledge Arena',
        startTime: concertTime.toISOString(),
        endTime: new Date(concertTime.getTime() + 2.5 * 60 * 60 * 1000).toISOString(),
        zoneId: 'queen_anne',
        type: 'concert',
        attendees: 15000,
        imageUrl: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=400',
        url: 'https://www.climatepledgearena.com',
      });
    }

    return events;
  }
}

