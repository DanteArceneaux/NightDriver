import type { Handler } from '@netlify/functions';

const OPENWEATHER_API_KEY = process.env.OPENWEATHER_API_KEY || 'a151d8c40b9db5483d12e7219a704eb1';
const TICKETMASTER_API_KEY = process.env.TICKETMASTER_API_KEY || '';

// Seattle coordinates
const SEATTLE_LAT = 47.6062;
const SEATTLE_LON = -122.3321;

interface WeatherData {
  temperature: number;
  description: string;
  isRaining: boolean;
  rainPrediction: string;
}

interface Event {
  name: string;
  venue: string;
  startTime: string;
  endTime: string;
  zoneId: string;
  type: 'sports' | 'concert' | 'conference' | 'festival' | 'other';
  attendees: number;
}

// Map venue to zone
function getZoneForVenue(venueName: string): string {
  const venueZoneMap: Record<string, string> = {
    'lumen field': 'sodo',
    'climate pledge arena': 'queen-anne',
    't-mobile park': 'sodo',
    'paramount theatre': 'downtown',
    'moore theatre': 'downtown',
    'showbox': 'downtown',
    'the crocodile': 'belltown',
    'neumos': 'capitol-hill',
    'key arena': 'queen-anne',
    'husky stadium': 'u-district',
    'benaroya hall': 'downtown',
    'mccaw hall': 'queen-anne',
  };

  const lowerVenue = venueName.toLowerCase();
  for (const [venue, zone] of Object.entries(venueZoneMap)) {
    if (lowerVenue.includes(venue)) {
      return zone;
    }
  }
  return 'downtown'; // Default
}

// Get event type from Ticketmaster classification
function getEventType(classifications: any[]): Event['type'] {
  if (!classifications || classifications.length === 0) return 'other';
  
  const segment = classifications[0]?.segment?.name?.toLowerCase() || '';
  const genre = classifications[0]?.genre?.name?.toLowerCase() || '';
  
  if (segment.includes('sport')) return 'sports';
  if (segment.includes('music') || genre.includes('rock') || genre.includes('pop')) return 'concert';
  if (segment.includes('arts') || segment.includes('theatre')) return 'concert';
  if (genre.includes('festival')) return 'festival';
  
  return 'other';
}

async function fetchRealWeather(): Promise<WeatherData> {
  try {
    const response = await fetch(
      `https://api.openweathermap.org/data/2.5/weather?lat=${SEATTLE_LAT}&lon=${SEATTLE_LON}&appid=${OPENWEATHER_API_KEY}&units=imperial`
    );
    
    if (!response.ok) {
      throw new Error('Weather API failed');
    }
    
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
  } catch (error) {
    console.error('Weather fetch error:', error);
    // Fallback mock data
    return {
      temperature: 52,
      description: 'Partly cloudy',
      isRaining: false,
      rainPrediction: 'No rain expected',
    };
  }
}

async function fetchRealEvents(): Promise<Event[]> {
  // If no Ticketmaster key, return empty (will show "no events")
  if (!TICKETMASTER_API_KEY || TICKETMASTER_API_KEY === 'your_key_here') {
    console.log('No Ticketmaster API key, returning empty events');
    return [];
  }

  try {
    const today = new Date();
    const endDate = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000); // Next 7 days
    
    const response = await fetch(
      `https://app.ticketmaster.com/discovery/v2/events.json?` +
      `latlong=${SEATTLE_LAT},${SEATTLE_LON}&radius=25&unit=miles&` +
      `startDateTime=${today.toISOString().split('.')[0]}Z&` +
      `endDateTime=${endDate.toISOString().split('.')[0]}Z&` +
      `size=20&sort=date,asc&apikey=${TICKETMASTER_API_KEY}`
    );

    if (!response.ok) {
      throw new Error('Ticketmaster API failed');
    }

    const data = await response.json();
    const events = data._embedded?.events || [];

    return events.map((event: any) => {
      const venue = event._embedded?.venues?.[0];
      const startDate = event.dates?.start?.dateTime || new Date().toISOString();
      const endDate = new Date(new Date(startDate).getTime() + 3 * 60 * 60 * 1000).toISOString();

      return {
        name: event.name,
        venue: venue?.name || 'Unknown Venue',
        startTime: startDate,
        endTime: endDate,
        zoneId: getZoneForVenue(venue?.name || ''),
        type: getEventType(event.classifications),
        attendees: Math.floor(Math.random() * 15000) + 5000, // Estimate
      };
    });
  } catch (error) {
    console.error('Events fetch error:', error);
    return [];
  }
}

export const handler: Handler = async () => {
  const [weather, events] = await Promise.all([
    fetchRealWeather(),
    fetchRealEvents(),
  ]);

  // Mock flights (would need Aviation API key for real data)
  const flights = [
    { flightNumber: 'AS101', arrivalTime: new Date(Date.now() + 1800000).toISOString(), origin: 'LAX', terminal: 'A' },
    { flightNumber: 'DL234', arrivalTime: new Date(Date.now() + 3600000).toISOString(), origin: 'SFO', terminal: 'S' },
    { flightNumber: 'UA567', arrivalTime: new Date(Date.now() + 5400000).toISOString(), origin: 'DEN', terminal: 'A' },
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
