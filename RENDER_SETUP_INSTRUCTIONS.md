# Render Backend Setup Instructions

## The Problem
The URL `https://night-driver-api.onrender.com` returns `x-render-routing: no-server`, which means no backend service is connected.

## Solution: Create the Render Service

### Step 1: Connect Your GitHub Repo to Render

1. Go to https://dashboard.render.com
2. Click **"New +"** → **"Web Service"**
3. Connect your GitHub account and select the `NightDriver` repository
4. Configure the service:

```
Name: night-driver-api
Region: Oregon (US West)
Branch: main
Root Directory: backend
Runtime: Node
Build Command: npm ci && npm run build
Start Command: node dist/index.js
Plan: Free
```

### Step 2: Add Environment Variables

In the Render dashboard, add these environment variables (leave blank for mock data):

```
NODE_ENV=production
PORT=3001
OPENWEATHER_API_KEY=(optional)
TICKETMASTER_API_KEY=(optional)
SEATGEEK_CLIENT_ID=(optional)
SEATGEEK_CLIENT_SECRET=(optional)
AVIATION_STACK_API_KEY=(optional)
TOMTOM_API_KEY=(optional)
```

### Step 3: Deploy

1. Click **"Create Web Service"**
2. Wait 5-10 minutes for the first deployment
3. Copy the `.onrender.com` URL from the dashboard

### Step 4: Update Frontend

Once deployed, update the frontend environment variable:

```bash
# On Vercel dashboard, set:
VITE_BACKEND_URL=https://your-actual-backend-url.onrender.com
```

### Step 5: Verify

```bash
# Test health endpoint
curl https://your-actual-backend-url.onrender.com/api/health

# Should return:
# {"status":"healthy","timestamp":"...","uptime":...}
```

## Alternative: Check Existing Service

If you believe the service already exists:

1. Go to https://dashboard.render.com/services
2. Look for any service named "night-driver" or similar
3. Check the **actual URL** shown in the dashboard
4. Share that URL so I can test the correct endpoint

