# Deployment Checklist

Use this checklist to ensure successful deployment of the Night Driver application.

## Pre-Deployment

### 1. Code Quality
- [x] All TypeScript errors resolved
- [x] Backend builds successfully (`cd backend && npm run build`)
- [x] Frontend builds successfully (`cd frontend && npm run build`)
- [ ] All tests passing (`npm test` in both directories)
- [ ] No console errors in development mode

### 2. Environment Variables Prepared
- [ ] Backend `.env` file configured locally
- [ ] Frontend `.env` file configured (if using separate backend)
- [ ] All API keys obtained and documented
- [ ] Environment variables ready to add to deployment platforms

### 3. Git Repository
- [ ] All changes committed
- [ ] Repository pushed to GitHub/GitLab/Bitbucket
- [ ] Main branch is up to date
- [ ] No sensitive data in repository (API keys, passwords, etc.)

## Backend Deployment (Render)

### 4. Render Setup
- [ ] Account created at https://render.com
- [ ] New Web Service created
- [ ] Repository connected to Render
- [ ] Root directory set to `backend`
- [ ] Build command: `npm ci && npm run build`
- [ ] Start command: `node dist/index.js`
- [ ] Environment variables added:
  - [ ] `NODE_ENV=production`
  - [ ] `PORT=3001`
  - [ ] `OPENWEATHER_API_KEY`
  - [ ] `TICKETMASTER_API_KEY` (optional)
  - [ ] `SEATGEEK_CLIENT_ID` (optional)
  - [ ] `SEATGEEK_CLIENT_SECRET` (optional)
  - [ ] `AVIATION_STACK_API_KEY` (optional)
  - [ ] `TOMTOM_API_KEY` (optional)

### 5. Backend Verification
- [ ] Deployment completed successfully
- [ ] Health check endpoint responding: `https://your-backend.onrender.com/api/health`
- [ ] API endpoints working:
  - [ ] `/api/zones`
  - [ ] `/api/conditions`
  - [ ] `/api/forecast`
- [ ] No errors in Render logs
- [ ] WebSocket connection available (if needed)

## Frontend Deployment (Choose One)

### Option A: Vercel (Recommended)

#### 6. Vercel Setup
- [ ] Account created at https://vercel.com
- [ ] New Project created
- [ ] Repository connected to Vercel
- [ ] Root directory set to `frontend`
- [ ] Framework preset: Vite
- [ ] Build command: `npm ci && npm run build`
- [ ] Output directory: `dist`
- [ ] Environment variables added:
  - [ ] `OPENWEATHER_API_KEY`
  - [ ] `TICKETMASTER_API_KEY` (optional)
  - [ ] `VITE_BACKEND_URL` (if using separate backend)

#### 7. Vercel Verification
- [ ] Deployment completed successfully
- [ ] Frontend loads at Vercel URL
- [ ] API routes working:
  - [ ] `/api/zones`
  - [ ] `/api/conditions`
  - [ ] `/api/forecast`
- [ ] No console errors in browser
- [ ] Map displays correctly
- [ ] Zone data loads properly

### Option B: Netlify

#### 6. Netlify Setup
- [ ] Account created at https://netlify.com
- [ ] New Site created
- [ ] Repository connected to Netlify
- [ ] Base directory: `frontend`
- [ ] Build command: `npm ci && npm run build`
- [ ] Publish directory: `frontend/dist`
- [ ] Environment variables added:
  - [ ] `OPENWEATHER_API_KEY`
  - [ ] `TICKETMASTER_API_KEY` (optional)
  - [ ] `VITE_BACKEND_URL` (if using separate backend)

#### 7. Netlify Verification
- [ ] Deployment completed successfully
- [ ] Frontend loads at Netlify URL
- [ ] Serverless functions working:
  - [ ] `/.netlify/functions/zones`
  - [ ] `/.netlify/functions/conditions`
  - [ ] `/.netlify/functions/forecast`
- [ ] No console errors in browser
- [ ] Map displays correctly
- [ ] Zone data loads properly

## Post-Deployment

### 8. Integration Testing
- [ ] Frontend can communicate with backend (if using separate backend)
- [ ] CORS configured correctly (no CORS errors)
- [ ] Real-time updates working (WebSocket or polling)
- [ ] All features functional:
  - [ ] Zone scoring
  - [ ] Map display
  - [ ] Weather data
  - [ ] Events data (if API key provided)
  - [ ] Flight data (if API key provided)
  - [ ] Shift planner
  - [ ] Trip tracking

### 9. Performance Check
- [ ] Page load time < 3 seconds
- [ ] API response times acceptable
- [ ] No memory leaks
- [ ] Mobile responsive
- [ ] Works on major browsers (Chrome, Firefox, Safari, Edge)

### 10. Monitoring Setup
- [ ] Error tracking configured (optional: Sentry, LogRocket)
- [ ] Analytics configured (optional: Google Analytics, Plausible)
- [ ] Uptime monitoring (optional: UptimeRobot, Pingdom)
- [ ] Deployment notifications configured (Slack, email, etc.)

### 11. Documentation
- [ ] Deployment URLs documented
- [ ] API endpoints documented
- [ ] Environment variables documented
- [ ] Known issues documented
- [ ] User guide updated (if applicable)

## Troubleshooting

### Common Issues

#### Backend Issues
- **Build fails**: Check TypeScript errors in Render logs
- **Health check fails**: Verify `/api/health` endpoint exists
- **API returns 500**: Check environment variables are set
- **CORS errors**: Verify CORS middleware configured correctly

#### Frontend Issues
- **Build fails**: Check TypeScript errors in Vercel/Netlify logs
- **API routes 404**: Verify `vercel.json` or `netlify.toml` configuration
- **Blank page**: Check browser console for errors
- **Map not loading**: Verify Leaflet CSS is imported

#### Integration Issues
- **CORS errors**: Add frontend URL to backend CORS whitelist
- **WebSocket fails**: Fallback to polling should work automatically
- **API timeout**: Check backend is running and accessible

## Rollback Plan

If deployment fails:

1. **Immediate Rollback**
   - Vercel: Go to Deployments → Previous deployment → Promote to Production
   - Netlify: Go to Deploys → Previous deploy → Publish deploy
   - Render: Go to Events → Previous deploy → Manual Deploy

2. **Fix and Redeploy**
   - Identify issue from logs
   - Fix locally
   - Test locally
   - Commit and push
   - Monitor new deployment

## Success Criteria

Deployment is successful when:
- ✅ All health checks pass
- ✅ No errors in deployment logs
- ✅ Frontend loads without errors
- ✅ API endpoints return valid data
- ✅ Real-time updates working
- ✅ Mobile responsive
- ✅ Performance acceptable

## Next Steps After Deployment

1. **Announce**: Share deployment URL with users
2. **Monitor**: Watch logs for first 24 hours
3. **Gather Feedback**: Collect user feedback
4. **Iterate**: Plan next features/improvements
5. **Maintain**: Keep dependencies updated

## Support Resources

- **Vercel Docs**: https://vercel.com/docs
- **Netlify Docs**: https://docs.netlify.com
- **Render Docs**: https://render.com/docs
- **Project Issues**: [Your GitHub Issues URL]
- **Contact**: [Your contact information]

---

**Last Updated**: December 28, 2025
**Version**: 5.0.1

