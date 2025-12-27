import axios from 'axios';
import { Event } from '../types/index.js';

export class EventsService {
  private apiKey: string;
  private baseUrl = 'https://app.ticketmaster.com/discovery/v2';

  // Map of venue names/keywords to zone IDs
  private venueToZoneMap: Record<string, string> = {
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

      const response = await axios.get(`${this.baseUrl}/events.json`, {
        params: {
          apikey: this.apiKey,
          city: 'Seattle',
          stateCode: 'WA',
          startDateTime: startDate,
          endDateTime: endDate,
          size: 50,
          sort: 'date,asc',
        },
      });

      const events = response.data._embedded?.events || [];

      const mappedEvents = events.map((event: any) => {
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
      });

      // Filter out events that have already ended and unknown zones
      const currentTime = new Date();
      return mappedEvents.filter((e: Event) => {
        const eventEndTime = new Date(e.endTime);
        return e.zoneId !== 'unknown' && eventEndTime > currentTime;
      });
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

    // Default zones for unknown venues
    return 'downtown';
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

