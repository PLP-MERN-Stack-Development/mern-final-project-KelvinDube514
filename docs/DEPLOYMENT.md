# Deployment Guide

This guide provides comprehensive instructions for deploying the Community Safe Path application to production.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Environment Variables](#environment-variables)
3. [Backend Deployment](#backend-deployment)
4. [Frontend Deployment](#frontend-deployment)
5. [Database Setup](#database-setup)
6. [CI/CD Pipeline](#cicd-pipeline)
7. [Monitoring and Logging](#monitoring-and-logging)
8. [Troubleshooting](#troubleshooting)

---

## Prerequisites

### Required Accounts
- [ ] GitHub account (for CI/CD)
- [ ] MongoDB Atlas account (database)
- [ ] Render/Railway/Heroku account (backend hosting)
- [ ] Netlify/Vercel account (frontend hosting)
- [ ] Sentry account (error tracking)
- [ ] Google Cloud account (Maps API)

### Required Tools
- Node.js 18.x or 20.x
- npm 8.x or higher
- Docker (optional)
- Git

---

## Environment Variables

### Backend Environment Variables

Create `.env` file in `backend/` directory:

```env
# Server Configuration
NODE_ENV=production
PORT=5000
FRONTEND_URL=https://your-app.netlify.app

# Database
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/securepath?retryWrites=true&w=majority

# Authentication
JWT_SECRET=your-super-secret-jwt-key-min-32-characters
REFRESH_TOKEN_SECRET=your-refresh-token-secret-min-32-characters
JWT_EXPIRE=15m
REFRESH_TOKEN_EXPIRE=7d

# CORS
CORS_ORIGIN=https://your-app.netlify.app

# Email (Optional - SendGrid/Mailgun)
EMAIL_SERVICE=sendgrid
EMAIL_API_KEY=your-email-api-key
EMAIL_FROM=noreply@communitysafepath.com

# SMS (Optional - Twilio)
TWILIO_ACCOUNT_SID=your-twilio-sid
TWILIO_AUTH_TOKEN=your-twilio-token
TWILIO_PHONE_NUMBER=+1234567890

# Error Tracking
SENTRY_DSN=https://your-sentry-dsn@sentry.io/project-id

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# File Upload
MAX_FILE_SIZE=5242880
ALLOWED_FILE_TYPES=image/jpeg,image/png,image/gif,video/mp4
```

### Frontend Environment Variables

Create `.env.production` file in `frontend/` directory:

```env
# API Configuration
VITE_API_URL=https://your-backend.onrender.com
VITE_API_BASE_URL=https://your-backend.onrender.com

# Google Maps
VITE_GOOGLE_MAPS_API_KEY=your-google-maps-api-key

# Error Tracking
VITE_SENTRY_DSN=https://your-sentry-dsn@sentry.io/project-id
VITE_SENTRY_ORG=your-org
VITE_SENTRY_PROJECT=your-project

# Environment
VITE_ENV=production

# Feature Flags (Optional)
VITE_ENABLE_ANALYTICS=true
VITE_ENABLE_NOTIFICATIONS=true
```

---

## Backend Deployment

### Option 1: Deploy to Render

1. **Create Account**
   - Sign up at [render.com](https://render.com)

2. **Create New Web Service**
   - Click "New +" → "Web Service"
   - Connect GitHub repository
   - Select `backend` directory

3. **Configure Service**
   ```yaml
   Name: community-safe-path-backend
   Environment: Node
   Build Command: npm install
   Start Command: npm start
   Plan: Free (or paid for production)
   ```

4. **Add Environment Variables**
   - Go to "Environment" tab
   - Add all backend environment variables

5. **Deploy**
   - Click "Create Web Service"
   - Wait for deployment to complete
   - Note the service URL

### Option 2: Deploy to Railway

1. **Create Account**
   - Sign up at [railway.app](https://railway.app)

2. **Create New Project**
   - Click "New Project"
   - Select "Deploy from GitHub repo"
   - Choose your repository

3. **Configure Service**
   - Select `backend` directory
   - Railway auto-detects Node.js

4. **Add Environment Variables**
   - Go to "Variables" tab
   - Add all backend environment variables

5. **Deploy**
   - Railway automatically deploys
   - Get the public URL from settings

### Option 3: Deploy to Heroku

1. **Install Heroku CLI**
   ```bash
   npm install -g heroku
   ```

2. **Login and Create App**
   ```bash
   heroku login
   heroku create community-safe-path-backend
   ```

3. **Set Environment Variables**
   ```bash
   heroku config:set NODE_ENV=production
   heroku config:set MONGODB_URI=your-mongodb-uri
   heroku config:set JWT_SECRET=your-jwt-secret
   # ... add all other variables
   ```

4. **Deploy**
   ```bash
   cd backend
   git subtree push --prefix backend heroku main
   ```

### Option 4: Deploy with Docker

1. **Build Image**
   ```bash
   cd backend
   docker build -t community-safe-path-backend .
   ```

2. **Run Container**
   ```bash
   docker run -d \
     -p 5000:5000 \
     --env-file .env \
     --name backend \
     community-safe-path-backend
   ```

3. **Push to Registry**
   ```bash
   docker tag community-safe-path-backend:latest your-registry/community-safe-path-backend:latest
   docker push your-registry/community-safe-path-backend:latest
   ```

---

## Frontend Deployment

### Option 1: Deploy to Netlify

1. **Create Account**
   - Sign up at [netlify.com](https://netlify.com)

2. **Connect Repository**
   - Click "Add new site" → "Import an existing project"
   - Connect GitHub
   - Select repository

3. **Configure Build Settings**
   ```yaml
   Base directory: frontend
   Build command: npm run build
   Publish directory: frontend/dist
   ```

4. **Add Environment Variables**
   - Go to "Site settings" → "Environment variables"
   - Add all frontend environment variables

5. **Deploy**
   - Click "Deploy site"
   - Wait for build to complete
   - Get the site URL

6. **Configure Custom Domain** (Optional)
   - Go to "Domain settings"
   - Add custom domain
   - Configure DNS

### Option 2: Deploy to Vercel

1. **Install Vercel CLI**
   ```bash
   npm install -g vercel
   ```

2. **Login**
   ```bash
   vercel login
   ```

3. **Deploy**
   ```bash
   cd frontend
   vercel --prod
   ```

4. **Configure Environment Variables**
   ```bash
   vercel env add VITE_API_URL production
   vercel env add VITE_GOOGLE_MAPS_API_KEY production
   # ... add all other variables
   ```

5. **Redeploy with Environment Variables**
   ```bash
   vercel --prod
   ```

### Option 3: Deploy to GitHub Pages

1. **Install gh-pages**
   ```bash
   cd frontend
   npm install --save-dev gh-pages
   ```

2. **Add Deploy Script**
   ```json
   {
     "scripts": {
       "predeploy": "npm run build",
       "deploy": "gh-pages -d dist"
     }
   }
   ```

3. **Deploy**
   ```bash
   npm run deploy
   ```

4. **Configure GitHub Pages**
   - Go to repository settings
   - Enable GitHub Pages
   - Select `gh-pages` branch

---

## Database Setup

### MongoDB Atlas Setup

1. **Create Account**
   - Sign up at [mongodb.com/cloud/atlas](https://www.mongodb.com/cloud/atlas)

2. **Create Cluster**
   - Click "Build a Database"
   - Choose "Shared" (Free tier)
   - Select region closest to your backend
   - Click "Create Cluster"

3. **Configure Security**
   - **Database Access**:
     - Create database user
     - Set username and password
     - Grant read/write permissions
   
   - **Network Access**:
     - Add IP address: `0.0.0.0/0` (allow from anywhere)
     - Or add specific IPs for better security

4. **Get Connection String**
   - Click "Connect"
   - Choose "Connect your application"
   - Copy connection string
   - Replace `<password>` with your password
   - Replace `<dbname>` with `securepath`

5. **Test Connection**
   ```bash
   # In backend directory
   MONGODB_URI=your-connection-string npm start
   ```

### Database Indexes

Create indexes for better performance:

```javascript
// Connect to MongoDB and run:
db.incidents.createIndex({ location: "2dsphere" });
db.incidents.createIndex({ createdAt: -1 });
db.incidents.createIndex({ status: 1 });
db.incidents.createIndex({ type: 1 });

db.alerts.createIndex({ location: "2dsphere" });
db.alerts.createIndex({ isActive: 1, expiresAt: 1 });
db.alerts.createIndex({ createdAt: -1 });

db.users.createIndex({ email: 1 }, { unique: true });
db.users.createIndex({ location: "2dsphere" });
```

---

## CI/CD Pipeline

### GitHub Actions Setup

The CI/CD pipeline is already configured in `.github/workflows/`:

1. **test.yml** - Runs on every push/PR
   - Backend tests
   - Frontend tests
   - E2E tests
   - Accessibility tests
   - Security scans

2. **deploy.yml** - Runs on push to main
   - Runs all tests
   - Deploys backend
   - Deploys frontend
   - Sends notifications

### Required GitHub Secrets

Add these secrets in GitHub repository settings:

```
# Docker (if using container registry)
DOCKER_REGISTRY=docker.io
DOCKER_USERNAME=your-username
DOCKER_PASSWORD=your-password

# Backend Deployment
BACKEND_DEPLOY_HOOK=your-render-deploy-hook-url
BACKEND_URL=https://your-backend.onrender.com

# Frontend Deployment (Netlify)
NETLIFY_AUTH_TOKEN=your-netlify-token
NETLIFY_SITE_ID=your-site-id

# Frontend Deployment (Vercel - Alternative)
VERCEL_TOKEN=your-vercel-token
VERCEL_ORG_ID=your-org-id
VERCEL_PROJECT_ID=your-project-id

# Environment Variables
VITE_API_URL=https://your-backend.onrender.com
VITE_GOOGLE_MAPS_API_KEY=your-api-key
VITE_SENTRY_DSN=your-sentry-dsn
FRONTEND_URL=https://your-app.netlify.app

# Notifications (Optional)
SLACK_WEBHOOK_URL=your-slack-webhook
```

### Manual Deployment

Trigger manual deployment:

1. Go to GitHub repository
2. Click "Actions" tab
3. Select "Deploy to Production"
4. Click "Run workflow"
5. Select branch and click "Run workflow"

---

## Monitoring and Logging

### Sentry Setup (Error Tracking)

1. **Create Account**
   - Sign up at [sentry.io](https://sentry.io)

2. **Create Projects**
   - Create project for backend (Node.js)
   - Create project for frontend (React)

3. **Get DSN**
   - Copy DSN from project settings
   - Add to environment variables

4. **Configure Alerts**
   - Set up email/Slack notifications
   - Configure error thresholds

### Application Monitoring

#### Backend Health Check

Create health endpoint (already exists):

```javascript
// backend/src/routes/health.js
router.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV
  });
});
```

#### Uptime Monitoring

Use services like:
- [UptimeRobot](https://uptimerobot.com) - Free
- [Pingdom](https://www.pingdom.com)
- [StatusCake](https://www.statuscake.com)

Configure to check:
- Backend: `https://your-backend.com/api/health`
- Frontend: `https://your-frontend.com`

### Logging

#### Backend Logging

Winston is already configured. Logs include:
- HTTP requests
- Errors
- Database operations
- Authentication events

View logs:
```bash
# Render
render logs -t your-service-id

# Railway
railway logs

# Heroku
heroku logs --tail
```

#### Frontend Logging

Console logs are captured by Sentry in production.

---

## Troubleshooting

### Common Issues

#### Backend Won't Start

**Check:**
1. Environment variables are set correctly
2. MongoDB connection string is valid
3. Port is not already in use
4. Dependencies are installed

**Solution:**
```bash
# Check logs
npm start

# Test MongoDB connection
node -e "require('mongoose').connect(process.env.MONGODB_URI).then(() => console.log('Connected')).catch(err => console.error(err))"
```

#### Frontend Build Fails

**Check:**
1. All environment variables are set
2. API URL is correct
3. Node version matches (18.x or 20.x)

**Solution:**
```bash
# Clear cache and rebuild
rm -rf node_modules dist
npm install
npm run build
```

#### CORS Errors

**Check:**
1. Backend `CORS_ORIGIN` matches frontend URL
2. Frontend `VITE_API_URL` is correct

**Solution:**
```javascript
// backend/src/app.js
app.use(cors({
  origin: process.env.FRONTEND_URL,
  credentials: true
}));
```

#### Database Connection Fails

**Check:**
1. MongoDB Atlas IP whitelist
2. Database user permissions
3. Connection string format

**Solution:**
```bash
# Test connection
mongosh "your-connection-string"
```

### Rollback Deployment

#### Render/Railway
1. Go to deployments
2. Select previous successful deployment
3. Click "Redeploy"

#### Netlify/Vercel
1. Go to deployments
2. Find previous deployment
3. Click "Publish deploy"

#### GitHub Actions
1. Revert commit
2. Push to main
3. Automatic redeployment

---

## Post-Deployment Checklist

- [ ] Backend is accessible at production URL
- [ ] Frontend is accessible at production URL
- [ ] Database connection is working
- [ ] Authentication works (login/register)
- [ ] API endpoints respond correctly
- [ ] Google Maps loads properly
- [ ] Real-time features work (WebSocket)
- [ ] Error tracking is configured
- [ ] Monitoring is set up
- [ ] SSL certificates are valid
- [ ] Custom domain is configured (if applicable)
- [ ] CI/CD pipeline is working
- [ ] Backups are configured
- [ ] Documentation is updated

---

## Security Checklist

- [ ] All secrets are in environment variables (not in code)
- [ ] HTTPS is enabled
- [ ] CORS is properly configured
- [ ] Rate limiting is enabled
- [ ] Input validation is working
- [ ] SQL injection protection (using Mongoose)
- [ ] XSS protection (React escapes by default)
- [ ] CSRF protection is enabled
- [ ] Security headers are set (Helmet.js)
- [ ] Dependencies are up to date
- [ ] Security scans pass

---

## Maintenance

### Regular Tasks

**Daily:**
- Monitor error rates in Sentry
- Check uptime monitoring

**Weekly:**
- Review application logs
- Check database performance
- Update dependencies

**Monthly:**
- Security audit
- Performance optimization
- Backup verification

### Backup Strategy

**Database:**
- MongoDB Atlas automatic backups (enabled by default)
- Manual backup: `mongodump --uri="your-connection-string"`

**Code:**
- Git repository (GitHub)
- Tagged releases

---

## Support

For deployment issues:
- Check logs first
- Review this documentation
- Check platform-specific docs (Render, Netlify, etc.)
- Open GitHub issue
- Contact development team

---

## Additional Resources

- [Render Documentation](https://render.com/docs)
- [Netlify Documentation](https://docs.netlify.com)
- [MongoDB Atlas Documentation](https://docs.atlas.mongodb.com)
- [Sentry Documentation](https://docs.sentry.io)
- [Docker Documentation](https://docs.docker.com)
