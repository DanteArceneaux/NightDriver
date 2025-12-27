# 🚀 Quick Start Guide - Seattle Uber Driver Optimizer

## Installation & Setup (5 minutes)

### Step 1: Install Dependencies

**Backend:**
```bash
cd backend
npm install
```

**Frontend:**
```bash
cd frontend
npm install
```

### Step 2: Start the Servers

**Terminal 1 - Backend:**
```bash
cd backend
npm run dev
```

You should see:
```
🚗 Seattle Driver Optimizer API running on port 3001
📍 API available at http://localhost:3001
🏥 Health check: http://localhost:3001/api/health

🔑 API Key Status:
  Weather: ✗ (using mock data)
  Events: ✗ (using mock data)
  Flights: ✗ (using mock data)
  Traffic: ✗ (using mock data)
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm run dev
```

You should see:
```
  VITE v5.x.x  ready in xxx ms

  ➜  Local:   http://localhost:3000/
  ➜  Network: use --host to expose
```

### Step 3: Open the App

Navigate to **http://localhost:3000** in your browser!

---

## ✅ What You Should See

1. **Header** - "Seattle Driver Optimizer" with refresh timer
2. **Top Pick Card** - Large recommendation with zone name and score
3. **Interactive Map** - Seattle with colored zones (click them!)
4. **Forecast Timeline** - Next 4 hours of predictions
5. **Live Conditions** - Weather, events, and flights
6. **Zone List** - All 12 zones with scores

---

## 🎯 Testing the App

### Test 1: Check Different Times
The scoring changes based on time of day:
- **Morning (7-9am)**: Downtown & SLU should be high
- **Evening (5-7pm)**: SLU should be highest
- **Late Night (10pm-2am)**: Capitol Hill & Belltown should be high

### Test 2: Watch Auto-Refresh
The countdown timer in the header shows seconds until next refresh (300s = 5 minutes)

### Test 3: Click a Zone on the Map
Hover over zones to see tooltips with score breakdowns

### Test 4: Check API Health
Visit http://localhost:3001/api/health to verify backend is running

### Test 5: View Raw Data
Visit http://localhost:3001/api/zones to see the JSON response

---

## 🔑 Adding Real API Keys (Optional)

The app works perfectly with **mock data** - no API keys needed! But if you want real data:

1. **Create .env file** in the `backend/` directory:
```bash
cd backend
cp .env.example .env
```

2. **Get free API keys:**

**OpenWeatherMap** (recommended - easiest to get)
- https://openweathermap.org/api
- Sign up → API Keys → Copy key
- Paste into `.env` as `OPENWEATHER_API_KEY=your_key`

**Ticketmaster** (for real event data)
- https://developer.ticketmaster.com/
- Sign up → Get API Key
- Paste into `.env` as `TICKETMASTER_API_KEY=your_key`

**AeroDataBox** (for real flight data)
- https://rapidapi.com/aerodatabox/api/aerodatabox
- Sign up → Subscribe to Free Plan
- Paste into `.env` as `AERODATABOX_API_KEY=your_key`

**TomTom** (for real traffic data)
- https://developer.tomtom.com/
- Sign up → Get API Key
- Paste into `.env` as `TOMTOM_API_KEY=your_key`

3. **Restart backend**
```bash
# Stop backend (Ctrl+C)
npm run dev
```

You should now see ✓ instead of ✗ for the API keys you added!

---

## 🐛 Troubleshooting

### Backend won't start
- Check if port 3001 is already in use
- Try: `PORT=3002 npm run dev` (then update frontend proxy in vite.config.ts)

### Frontend won't start
- Check if port 3000 is already in use
- Delete `node_modules` and run `npm install` again

### Map not showing
- Check browser console for errors
- Make sure backend is running on port 3001

### "Failed to fetch zones" error
- Verify backend is running: http://localhost:3001/api/health
- Check browser console for CORS errors

### Mock data looks weird
- This is normal! Mock data is random/time-based
- Add real API keys for accurate data

---

## 📱 Mobile Testing

Open http://localhost:3000 on your phone (must be on same WiFi):

1. Find your computer's local IP:
   - **Mac/Linux**: `ifconfig | grep inet`
   - **Windows**: `ipconfig`

2. Open on phone: `http://YOUR_IP:3000`

Example: `http://192.168.1.100:3000`

---

## 🎨 Customization Ideas

### Change refresh interval
**frontend/src/App.tsx** line 7:
```typescript
const { data, loading, error, refresh } = useZoneScores(180000); // 3 minutes
```

### Change default map view
**frontend/src/components/Map/SeattleMap.tsx** line 17:
```typescript
const center: [number, number] = [47.6205, -122.3493]; // Adjust coordinates
const zoom = 12; // Adjust zoom level
```

### Add more zones
**backend/src/data/zones.ts** - add new zone objects

### Adjust scoring weights
**backend/src/services/scoring.service.ts** - modify boost calculations

---

## 🚀 Next Steps

1. ✅ Got the app running? Great!
2. 🗺️ Explore different zones on the map
3. ⏰ Wait for the auto-refresh to see data update
4. 🔑 Add real API keys for accurate data
5. 📱 Test on mobile device
6. 🎨 Customize to your preferences

---

**Need help?** Check the main [README.md](README.md) for architecture details and troubleshooting.

**Ready to deploy?** See deployment guides for Vercel (frontend) and Railway (backend).

