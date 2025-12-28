#!/bin/bash

# Deployment Script for Night Driver
# This script helps deploy both frontend and backend

set -e  # Exit on error

echo "🚀 Night Driver Deployment Script"
echo "================================="
echo ""

# Check if we're in the right directory
if [ ! -f "vercel.json" ] || [ ! -f "render.yaml" ]; then
    echo "❌ Error: Please run this script from the project root directory"
    exit 1
fi

echo "📦 Step 1: Testing Builds Locally"
echo "-----------------------------------"
echo ""

# Build backend first
echo "[1/2] Building backend..."
cd backend
npm ci
npm run build
cd ..
echo "✅ Backend built successfully"
echo ""

# Build frontend
echo "[2/2] Building frontend..."
cd frontend
npm ci
npm run build
cd ..
echo "✅ Frontend built successfully"
echo ""

echo "✅ All builds successful!"
echo ""

echo "📋 Step 2: Pre-Deployment Checklist"
echo "-----------------------------------"
echo ""
echo "Before deploying, ensure:"
echo "  [✓] All code changes committed"
echo "  [✓] Git repository pushed to remote"
echo "  [?] Environment variables configured on platforms"
echo "  [?] API keys ready for deployment platforms"
echo ""

echo "🔧 Step 3: Deployment Options"
echo "-----------------------------------"
echo ""
echo "Option A - AUTOMATIC DEPLOYMENT (Recommended):"
echo "  1. Commit your changes: git add . && git commit -m 'Deploy update'"
echo "  2. Push to main: git push origin main"
echo "  3. Vercel and Render will auto-deploy from GitHub"
echo ""
echo "Option B - MANUAL DEPLOYMENT:"
echo ""
echo "  VERCEL (Frontend):"
echo "    1. Go to: https://vercel.com/dashboard"
echo "    2. Find your project"
echo "    3. Click 'Deploy' → Select 'main' branch"
echo ""
echo "  RENDER (Backend):"
echo "    1. Go to: https://dashboard.render.com/"
echo "    2. Find 'night-driver-api'"
echo "    3. Click 'Manual Deploy' → 'Deploy latest commit'"
echo ""

echo "📊 Step 4: Post-Deployment Verification"
echo "-----------------------------------"
echo ""
echo "After deployment, verify:"
echo "  1. Backend health: curl https://your-backend.onrender.com/api/health"
echo "  2. Frontend loads: Open your Vercel URL in browser"
echo "  3. API endpoints work: Test /api/zones, /api/conditions, /api/forecast"
echo "  4. Check deployment logs for errors"
echo "  5. Test on mobile device"
echo ""

echo "📚 Additional Resources:"
echo "  - Deployment Fixes: DEPLOYMENT_FIXES.md"
echo "  - Deployment Checklist: DEPLOYMENT_CHECKLIST.md"
echo ""

echo "✅ Ready to deploy!"
echo ""
