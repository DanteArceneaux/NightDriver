# Backend - Seattle Uber Driver Optimizer API

## Setup

1. Install dependencies:
```bash
npm install
```

2. Create a `.env` file in this directory:
```bash
PORT=3001
OPENWEATHER_API_KEY=your_key_here
TICKETMASTER_API_KEY=your_key_here
SEATGEEK_CLIENT_ID=your_key_here          # Optional - FREE at seatgeek.com/account/develop
AVIATIONSTACK_API_KEY=your_key_here
TOMTOM_API_KEY=your_key_here
```

### API Keys

| Service | Required? | Free Tier | Get Key |
|---------|-----------|-----------|---------|
| OpenWeatherMap | Yes | 1000 calls/day | [openweathermap.org](https://openweathermap.org/api) |
| Ticketmaster | Yes | 5000 calls/day | [developer.ticketmaster.com](https://developer.ticketmaster.com/) |
| SeatGeek | Optional | Unlimited | [seatgeek.com/account/develop](https://seatgeek.com/account/develop) |
| AviationStack | Yes | 100 calls/month | [aviationstack.com](https://aviationstack.com/) |
| TomTom | Yes | 2500 calls/day | [developer.tomtom.com](https://developer.tomtom.com/) |

**SeatGeek** adds additional event coverage, especially for sports (Seahawks, Mariners, Sounders, Kraken).

3. Run the server:
```bash
npm run dev
```

The API will be available at http://localhost:3001

## API Endpoints

- `GET /api/zones` - All zones with current scores
- `GET /api/zones/:id` - Single zone details
- `GET /api/forecast` - 4-hour forecast
- `GET /api/conditions` - Current weather, events, flights
- `GET /api/health` - Health check

## Development

- `npm run dev` - Start development server with auto-reload
- `npm run build` - Build for production
- `npm start` - Start production server

