import type { VercelRequest, VercelResponse } from '@vercel/node';

const OPENWEATHER_API_KEY = process.env.OPENWEATHER_API_KEY || 'a151d8c40b9db5483d12e7219a704eb1';

const SEATTLE_LAT = 47.6062;
const SEATTLE_LON = -122.3321;

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

async function fetchWeather() {
  try {
    const response = await fetch(
      `https://api.openweathermap.org/data/2.5/weather?lat=${SEATTLE_LAT}&lon=${SEATTLE_LON}&appid=${OPENWEATHER_API_KEY}&units=imperial`
    );
    if (!response.ok) throw new Error('Weather API failed');
    const data = await response.json();
    const isRaining = data.weather?.some((w: any) => 
      w.main === 'Rain' || w.main === 'Drizzle' || w.main === 'Thunderstorm'
    );
    return { isRaining: isRaining || false, temperature: Math.round(data.main?.temp || 50) };
  } catch {
    return { isRaining: false, temperature: 50 };
  }
}

function calculateScores(weather: { isRaining: boolean }) {
  const now = new Date();
  const hour = now.getHours();
  const dayOfWeek = now.getDay();
  const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

  return zones.map(zone => {
    let baseScore = 40;
    if (hour >= 7 && hour <= 9) baseScore += 15;
    if (hour >= 17 && hour <= 19) baseScore += 20;
    if (hour >= 21 || hour <= 2) baseScore += 25;
    if (hour >= 11 && hour <= 13) baseScore += 10;
    if (zone.id === 'seatac') baseScore += 15;
    if (zone.id === 'downtown') baseScore += isWeekend ? 10 : 15;
    if (zone.id === 'capitol-hill' && (hour >= 21 || hour <= 2)) baseScore += 20;
    if (zone.id === 'slu' && hour >= 17 && hour <= 19) baseScore += 15;
    if (zone.demandDrivers.includes('nightlife') && (hour >= 21 || hour <= 2)) baseScore += 15;
    if (zone.demandDrivers.includes('sports') && isWeekend) baseScore += 10;
    if (isWeekend) {
      if (zone.demandDrivers.includes('nightlife')) baseScore += 10;
      if (zone.demandDrivers.includes('dining')) baseScore += 5;
    }

    let weatherBonus = 0;
    if (weather.isRaining) {
      weatherBonus = 10;
      if (zone.demandDrivers.includes('retail') || zone.demandDrivers.includes('dining')) weatherBonus += 5;
    }

    const randomFactor = Math.floor(Math.random() * 6) - 3;
    const score = Math.min(100, Math.max(0, baseScore + weatherBonus + randomFactor));
    const estimatedHourlyRate = 15 + (score / 100) * 25;

    return {
      id: zone.id,
      name: zone.name,
      score,
      trend: score > 60 ? 'rising' : score < 40 ? 'falling' : 'stable',
      estimatedHourlyRate: Math.round(estimatedHourlyRate),
      factors: { baseline: 40, events: 0, weather: weatherBonus, flights: zone.id === 'seatac' ? 15 : 0, traffic: Math.floor(Math.random() * 5) },
      coordinates: zone.coordinates,
    };
  }).sort((a, b) => b.score - a.score);
}

export default async function handler(_req: VercelRequest, res: VercelResponse) {
  const weather = await fetchWeather();
  const zoneScores = calculateScores(weather);
  const topPick = zoneScores[0];

  res.setHeader('Access-Control-Allow-Origin', '*');
  res.json({
    timestamp: new Date().toISOString(),
    topPick: { zoneId: topPick.id, score: topPick.score, reason: `Highest demand in ${topPick.name}` },
    zones: zoneScores,
  });
}

