import { Zone } from '../types/index.js';

export const zones: Zone[] = [
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
];

export function getZoneById(zoneId: string): Zone | undefined {
  return zones.find(z => z.id === zoneId);
}

