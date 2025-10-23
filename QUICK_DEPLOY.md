# ⚡ Quick Deployment Guide

Fast-track guide to deploy SecurePath to production in under 30 minutes.

## Prerequisites

- GitHub account
- Vercel account
- MongoDB Atlas account
- Google Maps API key

---

## Step 1: Database Setup (5 minutes)

### MongoDB Atlas

```bash
1. Go to mongodb.com/cloud/atlas
2. Create free account
3. Create cluster (M0 Free tier)
4. Create database user
5. Whitelist IP: 0.0.0.0/0
6. Get connection string
```

**Connection String Format:**
```
mongodb+srv://username:password@cluster.mongodb.net/securepath?retryWrites=true&w=majority
```

---

## Step 2: Backend Deployment (10 minutes)

### Option A: Vercel (Serverless)

```bash
# Install Vercel CLI
npm install -g vercel

# Navigate to backend
cd backend

# Deploy
vercel --prod

# Add environment variables
vercel env add MONGODB_URI production
vercel env add JWT_SECRET production
vercel env add REFRESH_TOKEN_SECRET production
vercel env add FRONTEND_URL production
vercel env add CORS_ORIGIN production

# Redeploy with env vars
vercel --prod
```

### Option B: Render (Recommended for WebSocket)

```bash
1. Go to render.com
2. New Web Service
3. Connect GitHub repo
4. Root directory: backend
5. Build: npm install
6. Start: npm start
7. Add environment variables (see below)
8. Create service
```

**Backend Environment Variables:**
```env
NODE_ENV=production
PORT=5000
MONGODB_URI=<your-mongodb-uri>
JWT_SECRET=<generate-32-char-secret>
REFRESH_TOKEN_SECRET=<generate-32-char-secret>
JWT_EXPIRE=15m
REFRESH_TOKEN_EXPIRE=7d
FRONTEND_URL=https://your-frontend.vercel.app
CORS_ORIGIN=https://your-frontend.vercel.app
```

**Generate Secrets:**
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

---

## Step 3: Frontend Deployment (10 minutes)

### Vercel Dashboard

```bash
1. Go to vercel.com
2. Import Project
3. Select your GitHub repo
4. Root directory: frontend
5. Framework: Vite
6. Add environment variables (see below)
7. Deploy
```

**Frontend Environment Variables:**
```env
VITE_API_URL=https://your-backend-url
VITE_API_BASE_URL=https://your-backend-url
VITE_GOOGLE_MAPS_API_KEY=<your-google-maps-key>
VITE_SENTRY_DSN=<optional-sentry-dsn>
```

### Vercel CLI (Alternative)

```bash
# Navigate to frontend
cd frontend

# Deploy
vercel --prod

# Add environment variables
vercel env add VITE_API_URL production
vercel env add VITE_API_BASE_URL production
vercel env add VITE_GOOGLE_MAPS_API_KEY production

# Redeploy
vercel --prod
```

---

## Step 4: Update CORS (2 minutes)

After frontend deployment, update backend environment variables:

```env
FRONTEND_URL=<actual-frontend-url-from-vercel>
CORS_ORIGIN=<actual-frontend-url-from-vercel>
```

Redeploy backend to apply changes.

---

## Step 5: Verify Deployment (3 minutes)

### Test Checklist

- [ ] Frontend loads: `https://your-frontend.vercel.app`
- [ ] Backend health: `https://your-backend-url/health`
- [ ] User registration works
- [ ] User login works
- [ ] Map displays correctly
- [ ] Can create incident
- [ ] No console errors

---

## Optional: Monitoring Setup

### Sentry (Error Tracking)

```bash
1. Go to sentry.io
2. Create account
3. Create two projects:
   - securepath-frontend (React)
   - securepath-backend (Node.js)
4. Get DSN for each
5. Add to environment variables:
   - VITE_SENTRY_DSN (frontend)
   - SENTRY_DSN (backend)
6. Redeploy both
```

### UptimeRobot (Uptime Monitoring)

```bash
1. Go to uptimerobot.com
2. Create free account
3. Add monitors:
   - Frontend: https://your-frontend.vercel.app
   - Backend Health: https://your-backend-url/health
4. Set up email alerts
```

---

## Troubleshooting

### Frontend Can't Connect to Backend

**Check:**
1. Backend URL correct in frontend env vars
2. CORS_ORIGIN matches frontend URL in backend
3. Backend is running (check health endpoint)

**Fix:**
```bash
# Update frontend env
vercel env add VITE_API_URL production
# Enter correct backend URL

# Update backend env
vercel env add CORS_ORIGIN production
# Enter correct frontend URL

# Redeploy both
```

### Database Connection Fails

**Check:**
1. MongoDB URI correct
2. Database user created
3. IP whitelist includes 0.0.0.0/0
4. Password doesn't contain special characters (or properly encoded)

**Fix:**
```bash
# Test connection
mongosh "your-connection-string"

# If fails, recreate database user with simple password
```

### Build Fails

**Check:**
1. Node version (should be 18.x or 20.x)
2. All dependencies in package.json
3. No TypeScript errors

**Fix:**
```bash
# Test build locally
cd frontend
npm install
npm run build

cd backend
npm install
npm test
```

---

## Environment Variables Reference

### Backend (.env)

```env
NODE_ENV=production
PORT=5000
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/securepath
JWT_SECRET=your-32-char-secret-here
REFRESH_TOKEN_SECRET=your-32-char-secret-here
JWT_EXPIRE=15m
REFRESH_TOKEN_EXPIRE=7d
FRONTEND_URL=https://your-frontend.vercel.app
CORS_ORIGIN=https://your-frontend.vercel.app
SENTRY_DSN=https://xxx@sentry.io/xxx (optional)
```

### Frontend (.env.production)

```env
VITE_API_URL=https://your-backend-url
VITE_API_BASE_URL=https://your-backend-url
VITE_GOOGLE_MAPS_API_KEY=AIza...
VITE_SENTRY_DSN=https://xxx@sentry.io/xxx (optional)
VITE_ENV=production
```

---

## Custom Domain Setup (Optional)

### Add Domain to Vercel

```bash
1. Go to project settings
2. Click "Domains"
3. Add your domain
4. Update DNS records:
   - Type: A
   - Name: @
   - Value: 76.76.21.21
   
   OR
   
   - Type: CNAME
   - Name: www
   - Value: cname.vercel-dns.com
5. Wait for DNS propagation (24-48 hours)
```

---

## CI/CD Setup (Optional)

### GitHub Actions

Already configured! Just add secrets:

```bash
1. Go to GitHub repo settings
2. Secrets and variables → Actions
3. Add secrets:
   - VERCEL_TOKEN
   - VERCEL_ORG_ID
   - VERCEL_PROJECT_ID
   - MONGODB_URI
   - JWT_SECRET
   - REFRESH_TOKEN_SECRET
   - VITE_GOOGLE_MAPS_API_KEY
```

Now every push to `main` auto-deploys!

---

## Cost Estimate

### Free Tier (Good for MVP)

- **Vercel**: Free (Hobby plan)
- **MongoDB Atlas**: Free (M0 cluster)
- **Sentry**: Free (5k errors/month)
- **UptimeRobot**: Free (50 monitors)
- **Total**: $0/month

### Production Tier

- **Vercel Pro**: $20/month
- **MongoDB Atlas**: $9/month (M10 cluster)
- **Sentry Team**: $26/month
- **UptimeRobot Pro**: $7/month
- **Total**: ~$62/month

---

## Next Steps

1. ✅ **Test Thoroughly**
   - Create test accounts
   - Report test incidents
   - Verify all features

2. 📊 **Set Up Monitoring**
   - Sentry for errors
   - UptimeRobot for uptime
   - Vercel Analytics

3. 🔒 **Security Review**
   - Rotate secrets
   - Review permissions
   - Enable 2FA on accounts

4. 📖 **Documentation**
   - Update README with URLs
   - Document any issues
   - Create user guide

5. 🚀 **Launch**
   - Announce to users
   - Monitor closely
   - Gather feedback

---

## Support

**Need Help?**

- 📖 [Full Deployment Guide](./docs/DEPLOYMENT.md)
- 📖 [Vercel Deployment Guide](./docs/VERCEL_DEPLOYMENT.md)
- 📖 [Troubleshooting Guide](./docs/DEPLOYMENT.md#troubleshooting)
- 🐛 [Report Issue](https://github.com/KelvinDube514/community-safe-path/issues)

---

**🎉 You're Live!**

Your SecurePath application is now deployed and ready to help communities stay safe!

---

*Deployment time: ~30 minutes | Difficulty: Easy*
