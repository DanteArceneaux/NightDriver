#!/bin/bash

# Deployment Verification Script
echo "🔍 Verifying Deployments"
echo "========================"
echo ""

# Function to check if a URL is accessible
check_url() {
    local url=$1
    local name=$2
    
    echo "Testing $name..."
    if curl -s -o /dev/null -w "%{http_code}" "$url" | grep -q "200\|301\|302"; then
        echo "✅ $name is accessible"
        return 0
    else
        echo "❌ $name is not accessible or returned an error"
        return 1
    fi
}

# Check if we have the deployment URLs
echo "Please provide your deployment URLs:"
echo ""
read -p "Vercel Frontend URL (e.g., https://your-app.vercel.app): " VERCEL_URL
read -p "Render Backend URL (e.g., https://your-api.onrender.com): " RENDER_URL

echo ""
echo "🧪 Running Tests..."
echo "-------------------"
echo ""

# Test Backend Health
if [ -n "$RENDER_URL" ]; then
    echo "1. Backend Health Check:"
    HEALTH_RESPONSE=$(curl -s "$RENDER_URL/api/health")
    if [ -n "$HEALTH_RESPONSE" ]; then
        echo "✅ Backend is running"
        echo "Response: $HEALTH_RESPONSE"
    else
        echo "❌ Backend health check failed"
    fi
    echo ""
fi

# Test Backend API Endpoints
if [ -n "$RENDER_URL" ]; then
    echo "2. Backend API Endpoints:"
    
    echo "   Testing /api/zones..."
    if curl -s "$RENDER_URL/api/zones" | grep -q "zones"; then
        echo "   ✅ /api/zones working"
    else
        echo "   ❌ /api/zones failed"
    fi
    
    echo "   Testing /api/conditions..."
    if curl -s "$RENDER_URL/api/conditions" | grep -q "weather"; then
        echo "   ✅ /api/conditions working"
    else
        echo "   ❌ /api/conditions failed"
    fi
    
    echo "   Testing /api/forecast..."
    if curl -s "$RENDER_URL/api/forecast" | grep -q "points"; then
        echo "   ✅ /api/forecast working"
    else
        echo "   ❌ /api/forecast failed"
    fi
    echo ""
fi

# Test Frontend
if [ -n "$VERCEL_URL" ]; then
    echo "3. Frontend:"
    HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "$VERCEL_URL")
    if [ "$HTTP_CODE" = "200" ]; then
        echo "   ✅ Frontend is accessible (HTTP $HTTP_CODE)"
    else
        echo "   ⚠️  Frontend returned HTTP $HTTP_CODE"
    fi
    echo ""
fi

# Test Frontend API Routes (serverless functions)
if [ -n "$VERCEL_URL" ]; then
    echo "4. Frontend API Routes (Serverless):"
    
    echo "   Testing /api/zones..."
    if curl -s "$VERCEL_URL/api/zones" | grep -q "zones\|timestamp"; then
        echo "   ✅ /api/zones working"
    else
        echo "   ❌ /api/zones failed"
    fi
    
    echo "   Testing /api/conditions..."
    if curl -s "$VERCEL_URL/api/conditions" | grep -q "weather"; then
        echo "   ✅ /api/conditions working"
    else
        echo "   ❌ /api/conditions failed"
    fi
    
    echo "   Testing /api/forecast..."
    if curl -s "$VERCEL_URL/api/forecast" | grep -q "points"; then
        echo "   ✅ /api/forecast working"
    else
        echo "   ❌ /api/forecast failed"
    fi
    echo ""
fi

echo ""
echo "📊 Summary"
echo "----------"
echo "Frontend URL: ${VERCEL_URL:-Not provided}"
echo "Backend URL: ${RENDER_URL:-Not provided}"
echo ""
echo "Next Steps:"
echo "1. Open frontend URL in your browser"
echo "2. Check that the map loads"
echo "3. Verify zone scores are displaying"
echo "4. Check browser console for errors"
echo ""
echo "If issues persist:"
echo "- Check Vercel dashboard: https://vercel.com/dashboard"
echo "- Check Render dashboard: https://dashboard.render.com/"
echo "- Review deployment logs on both platforms"

