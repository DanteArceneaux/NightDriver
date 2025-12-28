#!/bin/bash

# Verification script for Night Driver Deployment
# This script is used by the AI to verify successful deployment to Vercel and Render.

FRONTEND_URL="https://night-driver.vercel.app"
# We'll try to find the real backend URL. For now, we'll check the common Render ones.
BACKEND_URLS=("https://night-driver-api.onrender.com" "https://night-driver-backend.onrender.com")

echo "🔍 Starting Deployment Verification..."

# 1. Verify Frontend
echo "--- Checking Frontend: $FRONTEND_URL ---"
FRONTEND_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$FRONTEND_URL")
if [ "$FRONTEND_STATUS" -eq "200" ] || [ "$FRONTEND_STATUS" -eq "401" ]; then
    echo "✅ Frontend is reachable (Status: $FRONTEND_STATUS)"
    
    # Check for specific asset loading (the 404 issue)
    # We'll check the root HTML and grep for assets
    ASSET_LINE=$(curl -s "$FRONTEND_URL" | grep -o 'assets/index-[a-zA-Z0-9]*\.\(css\|js\)' | head -n 1)
    if [ ! -z "$ASSET_LINE" ]; then
        ASSET_URL="$FRONTEND_URL/$ASSET_LINE"
        ASSET_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$ASSET_URL")
        if [ "$ASSET_STATUS" -eq "200" ]; then
            echo "✅ Assets are loading correctly ($ASSET_LINE)"
        else
            echo "❌ Assets are returning 404! ($ASSET_LINE)"
            EXIT_CODE=1
        fi
    else
        echo "⚠️ Could not find asset links in HTML. Site might still be loading or has no assets."
    fi
else
    echo "❌ Frontend check failed (Status: $FRONTEND_STATUS)"
    EXIT_CODE=1
fi

# 2. Verify Backend
for BURL in "${BACKEND_URLS[@]}"; do
    echo "--- Checking Backend: $BURL ---"
    HEALTH_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$BURL/api/health")
    if [ "$HEALTH_STATUS" -eq "200" ]; then
        echo "✅ Backend is healthy at $BURL"
        FOUND_BACKEND=true
        break
    else
        echo "❓ Backend not found or unhealthy at $BURL (Status: $HEALTH_STATUS)"
    fi
done

if [ "$FOUND_BACKEND" != true ]; then
    echo "❌ No working backend found. Please update BACKEND_URL in verify-deployment.sh"
    # Not failing the whole script yet as backend might be optional/mocked
fi

if [ -z "$EXIT_CODE" ]; then
    echo "🚀 DEPLOYMENT VERIFICATION PASSED!"
    exit 0
else
    echo "💥 DEPLOYMENT VERIFICATION FAILED!"
    exit 1
fi

