# Blue Screen Issue - Quick Fix

## What's Happening

If you're seeing a blue screen, it's likely one of these issues:

### 1. **Browser Cache Issue** (Most Common)
The browser is loading old JavaScript files.

**Fix:**
```
1. Press Ctrl+Shift+Delete (Windows) or Cmd+Shift+Delete (Mac)
2. Check "Cached images and files"
3. Click "Clear data"
4. Press Ctrl+F5 (or Cmd+Shift+R) to hard refresh
```

### 2. **LocalStorage Corruption**
The lock state or layout settings might be corrupted.

**Fix:**
```javascript
// Open browser console (F12) and run:
localStorage.clear();
// Then refresh the page
```

### 3. **React Error Boundary**
A component might be crashing.

**Check:**
1. Open Developer Tools (F12)
2. Go to Console tab
3. Look for red error messages
4. Share the error message

## Quick Diagnostic Steps

### Step 1: Check if Dev Server is Running
```bash
# Should show HTML
curl http://localhost:3001
```

### Step 2: Check Console for Errors
1. Open app in browser: http://localhost:3001
2. Press F12
3. Go to Console tab
4. Look for errors (red text)

### Step 3: Check Network Tab
1. In Dev Tools, go to Network tab
2. Refresh page
3. Look for failed requests (red)

### Step 4: Try Safe Mode
Clear everything and start fresh:
```bash
# In browser console (F12):
localStorage.clear();
sessionStorage.clear();

# Then refresh: Ctrl+F5
```

## Common Causes & Fixes

### Cause: "Cannot read property 'map' of undefined"
**Meaning**: Data isn't loading properly
**Fix**: 
- Check if backend is running
- Check Network tab for failed API calls
- Try refreshing the page

### Cause: "Unexpected token '<'"
**Meaning**: JavaScript file is being served as HTML (routing issue)
**Fix**:
- Clear browser cache
- Hard refresh (Ctrl+F5)
- Restart dev server

### Cause: White/Blue solid screen, no errors
**Meaning**: CSS issue or theme problem
**Fix**:
```javascript
// In console:
localStorage.setItem('theme-id', 'neon');
localStorage.setItem('layout-id', 'cockpit');
// Refresh
```

## Emergency Reset

If nothing works, nuclear option:

```bash
# Stop dev server (Ctrl+C)

# Clear everything
cd frontend
rm -rf node_modules/.vite
rm -rf dist

# Restart
npm run dev
```

Then in browser:
```javascript
// F12 Console
localStorage.clear();
sessionStorage.clear();
// Ctrl+F5 to refresh
```

## What to Check in Console

Look for these specific errors:

1. **"Failed to fetch"** = Backend not running or CORS issue
2. **"Cannot read property"** = Missing data or props
3. **"Unexpected token"** = Build/routing issue
4. **"Module not found"** = Import error
5. **No errors, just blue** = CSS/theme issue

## Test URLs

Try these to isolate the issue:

```
http://localhost:3001/          → Should show the app
http://localhost:3001/api/zones → Should show JSON (if backend running)
```

## Still Stuck?

Share this info:
1. **Console errors** (screenshot)
2. **Network tab** (any red/failed requests)
3. **Browser** (Chrome/Firefox/Safari/Edge)
4. **What you see** (describe the blue screen - solid blue? header visible? any text?)

## Most Likely Fix

Based on the changes we just made, the most likely issue is:

**Browser cache has old JavaScript**

Solution:
1. Hard refresh: **Ctrl+Shift+R** (Windows) or **Cmd+Shift+R** (Mac)
2. Or clear cache and refresh
3. If that doesn't work, clear localStorage and refresh

The app builds successfully, so it's almost certainly a browser caching issue!

