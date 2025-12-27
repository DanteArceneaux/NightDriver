import type { Coordinates } from '../types/index.js';

export interface Amenity {
  id: string;
  name: string;
  type: 'bathroom' | 'charging' | 'coffee' | 'food' | 'rest_area';
  coordinates: Coordinates;
  address?: string;
  hours?: string;
  is24Hours: boolean;
  verified: boolean;
  distance?: number; // Calculated when querying
  notes?: string;
  
  // Bathroom-specific
  requiresPurchase?: boolean;
  hasCode?: boolean;
  
  // Charging-specific
  chargerType?: 'tesla' | 'ccs' | 'chademo' | 'j1772';
  numStalls?: number;
  powerKw?: number;
  cost?: string;
}

/**
 * Amenities service for driver-critical locations:
 * - Bathrooms (24/7, verified, no-lock)
 * - EV Charging (Tesla Superchargers, destination chargers, public)
 * - Coffee shops
 * - Food spots
 * - Rest areas
 */
export class AmenitiesService {
  private readonly curatedBathrooms: Amenity[] = this.getCuratedBathrooms();
  private readonly curatedCharging: Amenity[] = this.getCuratedCharging();
  private readonly curatedCoffee: Amenity[] = this.getCuratedCoffee();

  /**
   * Find amenities near a location
   */
  async findNearby(
    location: Coordinates,
    type: Amenity['type'] | 'all' = 'all',
    radiusMiles: number = 2
  ): Promise<Amenity[]> {
    let amenities: Amenity[] = [];

    // Get curated lists based on type
    if (type === 'bathroom' || type === 'all') {
      amenities.push(...this.curatedBathrooms);
    }
    if (type === 'charging' || type === 'all') {
      amenities.push(...this.curatedCharging);
      // TODO: Merge with OpenChargeMap API data
    }
    if (type === 'coffee' || type === 'all') {
      amenities.push(...this.curatedCoffee);
    }

    // Calculate distances and filter by radius
    const withDistances = amenities.map(amenity => ({
      ...amenity,
      distance: this.calculateDistance(location, amenity.coordinates),
    }));

    return withDistances
      .filter(a => a.distance! <= radiusMiles)
      .sort((a, b) => a.distance! - b.distance!);
  }

  /**
   * Get only 24/7 bathrooms (highest priority for drivers)
   */
  async find24HourBathrooms(location: Coordinates, radiusMiles: number = 2): Promise<Amenity[]> {
    const all = await this.findNearby(location, 'bathroom', radiusMiles);
    return all.filter(a => a.is24Hours);
  }

  /**
   * Get Tesla Superchargers only
   */
  async findTeslaSuperchargers(location: Coordinates, radiusMiles: number = 5): Promise<Amenity[]> {
    const all = await this.findNearby(location, 'charging', radiusMiles);
    return all.filter(a => a.chargerType === 'tesla' && (a.powerKw || 0) >= 150);
  }

  /**
   * Calculate distance between two coordinates (Haversine)
   */
  private calculateDistance(from: Coordinates, to: Coordinates): number {
    const R = 3959; // Earth radius in miles
    const dLat = this.toRad(to.lat - from.lat);
    const dLng = this.toRad(to.lng - from.lng);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRad(from.lat)) *
        Math.cos(this.toRad(to.lat)) *
        Math.sin(dLng / 2) *
        Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  private toRad(degrees: number): number {
    return (degrees * Math.PI) / 180;
  }

  /**
   * Curated Seattle bathrooms - driver-verified, focus on 24/7 and reliable
   */
  private getCuratedBathrooms(): Amenity[] {
    return [
      // 24/7 GAS STATIONS (Most reliable)
      {
        id: 'shell-denny-way',
        name: 'Shell - Denny Way',
        type: 'bathroom',
        coordinates: { lat: 47.6187, lng: -122.3367 },
        address: '1201 Denny Way, Seattle',
        hours: '24/7',
        is24Hours: true,
        verified: true,
        requiresPurchase: false,
        notes: 'Clean, always open, outside building entry',
      },
      {
        id: 'chevron-15th-dravus',
        name: 'Chevron - 15th Ave W',
        type: 'bathroom',
        coordinates: { lat: 47.6493, lng: -122.3758 },
        address: '3401 15th Ave W, Seattle',
        hours: '24/7',
        is24Hours: true,
        verified: true,
        requiresPurchase: false,
      },
      {
        id: '76-aurora',
        name: '76 Station - Aurora Ave',
        type: 'bathroom',
        coordinates: { lat: 47.6754, lng: -122.3459 },
        address: '8801 Aurora Ave N, Seattle',
        hours: '24/7',
        is24Hours: true,
        verified: true,
        requiresPurchase: false,
      },

      // 24/7 GROCERY STORES
      {
        id: 'qfc-broadway',
        name: 'QFC Broadway',
        type: 'bathroom',
        coordinates: { lat: 47.6188, lng: -122.3206 },
        address: '417 Broadway E, Seattle',
        hours: '24/7',
        is24Hours: true,
        verified: true,
        requiresPurchase: false,
        notes: 'Back of store, always accessible',
      },
      {
        id: 'safeway-15th',
        name: 'Safeway - 15th Ave NE',
        type: 'bathroom',
        coordinates: { lat: 47.6605, lng: -122.3128 },
        address: '4732 15th Ave NE, Seattle',
        hours: '24/7',
        is24Hours: true,
        verified: true,
        requiresPurchase: false,
      },

      // HOSPITALS (Always accessible, ER lobbies)
      {
        id: 'harborview-medical',
        name: 'Harborview Medical Center',
        type: 'bathroom',
        coordinates: { lat: 47.6053, lng: -122.3204 },
        address: '325 9th Ave, Seattle',
        hours: '24/7',
        is24Hours: true,
        verified: true,
        requiresPurchase: false,
        notes: 'ER waiting area, always open',
      },
      {
        id: 'swedish-first-hill',
        name: 'Swedish First Hill',
        type: 'bathroom',
        coordinates: { lat: 47.6089, lng: -122.3202 },
        address: '747 Broadway, Seattle',
        hours: '24/7',
        is24Hours: true,
        verified: true,
        requiresPurchase: false,
        notes: 'Main lobby, clean',
      },
      {
        id: 'virginia-mason',
        name: 'Virginia Mason Medical Center',
        type: 'bathroom',
        coordinates: { lat: 47.6102, lng: -122.3324 },
        address: '1100 9th Ave, Seattle',
        hours: '24/7',
        is24Hours: true,
        verified: true,
        requiresPurchase: false,
      },

      // AIRPORT
      {
        id: 'seatac-arrivals',
        name: 'SeaTac Airport - Arrivals Level',
        type: 'bathroom',
        coordinates: { lat: 47.4502, lng: -122.3088 },
        address: 'SeaTac Airport, Seattle',
        hours: '24/7',
        is24Hours: true,
        verified: true,
        requiresPurchase: false,
        notes: 'Multiple bathrooms, arrivals level before security',
      },

      // COFFEE SHOPS (Require purchase, reliable hours)
      {
        id: 'starbucks-pike-place',
        name: 'Starbucks Pike Place',
        type: 'bathroom',
        coordinates: { lat: 47.6097, lng: -122.3419 },
        address: '1912 Pike Pl, Seattle',
        hours: '5am-9pm',
        is24Hours: false,
        verified: true,
        requiresPurchase: true,
        hasCode: true,
        notes: 'Ask for code on receipt',
      },
      {
        id: 'starbucks-broadway',
        name: 'Starbucks Broadway',
        type: 'bathroom',
        coordinates: { lat: 47.6240, lng: -122.3210 },
        address: '425 Broadway E, Seattle',
        hours: '5am-10pm',
        is24Hours: false,
        verified: true,
        requiresPurchase: true,
        hasCode: true,
      },

      // PUBLIC LOCATIONS
      {
        id: 'pike-place-market',
        name: 'Pike Place Market Public Restrooms',
        type: 'bathroom',
        coordinates: { lat: 47.6097, lng: -122.3419 },
        address: 'Pike Place Market, Lower Level',
        hours: '6am-6pm',
        is24Hours: false,
        verified: true,
        requiresPurchase: false,
        notes: 'Lower level, can be crowded',
      },
      {
        id: 'seattle-center',
        name: 'Seattle Center Restrooms',
        type: 'bathroom',
        coordinates: { lat: 47.6205, lng: -122.3540 },
        address: 'Seattle Center, Various Locations',
        hours: '7am-11pm',
        is24Hours: false,
        verified: true,
        requiresPurchase: false,
      },
    ];
  }

  /**
   * Curated Seattle EV charging stations
   */
  private getCuratedCharging(): Amenity[] {
    return [
      // TESLA SUPERCHARGERS
      {
        id: 'tesla-sc-sodo',
        name: 'Tesla Supercharger - SODO',
        type: 'charging',
        coordinates: { lat: 47.5817, lng: -122.3344 },
        address: '2001 Utah Ave S, Seattle',
        hours: '24/7',
        is24Hours: true,
        verified: true,
        chargerType: 'tesla',
        numStalls: 12,
        powerKw: 250,
        cost: 'Pay in Tesla app',
        notes: 'V3 Superchargers, very fast',
      },
      {
        id: 'tesla-sc-capitol-hill',
        name: 'Tesla Supercharger - Capitol Hill',
        type: 'charging',
        coordinates: { lat: 47.6205, lng: -122.3213 },
        address: '1500 Broadway, Seattle',
        hours: '24/7',
        is24Hours: true,
        verified: true,
        chargerType: 'tesla',
        numStalls: 8,
        powerKw: 250,
        cost: 'Pay in Tesla app',
      },
      {
        id: 'tesla-sc-slu',
        name: 'Tesla Supercharger - South Lake Union',
        type: 'charging',
        coordinates: { lat: 47.6270, lng: -122.3370 },
        address: '300 Mercer St, Seattle',
        hours: '24/7',
        is24Hours: true,
        verified: true,
        chargerType: 'tesla',
        numStalls: 10,
        powerKw: 250,
        cost: 'Pay in Tesla app',
      },

      // DESTINATION CHARGERS (Slower, free at some hotels)
      {
        id: 'tesla-dest-hyatt',
        name: 'Tesla Destination Charger - Hyatt Regency',
        type: 'charging',
        coordinates: { lat: 47.6120, lng: -122.3354 },
        address: '808 Howell St, Seattle',
        hours: '24/7',
        is24Hours: true,
        verified: true,
        chargerType: 'tesla',
        numStalls: 4,
        powerKw: 17,
        cost: 'Free for guests, $5/hr for others',
      },

      // PUBLIC CCS/CHAdeMO
      {
        id: 'evgo-sodo',
        name: 'EVgo Fast Charger - SODO',
        type: 'charging',
        coordinates: { lat: 47.5807, lng: -122.3343 },
        address: '2200 1st Ave S, Seattle',
        hours: '24/7',
        is24Hours: true,
        verified: true,
        chargerType: 'ccs',
        numStalls: 6,
        powerKw: 350,
        cost: '$0.40/kWh',
        notes: 'CCS and CHAdeMO available',
      },
    ];
  }

  /**
   * Curated coffee shops for breaks
   */
  private getCuratedCoffee(): Amenity[] {
    return [
      {
        id: 'starbucks-reserve',
        name: 'Starbucks Reserve Roastery',
        type: 'coffee',
        coordinates: { lat: 47.6146, lng: -122.3242 },
        address: '1124 Pike St, Seattle',
        hours: '7am-11pm',
        is24Hours: false,
        verified: true,
        notes: 'Large space, good for breaks',
      },
      {
        id: 'cherry-street-coffee',
        name: 'Cherry Street Coffee',
        type: 'coffee',
        coordinates: { lat: 47.6062, lng: -122.3321 },
        address: '103 Cherry St, Seattle',
        hours: '6am-6pm',
        is24Hours: false,
        verified: true,
      },
      {
        id: 'victrola-capitol-hill',
        name: 'Victrola Coffee',
        type: 'coffee',
        coordinates: { lat: 47.6188, lng: -122.3145 },
        address: '310 E Pike St, Seattle',
        hours: '6am-6pm',
        is24Hours: false,
        verified: true,
        notes: 'Great atmosphere for breaks',
      },
    ];
  }
}

