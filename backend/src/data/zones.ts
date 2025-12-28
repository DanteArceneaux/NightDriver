import { Zone } from '../types/index.js';

export const zones: Zone[] = [
  // SEATTLE CORE
  {
    id: 'seatac',
    name: 'SeaTac Airport',
    coordinates: { lat: 47.4502, lng: -122.3088 },
    demandDrivers: ['Flight arrivals', 'Departures', 'Airport traffic'],
    stagingSpot: { lat: 47.4492, lng: -122.3078 }, // Cell phone lot
  },
  {
    id: 'downtown',
    name: 'Downtown/Pike Place',
    coordinates: { lat: 47.6062, lng: -122.3321 },
    demandDrivers: ['Tourism', 'Business', 'Shopping', 'Events'],
    stagingSpot: { lat: 47.6085, lng: -122.3355 }, // Near Pike Place parking
  },
  {
    id: 'capitol_hill',
    name: 'Capitol Hill',
    coordinates: { lat: 47.6205, lng: -122.3212 },
    demandDrivers: ['Nightlife', 'Restaurants', 'Bars', 'Entertainment'],
    stagingSpot: { lat: 47.6195, lng: -122.3195 }, // Broadway & Pike
  },
  {
    id: 'slu',
    name: 'South Lake Union',
    coordinates: { lat: 47.6270, lng: -122.3377 },
    demandDrivers: ['Tech workers', 'Amazon', 'Google', 'Commuters'],
    stagingSpot: { lat: 47.6255, lng: -122.3365 }, // Near Whole Foods
  },
  {
    id: 'u_district',
    name: 'University District',
    coordinates: { lat: 47.6553, lng: -122.3035 },
    demandDrivers: ['Students', 'UW events', 'Campus activities'],
    stagingSpot: { lat: 47.6565, lng: -122.3125 }, // University Way
  },
  {
    id: 'belltown',
    name: 'Belltown',
    coordinates: { lat: 47.6149, lng: -122.3467 },
    demandDrivers: ['Nightlife', 'Hotels', 'Restaurants', 'Bars'],
    stagingSpot: { lat: 47.6135, lng: -122.3445 }, // 2nd Ave
  },
  {
    id: 'ballard',
    name: 'Ballard',
    coordinates: { lat: 47.6677, lng: -122.3843 },
    demandDrivers: ['Bars', 'Restaurants', 'Brewery district'],
    stagingSpot: { lat: 47.6685, lng: -122.3835 }, // Ballard Ave
  },
  {
    id: 'fremont',
    name: 'Fremont',
    coordinates: { lat: 47.6511, lng: -122.3501 },
    demandDrivers: ['Restaurants', 'Quirky shops', 'Sunday market'],
    stagingSpot: { lat: 47.6505, lng: -122.3495 }, // Fremont Ave
  },
  {
    id: 'queen_anne',
    name: 'Queen Anne',
    coordinates: { lat: 47.6369, lng: -122.3573 },
    demandDrivers: ['Climate Pledge Arena', 'Space Needle', 'Residential'],
    stagingSpot: { lat: 47.6220, lng: -122.3540 }, // Near Climate Pledge Arena
  },
  {
    id: 'stadium',
    name: 'Stadium District',
    coordinates: { lat: 47.5952, lng: -122.3316 },
    demandDrivers: ['Seahawks', 'Mariners', 'Sounders', 'T-Mobile Park', 'Lumen Field'],
    stagingSpot: { lat: 47.5935, lng: -122.3305 }, // Occidental Ave S
  },
  {
    id: 'pioneer_square',
    name: 'Pioneer Square',
    coordinates: { lat: 47.6014, lng: -122.3331 },
    demandDrivers: ['Events', 'Nightlife', 'Historic district'],
    stagingSpot: { lat: 47.6005, lng: -122.3320 }, // 1st Ave S
  },
  {
    id: 'waterfront',
    name: 'Waterfront/Pier',
    coordinates: { lat: 47.6062, lng: -122.3430 },
    demandDrivers: ['Tourists', 'Cruise ships', 'Pike Place Market'],
    stagingSpot: { lat: 47.6055, lng: -122.3415 }, // Alaskan Way
  },

  // NORTH (Marysville, Everett, Lynnwood)
  {
    id: 'marysville',
    name: 'Marysville',
    coordinates: { lat: 48.0518, lng: -122.1771 },
    demandDrivers: ['Tulalip Resort Casino', 'Outlet mall', 'Entertainment'],
  },
  {
    id: 'everett',
    name: 'Everett',
    coordinates: { lat: 47.9790, lng: -122.2021 },
    demandDrivers: ['Angel of the Winds Arena', 'Boeing tours', 'Waterfront', 'Events'],
  },
  {
    id: 'lynnwood',
    name: 'Lynnwood',
    coordinates: { lat: 47.8209, lng: -122.3151 },
    demandDrivers: ['Shopping malls', 'Restaurants', 'Transit center'],
  },
  {
    id: 'shoreline',
    name: 'Shoreline',
    coordinates: { lat: 47.7557, lng: -122.3415 },
    demandDrivers: ['Residential', 'Community college', 'Shopping'],
  },

  // EAST (Bellevue, Redmond, Sammamish)
  {
    id: 'bellevue',
    name: 'Bellevue',
    coordinates: { lat: 47.6101, lng: -122.2015 },
    demandDrivers: ['Downtown', 'Shopping', 'Tech offices', 'Restaurants'],
  },
  {
    id: 'redmond',
    name: 'Redmond',
    coordinates: { lat: 47.6740, lng: -122.1215 },
    demandDrivers: ['Microsoft', 'Tech workers', 'Town Center'],
  },
  {
    id: 'sammamish',
    name: 'Sammamish',
    coordinates: { lat: 47.6163, lng: -122.0356 },
    demandDrivers: ['Residential', 'Parks', 'Community events'],
  },
  {
    id: 'kirkland',
    name: 'Kirkland',
    coordinates: { lat: 47.6815, lng: -122.2087 },
    demandDrivers: ['Waterfront', 'Restaurants', 'Shopping'],
  },
  {
    id: 'issaquah',
    name: 'Issaquah',
    coordinates: { lat: 47.5301, lng: -122.0326 },
    demandDrivers: ['Outlet mall', 'Hiking', 'Residential'],
  },

  // SOUTH (Renton, Tukwila, Federal Way, Tacoma, Spanaway)
  {
    id: 'renton',
    name: 'Renton',
    coordinates: { lat: 47.4829, lng: -122.2171 },
    demandDrivers: ['Landing', 'Boeing', 'Shopping', 'Entertainment'],
    stagingSpot: { lat: 47.4835, lng: -122.2165 }, // The Landing parking
  },
  {
    id: 'tukwila',
    name: 'Tukwila',
    coordinates: { lat: 47.4740, lng: -122.2607 },
    demandDrivers: ['Southcenter Mall', 'Hotels', 'Airport proximity'],
    stagingSpot: { lat: 47.4755, lng: -122.2615 }, // Southcenter parking
  },
  {
    id: 'burien',
    name: 'Burien',
    coordinates: { lat: 47.4704, lng: -122.3468 },
    demandDrivers: ['Residential', 'Shopping', 'Airport vicinity'],
    stagingSpot: { lat: 47.4695, lng: -122.3455 }, // SW 152nd St
  },
  {
    id: 'federal_way',
    name: 'Federal Way',
    coordinates: { lat: 47.3223, lng: -122.3126 },
    demandDrivers: ['Shopping', 'Aquarium', 'Residential'],
    stagingSpot: { lat: 47.3215, lng: -122.3135 }, // Commons Mall area
  },
  {
    id: 'kent',
    name: 'Kent',
    coordinates: { lat: 47.3809, lng: -122.2348 },
    demandDrivers: ['ShoWare Center', 'Events', 'Shopping'],
    stagingSpot: { lat: 47.3815, lng: -122.2355 }, // Near ShoWare Center
  },
  {
    id: 'tacoma',
    name: 'Tacoma',
    coordinates: { lat: 47.2529, lng: -122.4443 },
    demandDrivers: ['Tacoma Dome', 'Downtown', 'Waterfront', 'Events'],
    stagingSpot: { lat: 47.2545, lng: -122.4425 }, // Near Tacoma Dome
  },
  {
    id: 'lakewood',
    name: 'Lakewood',
    coordinates: { lat: 47.1717, lng: -122.5185 },
    demandDrivers: ['Retail', 'Restaurants', 'Military base proximity'],
    stagingSpot: { lat: 47.1705, lng: -122.5175 }, // Lakewood Towne Center
  },
  {
    id: 'spanaway',
    name: 'Spanaway',
    coordinates: { lat: 47.1040, lng: -122.4346 },
    demandDrivers: ['Residential', 'Parks', 'Community events'],
    stagingSpot: { lat: 47.1035, lng: -122.4355 }, // Pacific Ave
  },
];

const zoneMap = new Map<string, Zone>(zones.map(zone => [zone.id, zone]));

export function getZoneById(zoneId: string): Zone | undefined {
  return zoneMap.get(zoneId);
}

