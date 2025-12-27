# 🚗 Seattle Uber Driver Optimizer

A real-time decision support tool that tells Uber/Lyft drivers WHERE to be and WHEN, by aggregating public signals that correlate with ride demand in Seattle.

![Seattle Driver Optimizer](https://img.shields.io/badge/status-MVP-green)

## 🎯 What It Does

The app displays a **heatmap** of Seattle zones scored by predicted demand (0-100), combining multiple real-time data sources:

- ⏰ **Time Patterns** - Historical demand by hour/day
- 🎫 **Events** - Concerts, sports, conferences (Ticketmaster)
- 🌧️ **Weather** - Rain increases demand (OpenWeatherMap)
- ✈️ **Flights** - SeaTac arrivals (AeroDataBox)
- 🚗 **Traffic** - Congestion levels (TomTom)

## 🌟 Features

- **Interactive Map** with color-coded zones (red = hot, blue = cold)
- **Top Recommendation** card with reasoning
- **4-Hour Forecast** timeline showing future hotspots
- **Live Conditions** displaying weather, events, and flights
- **Auto-Refresh** every 5 minutes
- **Mobile-Optimized** dark mode interface

## 🏗️ Architecture

```
┌─────────────┐
│   Frontend  │  React + Vite + Tailwind + Leaflet
│  (Port 3000)│
└──────┬──────┘
       │
       │ HTTP
       ▼
┌─────────────┐
│   Backend   │  Node.js + Express + TypeScript
│  (Port 3001)│
└──────┬──────┘
       │
       │ Aggregates data from:
       ├─ Ticketmaster API
       ├─ OpenWeatherMap API
       ├─ AeroDataBox API
       └─ TomTom API
```

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ and npm
- Git

### Installation

1. **Clone the repository**
```bash
git clone <your-repo-url>
cd weird
```

2. **Install Backend Dependencies**
```bash
cd backend
npm install
```

3. **Install Frontend Dependencies**
```bash
cd ../frontend
npm install
```

4. **Configure API Keys** (Optional - works with mock data without keys)

Copy the example env file:
```bash
cd ../backend
cp .env.example .env
```

Edit `.env` and add your API keys:
```env
PORT=3001
OPENWEATHER_API_KEY=your_key_here
TICKETMASTER_API_KEY=your_key_here
AERODATABOX_API_KEY=your_key_here
TOMTOM_API_KEY=your_key_here
```

### Get Free API Keys

1. **OpenWeatherMap** (free tier: 1000 calls/day)
   - Sign up at https://openweathermap.org/api
   
2. **Ticketmaster** (free tier: 5000 calls/day)
   - Sign up at https://developer.ticketmaster.com/
   
3. **AeroDataBox** (free tier: 100 calls/month)
   - Sign up at https://rapidapi.com/aerodatabox/api/aerodatabox
   
4. **TomTom** (free tier: 2500 calls/day)
   - Sign up at https://developer.tomtom.com/

### Running the App

1. **Start Backend** (in `backend/` directory)
```bash
npm run dev
```

Backend will run on http://localhost:3001

2. **Start Frontend** (in `frontend/` directory, new terminal)
```bash
npm run dev
```

Frontend will run on http://localhost:3000

3. **Open in Browser**

Navigate to http://localhost:3000

## 📊 How It Works

### Scoring Algorithm

Each zone receives a score (0-100) based on:

```
SCORE = Baseline (40%)
      + Events (25%)
      + Weather (15%)
      + Flights (15%)
      + Traffic (5%)
```

### Time Patterns

The system knows Seattle's demand patterns:
- **Weekday 7-9am**: Downtown, SLU high (commute)
- **Weekday 5-7pm**: SLU, Downtown high (commute)
- **Fri/Sat 10pm-2am**: Capitol Hill, Belltown high (nightlife)
- **Sunday morning**: Airport high (weekend trips ending)

### Event Detection

Events boost nearby zones:
- **1 hour before**: +20 points (people arriving)
- **During event**: +15 points
- **30 min after**: +30 points (highest surge for rides home)

### Weather Impact

- **Currently raining**: +15 to all zones
- **Rain predicted soon**: +8 to all zones

## 📱 Mobile Usage

The app is optimized for mobile use while driving:
- Large touch targets (48px minimum)
- Glanceable information
- Dark mode (easier to see at night)
- Auto-refresh (no manual interaction needed)

## 🗺️ Seattle Zones

The app divides Seattle into 12 zones:

1. **SeaTac Airport** - Flight arrivals
2. **Downtown/Pike Place** - Tourism, business
3. **Capitol Hill** - Nightlife, restaurants
4. **South Lake Union** - Tech workers (Amazon, Google)
5. **University District** - Students, UW events
6. **Belltown** - Nightlife, hotels
7. **Ballard** - Bars, restaurants
8. **Fremont** - Restaurants, quirky shops
9. **Queen Anne** - Climate Pledge Arena
10. **Stadium District** - Seahawks, Mariners, Sounders
11. **Pioneer Square** - Events, nightlife
12. **Waterfront/Pier** - Tourists, cruise ships

## 🛠️ Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | React 18, Vite, TypeScript, Tailwind CSS |
| Map | Leaflet + OpenStreetMap |
| State | Zustand |
| Backend | Node.js, Express, TypeScript |
| Caching | node-cache (in-memory) |

## 📡 API Endpoints

| Endpoint | Description |
|----------|-------------|
| `GET /api/zones` | All zones with current scores |
| `GET /api/zones/:id` | Single zone details |
| `GET /api/forecast` | 4-hour forecast |
| `GET /api/conditions` | Current weather, events, flights |
| `GET /api/health` | Health check |

## 🎨 Design Decisions

### Why Dark Mode?
Easier to see while driving at night, reduces eye strain

### Why Leaflet over Mapbox?
No credit card required for free tier, fully open source

### Why Mock Data Support?
App works immediately without API keys - perfect for testing and demos

### Why 5-Minute Refresh?
Balance between freshness and API rate limits

## 🔮 Future Enhancements

- [ ] Push notifications for surge predictions
- [ ] Historical accuracy tracking
- [ ] User-reported demand (crowdsourced)
- [ ] Lyft/DoorDash mode toggle
- [ ] Voice announcements while driving
- [ ] Progressive Web App (PWA) support
- [ ] Offline mode with cached data

## 🤝 Contributing

This is a personal project, but contributions are welcome! Open an issue or submit a PR.

## 📄 License

MIT License - Feel free to use this for your own projects!

## ⚠️ Disclaimer

This tool provides recommendations based on public data patterns. Actual ride demand may vary. Always use your judgment and follow local traffic laws.

## 🙏 Acknowledgments

- Inspired by the gig economy and the challenges drivers face
- Built with data from Ticketmaster, OpenWeatherMap, AeroDataBox, and TomTom
- Map tiles from OpenStreetMap contributors

---

**Built with ❤️ for Seattle drivers**

