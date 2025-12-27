import { Zone } from '../types/index.js';

export const zones: Zone[] = [
  // SEATTLE CORE
  {
    id: 'seatac',
    name: 'SeaTac Airport',
    coordinates: { lat: 47.4502, lng: -122.3088 },
    demandDrivers: ['Flight arrivals', 'Departures', 'Airport traffic'],
  },
  {
    id: 'downtown',
    name: 'Downtown/Pike Place',
    coordinates: { lat: 47.6062, lng: -122.3321 },
    demandDrivers: ['Tourism', 'Business', 'Shopping', 'Events'],
  },
  {
    id: 'capitol_hill',
    name: 'Capitol Hill',
    coordinates: { lat: 47.6205, lng: -122.3212 },
    demandDrivers: ['Nightlife', 'Restaurants', 'Bars', 'Entertainment'],
  },
  {
    id: 'slu',
    name: 'South Lake Union',
    coordinates: { lat: 47.6270, lng: -122.3377 },
    demandDrivers: ['Tech workers', 'Amazon', 'Google', 'Commuters'],
  },
  {
    id: 'u_district',
    name: 'University District',
    coordinates: { lat: 47.6553, lng: -122.3035 },
    demandDrivers: ['Students', 'UW events', 'Campus activities'],
  },
  {
    id: 'belltown',
    name: 'Belltown',
    coordinates: { lat: 47.6149, lng: -122.3467 },
    demandDrivers: ['Nightlife', 'Hotels', 'Restaurants', 'Bars'],
  },
  {
    id: 'ballard',
    name: 'Ballard',
    coordinates: { lat: 47.6677, lng: -122.3843 },
    demandDrivers: ['Bars', 'Restaurants', 'Brewery district'],
  },
  {
    id: 'fremont',
    name: 'Fremont',
    coordinates: { lat: 47.6511, lng: -122.3501 },
    demandDrivers: ['Restaurants', 'Quirky shops', 'Sunday market'],
  },
  {
    id: 'queen_anne',
    name: 'Queen Anne',
    coordinates: { lat: 47.6369, lng: -122.3573 },
    demandDrivers: ['Climate Pledge Arena', 'Space Needle', 'Residential'],
  },
  {
    id: 'stadium',
    name: 'Stadium District',
    coordinates: { lat: 47.5952, lng: -122.3316 },
    demandDrivers: ['Seahawks', 'Mariners', 'Sounders', 'T-Mobile Park', 'Lumen Field'],
  },
  {
    id: 'pioneer_square',
    name: 'Pioneer Square',
    coordinates: { lat: 47.6014, lng: -122.3331 },
    demandDrivers: ['Events', 'Nightlife', 'Historic district'],
  },
  {
    id: 'waterfront',
    name: 'Waterfront/Pier',
    coordinates: { lat: 47.6062, lng: -122.3430 },
    demandDrivers: ['Tourists', 'Cruise ships', 'Pike Place Market'],
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
  },
  {
    id: 'tukwila',
    name: 'Tukwila',
    coordinates: { lat: 47.4740, lng: -122.2607 },
    demandDrivers: ['Southcenter Mall', 'Hotels', 'Airport proximity'],
  },
  {
    id: 'burien',
    name: 'Burien',
    coordinates: { lat: 47.4704, lng: -122.3468 },
    demandDrivers: ['Residential', 'Shopping', 'Airport vicinity'],
  },
  {
    id: 'federal_way',
    name: 'Federal Way',
    coordinates: { lat: 47.3223, lng: -122.3126 },
    demandDrivers: ['Shopping', 'Aquarium', 'Residential'],
  },
  {
    id: 'kent',
    name: 'Kent',
    coordinates: { lat: 47.3809, lng: -122.2348 },
    demandDrivers: ['ShoWare Center', 'Events', 'Shopping'],
  },
  {
    id: 'tacoma',
    name: 'Tacoma',
    coordinates: { lat: 47.2529, lng: -122.4443 },
    demandDrivers: ['Tacoma Dome', 'Downtown', 'Waterfront', 'Events'],
  },
  {
    id: 'lakewood',
    name: 'Lakewood',
    coordinates: { lat: 47.1717, lng: -122.5185 },
    demandDrivers: ['Retail', 'Restaurants', 'Military base proximity'],
  },
  {
    id: 'spanaway',
    name: 'Spanaway',
    coordinates: { lat: 47.1040, lng: -122.4346 },
    demandDrivers: ['Residential', 'Parks', 'Community events'],
  },
];

export function getZoneById(zoneId: string): Zone | undefined {
  return zones.find(z => z.id === zoneId);
}

