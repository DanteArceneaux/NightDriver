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

      return events.map((event: any) => {
        const venue = event._embedded?.venues?.[0];
        const venueName = venue?.name?.toLowerCase() || '';
        const zoneId = this.mapVenueToZone(venueName);
        const eventType = this.classifyEvent(event);

        return {
          name: event.name,
          venue: venue?.name || 'Unknown Venue',
          startTime: event.dates.start.dateTime || event.dates.start.localDate,
          endTime: this.estimateEndTime(event.dates.start.dateTime || event.dates.start.localDate, eventType),
          zoneId,
          type: eventType,
          attendees: event.sales?.public?.startDateTime ? 1000 : undefined,
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
      });
    }

    return events;
  }
}

