import type { Handler } from '@netlify/functions';

export const handler: Handler = async () => {
  // Mock weather data (in production, call OpenWeather API)
  const weather = {
    temperature: 52 + Math.floor(Math.random() * 10),
    description: ['Clear', 'Partly Cloudy', 'Overcast', 'Light Rain'][Math.floor(Math.random() * 4)],
    isRaining: Math.random() > 0.7,
    rainPrediction: 'No rain expected',
  };

  // Mock events
  const events = [
    {
      name: 'Seahawks Game',
      venue: 'Lumen Field',
      startTime: new Date(Date.now() + 3600000 * 3).toISOString(),
      endTime: new Date(Date.now() + 3600000 * 6).toISOString(),
      zoneId: 'sodo',
      type: 'sports',
      attendees: 68000,
    },
    {
      name: 'Concert at Climate Pledge',
      venue: 'Climate Pledge Arena',
      startTime: new Date(Date.now() + 3600000 * 5).toISOString(),
      endTime: new Date(Date.now() + 3600000 * 8).toISOString(),
      zoneId: 'queen-anne',
      type: 'concert',
      attendees: 18000,
    },
  ];

  // Mock flights
  const flights = [
    { flightNumber: 'AS123', arrivalTime: new Date(Date.now() + 1800000).toISOString(), origin: 'LAX', terminal: 'A' },
    { flightNumber: 'DL456', arrivalTime: new Date(Date.now() + 3600000).toISOString(), origin: 'JFK', terminal: 'S' },
    { flightNumber: 'UA789', arrivalTime: new Date(Date.now() + 5400000).toISOString(), origin: 'ORD', terminal: 'A' },
  ];

  return {
    statusCode: 200,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
    },
    body: JSON.stringify({
      weather,
      events,
      flights,
      lastUpdated: new Date().toISOString(),
    }),
  };
};

