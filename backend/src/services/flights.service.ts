// import axios from 'axios'; // Currently using mock data
import { FlightArrival } from '../types/index.js';

export class FlightsService {
  private apiKey: string;
  // Base URL for Aviation Stack API (to be used with paid tier)
  private readonly AVIATION_STACK_URL = 'http://api.aviationstack.com/v1';

  constructor(apiKey: string) {
    this.apiKey = apiKey;
    // Log the API URL for debugging
    console.log(`FlightsService initialized with API at ${this.AVIATION_STACK_URL}`);
  }

  async getArrivals(): Promise<FlightArrival[]> {
    const hasValidKey = this.apiKey && this.apiKey.length > 10 && this.apiKey !== 'your_key_here';
    
    // NOTE: Aviation Stack Free Tier only provides HISTORICAL data
    // Real-time flight tracking requires paid plans ($49.99+/month)
    // Using enhanced mock data based on realistic SEA patterns
    
    if (!hasValidKey) {
      return this.getMockFlights();
    }

    // For free tier, use intelligent mock data
    // Real-time would require: FlightAware, FlightStats, or paid Aviation Stack
    console.log('📝 Using enhanced mock flight data (Aviation Stack free tier = historical only)');
    return this.getMockFlights();
  }

  private getMockFlights(): FlightArrival[] {
    const now = new Date();
    const hour = now.getHours();
    const flights: FlightArrival[] = [];

    // Generate realistic flight patterns based on time of day
    let numFlights = 8; // Base number
    
    // Peak arrival times at SEA
    if (hour >= 6 && hour <= 9) numFlights = 15; // Morning arrivals
    if (hour >= 14 && hour <= 17) numFlights = 12; // Afternoon arrivals
    if (hour >= 20 && hour <= 23) numFlights = 10; // Evening arrivals

    // Common SEA origins by traffic volume
    const origins = [
      'Los Angeles (LAX)', 'San Francisco (SFO)', 'Portland (PDX)',
      'San Diego (SAN)', 'Phoenix (PHX)', 'Las Vegas (LAS)',
      'Denver (DEN)', 'Chicago (ORD)', 'Dallas (DFW)',
      'New York (JFK)', 'Atlanta (ATL)', 'Boston (BOS)',
      'Honolulu (HNL)', 'Anchorage (ANC)', 'Tokyo (NRT)',
    ];

    // Alaska Airlines dominates SEA
    const airlines = ['AS', 'AS', 'AS', 'DL', 'UA', 'AA', 'B6', 'WN'];
    
    for (let i = 0; i < numFlights; i++) {
      // Stagger arrivals realistically (every 5-15 minutes)
      const minutesUntilArrival = 10 + (i * 8) + Math.random() * 10;
      const arrivalTime = new Date(now.getTime() + minutesUntilArrival * 60 * 1000);
      
      flights.push({
        flightNumber: `${airlines[i % airlines.length]}${Math.floor(Math.random() * 900 + 100)}`,
        arrivalTime: arrivalTime.toISOString(),
        origin: origins[i % origins.length],
        terminal: i % 3 === 0 ? 'N' : 'Main',
      });
    }

    return flights.sort((a, b) => 
      new Date(a.arrivalTime).getTime() - new Date(b.arrivalTime).getTime()
    );
  }
}

