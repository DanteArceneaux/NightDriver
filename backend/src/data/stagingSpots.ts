import { Coordinates } from '../types/index.js';

/**
 * Smart Staging Spots
 * 
 * Best places to wait for rides near high-demand zones.
 * Criteria: Safe, legal parking + quick access to pickups + EV charging nearby.
 */

export interface StagingSpot {
  id: string;
  name: string;
  zoneId: string;
  coordinates: Coordinates;
  type: 'street_parking' | 'parking_lot' | 'gas_station' | 'ev_charging';
  cost: 'free' | 'paid';
  notes: string;
  nearbyAmenities: string[];
  bestFor: string[]; // ['events', 'bar_close', 'general']
  evChargingNearby?: {
    location: string;
    distance: string; // "0.2 miles"
    network: string; // "ChargePoint", "Electrify America"
  };
}

export const STAGING_SPOTS: StagingSpot[] = [
  // STADIUM DISTRICT
  {
    id: 'sodo_4th_jackson',
    name: '4th Ave S & S Jackson St',
    zoneId: 'stadium',
    coordinates: { lat: 47.5986, lng: -122.3291 },
    type: 'street_parking',
    cost: 'free',
    notes: 'Perfect for T-Mobile Park / Lumen Field. Quick access to both venues.',
    nearbyAmenities: ['restroom at stadium', 'food trucks on game days'],
    bestFor: ['events'],
    evChargingNearby: {
      location: 'Uwajimaya Parking',
      distance: '0.3 miles',
      network: 'ChargePoint',
    },
  },
  {
    id: 'sodo_occidental',
    name: 'Occidental Ave S (near pub)',
    zoneId: 'stadium',
    coordinates: { lat: 47.5979, lng: -122.3330 },
    type: 'street_parking',
    cost: 'free',
    notes: 'Occidental Sq area. Easy U-turn access. Many drivers wait here.',
    nearbyAmenities: ['Occidental Park', 'cafes'],
    bestFor: ['events', 'general'],
  },

  // AIRPORT
  {
    id: 'airport_cell_lot',
    name: 'SEA Airport Cell Phone Lot',
    zoneId: 'seatac',
    coordinates: { lat: 47.4546, lng: -122.2989 },
    type: 'parking_lot',
    cost: 'free',
    notes: 'Official cell phone waiting lot. FREE. Restrooms available. 5 min to terminals.',
    nearbyAmenities: ['restrooms', 'wifi'],
    bestFor: ['general'],
  },

  // CAPITOL HILL
  {
    id: 'caphill_cal_anderson',
    name: 'Cal Anderson Park (11th Ave)',
    zoneId: 'capitol_hill',
    coordinates: { lat: 47.6174, lng: -122.3193 },
    type: 'street_parking',
    cost: 'free',
    notes: 'Central Capitol Hill. Quick access to Pike/Pine bars. Night-only parking.',
    nearbyAmenities: ['park', '24hr coffee'],
    bestFor: ['bar_close', 'general'],
    evChargingNearby: {
      location: 'QFC Broadway',
      distance: '0.2 miles',
      network: 'ChargePoint',
    },
  },
  {
    id: 'caphill_pike_belmont',
    name: 'Pike St & Belmont Ave',
    zoneId: 'capitol_hill',
    coordinates: { lat: 47.6142, lng: -122.3210 },
    type: 'street_parking',
    cost: 'free',
    notes: 'Heart of Pike/Pine nightlife. Position here at 1:30am for bar close surge.',
    nearbyAmenities: ['bars', 'late night food'],
    bestFor: ['bar_close'],
  },

  // BELLTOWN
  {
    id: 'belltown_2nd_blanchard',
    name: '2nd Ave & Blanchard St',
    zoneId: 'belltown',
    coordinates: { lat: 47.6141, lng: -122.3436 },
    type: 'street_parking',
    cost: 'free',
    notes: 'Central Belltown. Easy access to bars on 1st/2nd/3rd Ave.',
    nearbyAmenities: ['bars', 'restaurants'],
    bestFor: ['bar_close', 'general'],
  },

  // DOWNTOWN
  {
    id: 'downtown_convention_center',
    name: 'Convention Center Garage',
    zoneId: 'downtown',
    coordinates: { lat: 47.6116, lng: -122.3331 },
    type: 'parking_lot',
    cost: 'paid',
    notes: 'Paid parking but close to Pike Place, convention center, hotels. Good for breaks.',
    nearbyAmenities: ['restrooms', 'food court', 'EV charging'],
    bestFor: ['general', 'events'],
    evChargingNearby: {
      location: 'In garage',
      distance: '0 miles',
      network: 'Multiple networks',
    },
  },

  // U-DISTRICT
  {
    id: 'udistrict_45th_brooklyn',
    name: '45th St & Brooklyn Ave',
    zoneId: 'u_district',
    coordinates: { lat: 47.6613, lng: -122.3129 },
    type: 'street_parking',
    cost: 'free',
    notes: 'Near The Ave bars. Good for UW events and bar close.',
    nearbyAmenities: ['restaurants', 'bars'],
    bestFor: ['bar_close', 'events'],
  },

  // BALLARD
  {
    id: 'ballard_ave_market',
    name: 'Ballard Ave & Market St',
    zoneId: 'ballard',
    coordinates: { lat: 47.6683, lng: -122.3843 },
    type: 'street_parking',
    cost: 'free',
    notes: 'Center of Ballard nightlife. Many bars within 2 blocks.',
    nearbyAmenities: ['bars', 'late night food'],
    bestFor: ['bar_close', 'general'],
  },

  // QUEEN ANNE (CLIMATE PLEDGE)
  {
    id: 'queen_anne_mercer_5th',
    name: 'Mercer St & 5th Ave N',
    zoneId: 'queen_anne',
    coordinates: { lat: 47.6249, lng: -122.3476 },
    type: 'street_parking',
    cost: 'free',
    notes: 'Perfect for Climate Pledge Arena events. Exit surge positioning.',
    nearbyAmenities: ['Seattle Center'],
    bestFor: ['events'],
  },

  // FREMONT
  {
    id: 'fremont_34th',
    name: 'Fremont Ave N & N 34th St',
    zoneId: 'fremont',
    coordinates: { lat: 47.6507, lng: -122.3505 },
    type: 'street_parking',
    cost: 'free',
    notes: 'Central Fremont. Good for bar close and general pickups.',
    nearbyAmenities: ['bars', 'restaurants'],
    bestFor: ['bar_close', 'general'],
  },
];

/**
 * Get staging spot for a zone
 */
export function getStagingSpotForZone(zoneId: string, purpose: 'events' | 'bar_close' | 'general' = 'general'): StagingSpot | null {
  const spots = STAGING_SPOTS.filter(s => s.zoneId === zoneId && s.bestFor.includes(purpose));
  return spots[0] || STAGING_SPOTS.find(s => s.zoneId === zoneId) || null;
}

/**
 * Get all EV charging staging spots
 */
export function getEVChargingSpots(): StagingSpot[] {
  return STAGING_SPOTS.filter(s => s.type === 'ev_charging' || s.evChargingNearby);
}

/**
 * Get free staging spots only
 */
export function getFreeSpots(): StagingSpot[] {
  return STAGING_SPOTS.filter(s => s.cost === 'free');
}

