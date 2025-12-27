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
AERODATABOX_API_KEY=your_key_here
TOMTOM_API_KEY=your_key_here
```

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

