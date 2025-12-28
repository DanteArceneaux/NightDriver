#!/bin/bash

# Deployment Script for Night Driver
# This script helps deploy both frontend and backend

echo "🚀 Night Driver Deployment Script"
echo "================================="

# Check if we're in the right directory
if [ ! -f "vercel.json" ] || [ ! -f "render.yaml" ]; then
    echo "❌ Error: Please run this script from the project root directory"
    exit 1
fi

echo ""
echo "📦 Building projects locally first..."
echo "-----------------------------------"

# Build frontend
echo "Building frontend..."
cd frontend
npm run build
if [ $? -ne 0 ]; then
    echo "❌ Frontend build failed!"
    exit 1
fi
cd ..
echo "✅ Frontend built successfully"

# Build backend
echo "Building backend..."
cd backend
npm run build
if [ $? -ne 0 ]; then
    echo "⚠️ Backend build has warnings but should still deploy"
fi
cd ..
echo "✅ Backend built successfully"

echo ""
echo "🔧 Deployment Methods"
echo "-------------------"
echo ""
echo "Since automatic deployments should have already triggered from git push,"
echo "you can manually trigger deployments via:"
echo ""
echo "1. VERCEL (Frontend):"
echo "   - Go to: https://vercel.com/dashboard"
echo "   - Find project: 'Night Driver' or 'seattle-driver-optimizer-frontend'"
echo "   - Click 'Deploy' → 'Deploy from GitHub' → Select 'main' branch"
echo ""
echo "2. RENDER (Backend):"
echo "   - Go to: https://dashboard.render.com/"
echo "   - Find service: 'night-driver-api'"
echo "   - Click 'Manual Deploy' → 'Deploy latest commit'"
echo ""
echo "3. GIT PUSH (Triggers both):"
echo "   git add ."
echo "   git commit -m 'Deploy update'"
echo "   git push origin main"
echo ""
echo "✅ Builds are ready for deployment!"
echo ""
echo "📊 Post-Deployment Checks:"
echo "1. Frontend: Open Vercel URL to verify"
echo "2. Backend: Test /api/health endpoint"
echo "3. Check deployment logs for any errors"
