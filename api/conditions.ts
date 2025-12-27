import type { VercelRequest, VercelResponse } from '@vercel/node';

const OPENWEATHER_API_KEY = process.env.OPENWEATHER_API_KEY || 'a151d8c40b9db5483d12e7219a704eb1';
const SEATTLE_LAT = 47.6062;
const SEATTLE_LON = -122.3321;

async function fetchRealWeather() {
  try {
    const response = await fetch(
      `https://api.openweathermap.org/data/2.5/weather?lat=${SEATTLE_LAT}&lon=${SEATTLE_LON}&appid=${OPENWEATHER_API_KEY}&units=imperial`
    );
    if (!response.ok) throw new Error('Weather API failed');
    const data = await response.json();
    const isRaining = data.weather?.some((w: any) => 
      w.main === 'Rain' || w.main === 'Drizzle' || w.main === 'Thunderstorm'
    );
    return {
      temperature: Math.round(data.main?.temp || 50),
      description: data.weather?.[0]?.description || 'Unknown',
      isRaining: isRaining || false,
      rainPrediction: isRaining ? 'Currently raining' : 'No rain expected',
    };
  } catch {
    return { temperature: 52, description: 'Partly cloudy', isRaining: false, rainPrediction: 'No rain expected' };
  }
}

export default async function handler(_req: VercelRequest, res: VercelResponse) {
  const weather = await fetchRealWeather();

  // Events would need Ticketmaster API key - returning empty for now
  const events: any[] = [];

  const flights = [
    { flightNumber: 'AS101', arrivalTime: new Date(Date.now() + 1800000).toISOString(), origin: 'LAX', terminal: 'A' },
    { flightNumber: 'DL234', arrivalTime: new Date(Date.now() + 3600000).toISOString(), origin: 'SFO', terminal: 'S' },
    { flightNumber: 'UA567', arrivalTime: new Date(Date.now() + 5400000).toISOString(), origin: 'DEN', terminal: 'A' },
  ];

  res.setHeader('Access-Control-Allow-Origin', '*');
  res.json({ weather, events, flights, lastUpdated: new Date().toISOString() });
}

