import { ZonesResponse, Forecast, Conditions } from '../types';

// Seattle zones data - Updated to match allZones.json IDs for seamless hex grid
const zones = [
  // Downtown Core
  { id: 'downtown', name: 'Downtown Central', coordinates: { lat: 47.6062, lng: -122.3321 }, demandDrivers: ['office', 'retail'] },
  { id: 'retail_core', name: 'Retail Core', coordinates: { lat: 47.6100, lng: -122.3350 }, demandDrivers: ['retail', 'tourism'] },
  { id: 'financial_district', name: 'Financial District', coordinates: { lat: 47.6050, lng: -122.3320 }, demandDrivers: ['office'] },
  { id: 'pike_place_market', name: 'Pike Place Market', coordinates: { lat: 47.6090, lng: -122.3410 }, demandDrivers: ['tourism', 'dining'] },
  
  // Capitol Hill
  { id: 'capitol_hill', name: 'Capitol Hill', coordinates: { lat: 47.6253, lng: -122.3222 }, demandDrivers: ['nightlife'] },
  { id: 'pike_pine_bars', name: 'Pike/Pine Corridor', coordinates: { lat: 47.6140, lng: -122.3160 }, demandDrivers: ['nightlife', 'dining'] },
  { id: 'broadway_retail', name: 'Broadway', coordinates: { lat: 47.6200, lng: -122.3200 }, demandDrivers: ['dining', 'nightlife'] },
  { id: 'cal_anderson', name: 'Cal Anderson', coordinates: { lat: 47.6170, lng: -122.3190 }, demandDrivers: ['events'] },

  // Belltown & Waterfront
  { id: 'belltown', name: 'Belltown', coordinates: { lat: 47.6148, lng: -122.3478 }, demandDrivers: ['nightlife', 'residential'] },
  { id: 'belltown_bars', name: 'Belltown Nightlife', coordinates: { lat: 47.6150, lng: -122.3450 }, demandDrivers: ['nightlife', 'dining'] },
  { id: 'waterfront_piers', name: 'Waterfront', coordinates: { lat: 47.6050, lng: -122.3400 }, demandDrivers: ['tourism'] },
  
  // Pioneer Square & SODO
  { id: 'pioneer_square', name: 'Pioneer Square', coordinates: { lat: 47.6015, lng: -122.3343 }, demandDrivers: ['nightlife'] },
  { id: 'stadium_district', name: 'Stadiums', coordinates: { lat: 47.5952, lng: -122.3316 }, demandDrivers: ['sports', 'events'] },
  { id: 'sodo', name: 'SODO', coordinates: { lat: 47.5807, lng: -122.3343 }, demandDrivers: ['industrial', 'sports'] },
  
  // Other Neighborhoods
  { id: 'slu', name: 'South Lake Union', coordinates: { lat: 47.6264, lng: -122.3369 }, demandDrivers: ['tech', 'office'] },
  { id: 'u-district', name: 'University District', coordinates: { lat: 47.6588, lng: -122.3130 }, demandDrivers: ['university'] },
  { id: 'fremont', name: 'Fremont', coordinates: { lat: 47.6515, lng: -122.3500 }, demandDrivers: ['tech', 'dining'] },
  { id: 'ballard', name: 'Ballard', coordinates: { lat: 47.6677, lng: -122.3850 }, demandDrivers: ['nightlife', 'brewery'] },
  { id: 'queen-anne', name: 'Queen Anne', coordinates: { lat: 47.6324, lng: -122.3571 }, demandDrivers: ['residential', 'views'] },
  { id: 'west-seattle', name: 'West Seattle', coordinates: { lat: 47.5665, lng: -122.3870 }, demandDrivers: ['residential', 'dining'] },
  { id: 'seatac', name: 'SeaTac Airport', coordinates: { lat: 47.4502, lng: -122.3088 }, demandDrivers: ['airport'] },
  { id: 'bellevue-dt', name: 'Bellevue Downtown', coordinates: { lat: 47.6101, lng: -122.2015 }, demandDrivers: ['tech', 'shopping'] },
  { id: 'kirkland', name: 'Kirkland Waterfront', coordinates: { lat: 47.6769, lng: -122.2060 }, demandDrivers: ['waterfront'] },
  { id: 'redmond', name: 'Redmond', coordinates: { lat: 47.6740, lng: -122.1215 }, demandDrivers: ['tech'] },
];

export function generateMockZones(): ZonesResponse {
  const now = new Date();
  const hour = now.getHours();
  const dayOfWeek = now.getDay();
  const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

  const zoneScores = zones.map(zone => {
    let baseScore = 40;

    // Time-based adjustments
    if (hour >= 7 && hour <= 9) baseScore += 15; // Morning rush
    if (hour >= 17 && hour <= 19) baseScore += 20; // Evening rush
    if (hour >= 21 || hour <= 2) baseScore += 25; // Late night
    if (hour >= 11 && hour <= 13) baseScore += 10; // Lunch

    // Zone-specific adjustments
    if (zone.id === 'seatac') baseScore += 15;
    if (zone.id.includes('downtown') || zone.id === 'retail_core') baseScore += isWeekend ? 10 : 15;
    if ((zone.id.includes('capitol') || zone.id === 'pike_pine_bars') && (hour >= 21 || hour <= 2)) baseScore += 20;
    if (zone.id === 'slu' && hour >= 17 && hour <= 19) baseScore += 15;
    if (zone.demandDrivers.includes('nightlife') && (hour >= 21 || hour <= 2)) baseScore += 15;
    if (zone.demandDrivers.includes('sports') && isWeekend) baseScore += 10;

    // Weekend adjustments
    if (isWeekend) {
      if (zone.demandDrivers.includes('nightlife')) baseScore += 10;
      if (zone.demandDrivers.includes('dining')) baseScore += 5;
    }

    // Add some randomness for realism
    baseScore += Math.floor(Math.random() * 10) - 5;

    const score = Math.min(100, Math.max(0, baseScore));
    const estimatedHourlyRate = 15 + (score / 100) * 25;

    return {
      id: zone.id,
      name: zone.name,
      score,
      trend: (score > 60 ? 'rising' : score < 40 ? 'falling' : 'stable') as 'rising' | 'falling' | 'stable',
      estimatedHourlyRate: Math.round(estimatedHourlyRate),
      factors: {
        baseline: 40,
        events: Math.floor(Math.random() * 15),
        weather: Math.floor(Math.random() * 10),
        flights: zone.id === 'seatac' ? 15 : 0,
        traffic: Math.floor(Math.random() * 5),
      },
      coordinates: zone.coordinates,
    };
  }).sort((a, b) => b.score - a.score);

  const topPick = zoneScores[0];

  return {
    timestamp: new Date().toISOString(),
    topPick: {
      zoneId: topPick.id,
      score: topPick.score,
      reason: `Highest demand in ${topPick.name}`,
    },
    zones: zoneScores,
  };
}

export function generateMockForecast(): Forecast {
  const now = new Date();
  const points = [];

  for (let i = 0; i < 8; i++) {
    const forecastTime = new Date(now.getTime() + i * 3600000);
    const hour = forecastTime.getHours();

    const topZones = [
      { id: 'downtown', name: 'Downtown Seattle', score: 60 + Math.floor(Math.random() * 30) },
      { id: 'capitol-hill', name: 'Capitol Hill', score: 50 + Math.floor(Math.random() * 35) },
      { id: 'seatac', name: 'SeaTac Airport', score: 55 + Math.floor(Math.random() * 25) },
    ].sort((a, b) => b.score - a.score);

    points.push({
      time: forecastTime.toISOString(),
      hour,
      topZones,
    });
  }

  return { points };
}

export function generateMockConditions(): Conditions {
  const weather = {
    temperature: 52 + Math.floor(Math.random() * 10),
    description: ['Clear', 'Partly Cloudy', 'Overcast', 'Light Rain'][Math.floor(Math.random() * 4)],
    isRaining: Math.random() > 0.7,
    rainPrediction: 'No rain expected',
  };

  const events: Conditions['events'] = [
    {
      name: 'Seahawks Game',
      venue: 'Lumen Field',
      startTime: new Date(Date.now() + 3600000 * 3).toISOString(),
      endTime: new Date(Date.now() + 3600000 * 6).toISOString(),
      zoneId: 'stadium_district',
      type: 'sports' as const,
      attendees: 68000,
    },
    {
      name: 'Concert at Climate Pledge',
      venue: 'Climate Pledge Arena',
      startTime: new Date(Date.now() + 3600000 * 5).toISOString(),
      endTime: new Date(Date.now() + 3600000 * 8).toISOString(),
      zoneId: 'queen-anne',
      type: 'concert' as const,
      attendees: 18000,
    },
  ];

  const flights = [
    { flightNumber: 'AS123', arrivalTime: new Date(Date.now() + 1800000).toISOString(), origin: 'LAX', terminal: 'A' },
    { flightNumber: 'DL456', arrivalTime: new Date(Date.now() + 3600000).toISOString(), origin: 'JFK', terminal: 'S' },
    { flightNumber: 'UA789', arrivalTime: new Date(Date.now() + 5400000).toISOString(), origin: 'ORD', terminal: 'A' },
  ];

  return {
    weather,
    events,
    flights,
    lastUpdated: new Date().toISOString(),
    // @ts-ignore
    driverSupply: { estimatedDrivers: 15, modifier: 1.2 }
  };
}
