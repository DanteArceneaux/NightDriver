# Vercel Environment Variable Setup

## ⚠️ IMPORTANT: Connect Frontend to Backend

The frontend is deployed on Vercel but needs to be configured to use the backend on Render.

## Steps to Configure

### 1. Go to Vercel Dashboard
https://vercel.com/dashboard

### 2. Select Your Project
Click on "night-driver" project

### 3. Go to Settings → Environment Variables

### 4. Add Backend URL
- **Name**: `VITE_BACKEND_URL`
- **Value**: `https://nightdriver.onrender.com`
- **Environment**: Select all (Production, Preview, Development)

### 5. Redeploy
- Go to "Deployments" tab
- Click the three dots "..." on the latest deployment
- Click "Redeploy"
- Check "Use existing Build Cache" (optional)

### 6. Verify
After ~30 seconds, visit:
https://night-driver.vercel.app

The app should now connect to the live backend!

## How to Verify It's Working

1. Open browser console (F12)
2. Look for: `🔌 Connecting to WebSocket: https://nightdriver.onrender.com`
3. Check network tab - API calls should go to `nightdriver.onrender.com`

## Current Status

✅ **Frontend**: https://night-driver.vercel.app (deployed, but using fallback APIs)
✅ **Backend**: https://nightdriver.onrender.com (deployed and healthy)
⚠️ **Connection**: Needs `VITE_BACKEND_URL` set in Vercel to link them

## Without This Variable

The frontend will work but use:
- Mock data from serverless functions (`/api/zones.ts`, etc.)
- No real-time WebSocket updates
- No live sports/traffic/event data

## With This Variable

The frontend will use:
- ✅ Real backend API at Render
- ✅ WebSocket real-time updates
- ✅ Live sports/traffic/events from external APIs
- ✅ Tesla integration
- ✅ All advanced features

