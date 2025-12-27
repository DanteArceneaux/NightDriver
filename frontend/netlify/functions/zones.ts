import type { Handler } from '@netlify/functions';

// Seattle zones data
const zones = [
  { id: 'downtown', name: 'Downtown Seattle', coordinates: { lat: 47.6062, lng: -122.3321 }, demandDrivers: ['office', 'retail', 'tourism'] },
  { id: 'capitol-hill', name: 'Capitol Hill', coordinates: { lat: 47.6253, lng: -122.3222 }, demandDrivers: ['nightlife', 'dining', 'residential'] },
  { id: 'slu', name: 'South Lake Union', coordinates: { lat: 47.6264, lng: -122.3369 }, demandDrivers: ['tech', 'office', 'dining'] },
  { id: 'belltown', name: 'Belltown', coordinates: { lat: 47.6148, lng: -122.3478 }, demandDrivers: ['nightlife', 'dining', 'residential'] },
  { id: 'pioneer-square', name: 'Pioneer Square', coordinates: { lat: 47.6015, lng: -122.3343 }, demandDrivers: ['sports', 'nightlife', 'tourism'] },
  { id: 'sodo', name: 'SODO', coordinates: { lat: 47.5807, lng: -122.3343 }, demandDrivers: ['sports', 'industrial', 'events'] },
  { id: 'u-district', name: 'University District', coordinates: { lat: 47.6588, lng: -122.3130 }, demandDrivers: ['university', 'student', 'dining'] },
  { id: 'fremont', name: 'Fremont', coordinates: { lat: 47.6515, lng: -122.3500 }, demandDrivers: ['tech', 'quirky', 'dining'] },
  { id: 'ballard', name: 'Ballard', coordinates: { lat: 47.6677, lng: -122.3850 }, demandDrivers: ['nightlife', 'brewery', 'residential'] },
  { id: 'queen-anne', name: 'Queen Anne', coordinates: { lat: 47.6324, lng: -122.3571 }, demandDrivers: ['residential', 'dining', 'views'] },
  { id: 'west-seattle', name: 'West Seattle', coordinates: { lat: 47.5665, lng: -122.3870 }, demandDrivers: ['beach', 'residential', 'dining'] },
  { id: 'columbia-city', name: 'Columbia City', coordinates: { lat: 47.5595, lng: -122.2865 }, demandDrivers: ['diverse', 'dining', 'residential'] },
  { id: 'seatac', name: 'SeaTac Airport', coordinates: { lat: 47.4502, lng: -122.3088 }, demandDrivers: ['airport', 'travel', 'hotels'] },
  { id: 'bellevue-dt', name: 'Bellevue Downtown', coordinates: { lat: 47.6101, lng: -122.2015 }, demandDrivers: ['tech', 'shopping', 'office'] },
  { id: 'kirkland', name: 'Kirkland Waterfront', coordinates: { lat: 47.6769, lng: -122.2060 }, demandDrivers: ['waterfront', 'dining', 'residential'] },
  { id: 'redmond', name: 'Redmond', coordinates: { lat: 47.6740, lng: -122.1215 }, demandDrivers: ['tech', 'microsoft', 'residential'] },
];

// Calculate zone scores based on time patterns
function calculateScores(): any[] {
  const now = new Date();
  const hour = now.getHours();
  const dayOfWeek = now.getDay();
  const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

  return zones.map(zone => {
    let baseScore = 40;

    // Time-based adjustments
    if (hour >= 7 && hour <= 9) baseScore += 15; // Morning rush
    if (hour >= 17 && hour <= 19) baseScore += 20; // Evening rush
    if (hour >= 21 || hour <= 2) baseScore += 25; // Late night
    if (hour >= 11 && hour <= 13) baseScore += 10; // Lunch

    // Zone-specific adjustments
    if (zone.id === 'seatac') baseScore += 15;
    if (zone.id === 'downtown') baseScore += isWeekend ? 10 : 15;
    if (zone.id === 'capitol-hill' && (hour >= 21 || hour <= 2)) baseScore += 20;
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
      trend: score > 60 ? 'rising' : score < 40 ? 'falling' : 'stable',
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
}

export const handler: Handler = async (event) => {
  const zoneScores = calculateScores();
  const topPick = zoneScores[0];

  const response = {
    timestamp: new Date().toISOString(),
    topPick: {
      zoneId: topPick.id,
      score: topPick.score,
      reason: `Highest demand in ${topPick.name}`,
    },
    zones: zoneScores,
  };

  return {
    statusCode: 200,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
    },
    body: JSON.stringify(response),
  };
};

