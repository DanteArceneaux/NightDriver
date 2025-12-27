import axios from 'axios';
import { Event } from '../types/index.js';

/**
 * SeatGeek API Service - FREE with registration!
 * Get your free client_id at: https://seatgeek.com/account/develop
 * Great for sports events (Seahawks, Mariners, Sounders, Kraken)
 * and concerts at major venues.
 */
export class SeatGeekService {
  private baseUrl = 'https://api.seatgeek.com/2';
  private clientId: string | undefined;

  // Map of venue names/keywords to zone IDs
  private venueToZoneMap: Record<string, string> = {
    // SEATTLE CORE
    'lumen field': 'stadium_district',
    't-mobile park': 'stadium_district',
    'climate pledge arena': 'seattle_center',
    'paramount theatre': 'convention_center',
    'moore theatre': 'belltown_bars',
    'showbox': 'pike_place_market',
    'the crocodile': 'belltown_bars',
    'neumos': 'pike_pine_bars',
    'neptune theatre': 'the_ave',
    'husky stadium': 'uw_campus_west',
    'alaska airlines arena': 'uw_campus_west',
    'benaroya hall': 'financial_district',
    'mccaw hall': 'seattle_center',

    // NORTH
    'angel of the winds arena': 'everett',
    'everett': 'everett',
    'tulalip': 'marysville',

    // EAST
    'meydenbauer': 'bellevue',
    'bellevue': 'bellevue',
    'redmond': 'redmond',

    // SOUTH
    'tacoma dome': 'tacoma',
    'showare center': 'kent',
    'accesso showare center': 'kent',
  };

  constructor() {
    this.clientId = process.env.SEATGEEK_CLIENT_ID;
  }

  async getUpcomingEvents(): Promise<Event[]> {
    // SeatGeek requires a client_id (free to obtain)
    if (!this.clientId) {
      console.log('ℹ️ SeatGeek: No client_id configured (optional - get free key at seatgeek.com/account/develop)');
      return [];
    }

    try {
      // Seattle metro center coordinates
      const lat = 47.6062;
      const lon = -122.3321;
      const range = '50mi'; // 50 mile radius covers whole metro

      // Get events for today and tomorrow
      const now = new Date();
      const tomorrow = new Date(now);
      tomorrow.setDate(tomorrow.getDate() + 2);

      const response = await axios.get(`${this.baseUrl}/events`, {
        params: {
          client_id: this.clientId,
          lat,
          lon,
          range,
          per_page: 50,
          sort: 'datetime_local.asc',
          'datetime_local.gte': now.toISOString().split('T')[0],
          'datetime_local.lte': tomorrow.toISOString().split('T')[0],
        },
        timeout: 10000, // 10 second timeout
      });

      const events = response.data.events || [];
      console.log(`📍 SeatGeek: Found ${events.length} events in Seattle area`);

      return events
        .map((event: any) => this.mapToEvent(event))
        .filter((e: Event | null): e is Event => e !== null && e.zoneId !== 'unknown');
    } catch (error: any) {
      console.error('❌ SeatGeek API error:', error.message);
      return [];
    }
  }

  private mapToEvent(event: any): Event | null {
    try {
      const venue = event.venue;
      if (!venue) return null;

      const venueName = venue.name?.toLowerCase() || '';
      const venueCity = venue.city?.toLowerCase() || '';
      const zoneId = this.mapVenueToZone(venueName, venueCity);

      // Skip if we can't map to a zone
      if (zoneId === 'unknown') return null;

      const eventType = this.classifyEvent(event);
      const startTime = event.datetime_local || event.datetime_utc;
      
      if (!startTime) return null;

      const endTime = this.estimateEndTime(startTime, eventType);

      // Get performer images if available
      let imageUrl: string | undefined;
      if (event.performers && event.performers.length > 0) {
        // Prefer the primary performer's image
        const primaryPerformer = event.performers.find((p: any) => p.primary) || event.performers[0];
        imageUrl = primaryPerformer?.image || primaryPerformer?.images?.huge;
      }

      return {
        name: event.title || event.short_title,
        venue: venue.name || 'Unknown Venue',
        startTime: new Date(startTime).toISOString(),
        endTime,
        zoneId,
        type: eventType,
        attendees: event.stats?.average_price ? Math.floor(event.stats.average_price * 10) : undefined,
        imageUrl,
        url: event.url,
      };
    } catch (error) {
      console.error('Error mapping SeatGeek event:', error);
      return null;
    }
  }

  private mapVenueToZone(venueName: string, venueCity: string): string {
    // Check venue name first
    for (const [keyword, zoneId] of Object.entries(this.venueToZoneMap)) {
      if (venueName.includes(keyword)) {
        return zoneId;
      }
    }

    // Fallback to city mapping
    if (venueCity.includes('seattle')) return 'retail_core';
    if (venueCity.includes('everett')) return 'everett';
    if (venueCity.includes('tacoma')) return 'tacoma';
    if (venueCity.includes('bellevue')) return 'bellevue';
    if (venueCity.includes('kent')) return 'kent';
    if (venueCity.includes('renton')) return 'renton';
    if (venueCity.includes('redmond')) return 'redmond';
    if (venueCity.includes('kirkland')) return 'kirkland';

    return 'unknown';
  }

  private classifyEvent(event: any): 'sports' | 'concert' | 'conference' | 'festival' | 'other' {
    const type = event.type?.toLowerCase() || '';
    const title = (event.title || '').toLowerCase();

    // SeatGeek has clear type classifications
    if (type.includes('nfl') || type.includes('mlb') || type.includes('nba') || 
        type.includes('nhl') || type.includes('mls') || type.includes('ncaa') ||
        type.includes('sports')) {
      return 'sports';
    }
    if (type.includes('concert') || type.includes('music') || type.includes('band')) {
      return 'concert';
    }
    if (type.includes('theater') || type.includes('theatre') || type.includes('broadway')) {
      return 'other'; // Theatrical shows
    }
    if (type.includes('comedy')) {
      return 'other';
    }

    // Check title for sports teams
    if (title.includes('seahawks') || title.includes('mariners') || 
        title.includes('sounders') || title.includes('kraken') ||
        title.includes('huskies') || title.includes('cougars') ||
        title.includes(' vs ') || title.includes(' vs. ')) {
      return 'sports';
    }

    return 'other';
  }

  private estimateEndTime(startTime: string, eventType: string): string {
    const start = new Date(startTime);
    let durationHours = 3;

    switch (eventType) {
      case 'sports':
        durationHours = 3.5;
        break;
      case 'concert':
        durationHours = 2.5;
        break;
      default:
        durationHours = 2.5;
    }

    const end = new Date(start.getTime() + durationHours * 60 * 60 * 1000);
    return end.toISOString();
  }
}

