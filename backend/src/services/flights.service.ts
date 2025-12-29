import axios from 'axios';
import { FlightArrival } from '../types/index.js';

interface FlightCache {
  data: FlightArrival[];
  timestamp: number;
}

export class FlightsService {
  private apiKey: string;
  private cache: FlightCache | null = null;
  private readonly CACHE_TTL_MS = 3 * 60 * 60 * 1000; // 3 hours
  private readonly RAPID_API_HOST = 'aerodatabox.p.rapidapi.com';
  
  constructor(apiKey: string) {
    this.apiKey = apiKey;
    console.log(`FlightsService initialized with RapidAPI AeroDataBox`);
  }

  async getArrivals(forceRefresh: boolean = false): Promise<FlightArrival[]> {
    // Check if we have valid API key
    const hasValidKey = this.apiKey && this.apiKey.length > 10 && this.apiKey !== 'your_key_here';
    
    if (!hasValidKey) {
      console.log('⚠️ No RapidAPI key - using mock data');
      return this.getMockFlights();
    }

    // Return cached data if still fresh (unless force refresh)
    if (!forceRefresh && this.cache && (Date.now() - this.cache.timestamp < this.CACHE_TTL_MS)) {
      const cacheAgeMinutes = Math.round((Date.now() - this.cache.timestamp) / (1000 * 60));
      console.log(`✅ Using cached flight data (${cacheAgeMinutes} min old)`);
      return this.cache.data;
    }

    try {
      console.log('🔄 Fetching real-time flight data from AeroDataBox...');
      const flights = await this.fetchRealFlights();
      
      // Cache the results
      this.cache = {
        data: flights,
        timestamp: Date.now()
      };
      
      console.log(`✅ Fetched ${flights.length} real flights from AeroDataBox`);
      return flights;
      
    } catch (error: any) {
      console.error('❌ AeroDataBox API error:', error.message);
      if (error.response) {
        console.error('Response status:', error.response.status);
        console.error('Response data:', JSON.stringify(error.response.data).substring(0, 200));
      }
      
      // Return cached data if available (even if expired)
      if (this.cache) {
        console.log('⚠️ Using stale cache as fallback');
        return this.cache.data;
      }
      
      // Last resort: mock data
      console.log('📝 Falling back to mock flight data');
      return this.getMockFlights();
    }
  }

  private async fetchRealFlights(): Promise<FlightArrival[]> {
    const SEA_ICAO = 'KSEA';
    const now = new Date();
    const twoHoursLater = new Date(now.getTime() + 2 * 60 * 60 * 1000);
    
    // Format dates for AeroDataBox (ISO 8601)
    const fromTime = now.toISOString().split('.')[0]; // Remove milliseconds
    const toTime = twoHoursLater.toISOString().split('.')[0];
    
    const url = `https://${this.RAPID_API_HOST}/flights/airports/icao/${SEA_ICAO}/${fromTime}/${toTime}`;
    
    const response = await axios.get(url, {
      headers: {
        'X-RapidAPI-Key': this.apiKey,
        'X-RapidAPI-Host': this.RAPID_API_HOST
      },
      params: {
        withLocation: false,
        withCancelled: false,
        withCodeshared: true,
        withCargo: false,
        withPrivate: false,
        direction: 'Arrival'
      },
      timeout: 15000
    });

    const arrivals = response.data.arrivals || [];
    
    if (arrivals.length === 0) {
      console.warn('⚠️ AeroDataBox returned 0 arrivals - unusual for SEA');
    }
    
    // Map to our internal format
    return arrivals.map((flight: any) => {
      const scheduledTime = flight.arrival?.scheduledTime?.local || flight.arrival?.scheduledTime?.utc;
      const actualTime = flight.arrival?.actualTime?.local || flight.arrival?.actualTime?.utc;
      
      return {
        flightNumber: this.extractFlightNumber(flight),
        arrivalTime: actualTime || scheduledTime || new Date().toISOString(),
        origin: this.extractOriginCity(flight),
        terminal: flight.arrival?.terminal || 'Main',
        status: this.mapFlightStatus(flight.status),
        carrier: flight.airline?.name || 'Unknown'
      };
    })
    .filter((f: FlightArrival) => f.arrivalTime) // Remove flights without arrival time
    .slice(0, 20); // Limit to 20 flights
  }

  private extractFlightNumber(flight: any): string {
    return flight.number || 
           flight.callSign || 
           flight.flight?.number ||
           'Unknown';
  }

  private extractOriginCity(flight: any): string {
    const departure = flight.departure || {};
    const airport = departure.airport || {};
    
    // Try to get city name, fallback to airport name
    const city = airport.municipalityName || airport.name || 'Unknown';
    const iata = airport.iata || '';
    
    // Format: "City (CODE)" or just "City"
    return iata ? `${city} (${iata})` : city;
  }

  private mapFlightStatus(status: string): string {
    // AeroDataBox statuses: Expected, EnRoute, Arrived, Cancelled, Diverted, etc.
    const statusMap: Record<string, string> = {
      'Expected': 'Scheduled',
      'EnRoute': 'In Flight',
      'Arrived': 'Landed',
      'Cancelled': 'Cancelled',
      'Diverted': 'Diverted',
      'Unknown': 'Scheduled'
    };
    
    return statusMap[status] || status || 'Scheduled';
  }

  private getMockFlights(): FlightArrival[] {
    const now = new Date();
    const hour = now.getHours();
    const flights: FlightArrival[] = [];

    let numFlights = 8;
    if (hour >= 6 && hour <= 9) numFlights = 15;
    if (hour >= 14 && hour <= 17) numFlights = 12;
    if (hour >= 20 && hour <= 23) numFlights = 10;

    const origins = [
      'Los Angeles (LAX)', 'San Francisco (SFO)', 'Portland (PDX)',
      'San Diego (SAN)', 'Phoenix (PHX)', 'Las Vegas (LAS)',
      'Denver (DEN)', 'Chicago (ORD)', 'Dallas (DFW)',
      'New York (JFK)', 'Atlanta (ATL)', 'Boston (BOS)',
      'Honolulu (HNL)', 'Anchorage (ANC)', 'Tokyo (NRT)',
    ];

    const airlines = ['AS', 'AS', 'AS', 'DL', 'UA', 'AA', 'B6', 'WN'];
    
    for (let i = 0; i < numFlights; i++) {
      const minutesUntilArrival = 10 + (i * 8) + Math.random() * 10;
      const arrivalTime = new Date(now.getTime() + minutesUntilArrival * 60 * 1000);
      
      flights.push({
        flightNumber: `${airlines[i % airlines.length]}${Math.floor(Math.random() * 900 + 100)}`,
        arrivalTime: arrivalTime.toISOString(),
        origin: origins[i % origins.length],
        terminal: i % 3 === 0 ? 'N' : 'Main',
        status: 'Scheduled',
        carrier: i % 2 === 0 ? 'Alaska Airlines' : 'Delta'
      });
    }

    return flights.sort((a, b) => 
      new Date(a.arrivalTime).getTime() - new Date(b.arrivalTime).getTime()
    );
  }
}
