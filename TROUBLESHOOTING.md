# Troubleshooting Blue Screen Issue

## Quick Diagnostics

If you're seeing a blue screen, here's how to diagnose:

### 1. Check Browser Console
1. Open the app in your browser
2. Press **F12** to open Developer Tools
3. Go to **Console** tab
4. Look for any red error messages
5. Copy the error and share it

### 2. Check Network Tab
1. In Developer Tools, go to **Network** tab
2. Refresh the page
3. Look for any failed requests (red)
4. Check if API calls are working

### 3. Clear Browser Cache
Sometimes old cached files cause issues:
```
1. Press Ctrl+Shift+Delete (Windows) or Cmd+Shift+Delete (Mac)
2. Select "Cached images and files"
3. Click "Clear data"
4. Refresh the page (Ctrl+F5 or Cmd+Shift+R)
```

### 4. Clear LocalStorage
The lock state is saved in localStorage. If corrupted:
```javascript
// Open browser console and run:
localStorage.clear();
// Then refresh the page
```

### 5. Check if Dev Server is Running
```bash
# Should show the app running
curl http://localhost:3001

# Or open in browser:
http://localhost:3001
```

### 6. Common Issues

#### Issue: Blue screen with no content
**Cause**: JavaScript error preventing React from rendering
**Fix**: Check console for errors, clear cache

#### Issue: "Cannot read property of undefined"
**Cause**: Missing data or props
**Fix**: Check if backend is running, API is responding

#### Issue: White/blank screen
**Cause**: Build issue or routing problem
**Fix**: Rebuild the app: `npm run build`

#### Issue: Stuck on loading
**Cause**: API timeout or network issue
**Fix**: Check backend is running, check network tab

### 7. Test Specific URLs

Try these URLs to isolate the issue:

```
http://localhost:3001/          - Main app
http://localhost:3001/api/zones - API endpoint (should show JSON)
```

### 8. Check What Theme You're Using

The app has multiple themes. Some might have different backgrounds:
1. Look for the **Palette** icon in the header
2. Try switching themes
3. "Neon Cockpit" theme has a dark background (not blue)

### 9. Restart Everything

If all else fails:
```bash
# Stop all processes
# Ctrl+C in terminals

# Backend
cd backend
npm run dev

# Frontend (new terminal)
cd frontend
npm run dev
```

## What to Share

If the issue persists, please share:
1. **Console errors** (screenshot or text)
2. **Network tab** (any failed requests)
3. **Browser** (Chrome, Firefox, Safari, Edge?)
4. **URL** you're accessing
5. **What you see** (blue screen, white screen, error message?)

## Quick Fix Commands

```bash
# Clear everything and restart
cd frontend
rm -rf node_modules/.vite
npm run dev
```

## Known Issues

### Blue Background
If you're seeing a solid blue background:
- This might be the default Tailwind background
- Check if the app is actually loading (look for header)
- Check console for JavaScript errors
- The app uses dark theme, not blue

### Map Not Loading
- Leaflet CSS might not be loaded
- Check Network tab for failed CSS requests
- Check console for Leaflet errors

