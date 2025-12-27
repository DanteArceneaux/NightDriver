import axios from 'axios';
import { Event } from '../types/index.js';

export class EventsService {
  private apiKey: string;
  private baseUrl = 'https://app.ticketmaster.com/discovery/v2';

  // Map of venue names/keywords to zone IDs
  private venueToZoneMap: Record<string, string> = {
    // SEATTLE CORE
    'lumen field': 'stadium',
    't-mobile park': 'stadium',
    'tmobile park': 'stadium',
    'climate pledge arena': 'queen_anne',
    'paramount theatre': 'downtown',
    'moore theatre': 'belltown',
    'showbox': 'downtown',
    'crocodile': 'belltown',
    'neumos': 'capitol_hill',
    'neptune theatre': 'u_district',
    'uw': 'u_district',
    'university of washington': 'u_district',
    'pike place': 'waterfront',
    'pier': 'waterfront',
    'seattle center': 'queen_anne',
    'mccaw hall': 'downtown',
    'benaroya hall': 'downtown',

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

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async getUpcomingEvents(): Promise<Event[]> {
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

      // Query multiple cities in the metro area
      // Ticketmaster API doesn't support multiple cities in one query, so we need to make multiple requests
      const cities = ['Seattle', 'Tacoma', 'Everett', 'Bellevue', 'Renton', 'Federal Way'];
      
      const allEventPromises = cities.map(city =>
        axios.get(`${this.baseUrl}/events.json`, {
          params: {
            apikey: this.apiKey,
            city: city,
            stateCode: 'WA',
            startDateTime: startDate,
            endDateTime: endDate,
            size: 30,
            sort: 'date,asc',
          },
        }).catch(err => {
          console.log(`Failed to fetch events for ${city}:`, err.message);
          return { data: { _embedded: { events: [] } } };
        })
      );

      const responses = await Promise.all(allEventPromises);
      
      // Combine all events and remove duplicates by event ID
      const allEvents: any[] = [];
      const seenEventIds = new Set<string>();
      
      for (const response of responses) {
        const cityEvents = response.data._embedded?.events || [];
        for (const event of cityEvents) {
          if (!seenEventIds.has(event.id)) {
            seenEventIds.add(event.id);
            allEvents.push(event);
          }
        }
      }

      const events = allEvents;

      // Filter out suspicious/non-public events
      const validEvents = events.filter((event: any) => {
        const name = event.name?.toLowerCase() || '';
        // Exclude suite passes, guest passes, and other non-public events
        if (name.includes('suite') && name.includes('pass')) return false;
        if (name.includes('guest pass')) return false;
        if (name.includes('vip pass')) return false;
        return true;
      });

      return validEvents.map((event: any) => {
        const venue = event._embedded?.venues?.[0];
        const venueName = venue?.name?.toLowerCase() || '';
        const zoneId = this.mapVenueToZone(venueName);
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
        const endTime = this.estimateEndTime(startTime, eventType);

        return {
          name: event.name,
          venue: venue?.name || 'Unknown Venue',
          startTime,
          endTime,
          zoneId,
          type: eventType,
          attendees: event.sales?.public?.startDateTime ? 1000 : undefined,
          imageUrl,
          url: event.url,
        };
      }).filter((e: Event) => e.zoneId !== 'unknown');
    } catch (error) {
      console.error('Error fetching events:', error);
      return this.getMockEvents();
    }
  }

  private mapVenueToZone(venueName: string): string {
    const lowerVenue = venueName.toLowerCase();

    for (const [keyword, zoneId] of Object.entries(this.venueToZoneMap)) {
      if (lowerVenue.includes(keyword)) {
        return zoneId;
      }
    }

    // Try to map by city name if venue name doesn't match
    if (lowerVenue.includes('everett')) return 'everett';
    if (lowerVenue.includes('marysville')) return 'marysville';
    if (lowerVenue.includes('lynnwood')) return 'lynnwood';
    if (lowerVenue.includes('bellevue')) return 'bellevue';
    if (lowerVenue.includes('redmond')) return 'redmond';
    if (lowerVenue.includes('sammamish')) return 'sammamish';
    if (lowerVenue.includes('kirkland')) return 'kirkland';
    if (lowerVenue.includes('issaquah')) return 'issaquah';
    if (lowerVenue.includes('tacoma')) return 'tacoma';
    if (lowerVenue.includes('kent')) return 'kent';
    if (lowerVenue.includes('renton')) return 'renton';
    if (lowerVenue.includes('tukwila')) return 'tukwila';
    if (lowerVenue.includes('burien')) return 'burien';
    if (lowerVenue.includes('federal way')) return 'federal_way';
    if (lowerVenue.includes('lakewood')) return 'lakewood';
    if (lowerVenue.includes('spanaway')) return 'spanaway';

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

  private estimateEndTime(startTime: string, eventType: string = 'other'): string {
    const start = new Date(startTime);
    let durationHours = 3; // Default

    // Adjust duration based on event type
    switch (eventType) {
      case 'sports':
        durationHours = 3.5; // Sports games typically 3-4 hours
        break;
      case 'concert':
        durationHours = 2.5; // Concerts typically 2-3 hours
        break;
      case 'conference':
        durationHours = 8; // All-day events
        break;
      case 'festival':
        durationHours = 10; // Multi-hour events
        break;
    }

    const end = new Date(start.getTime() + durationHours * 60 * 60 * 1000);
    return end.toISOString();
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

