# Vercel Deployment Guide

Complete guide for deploying SecurePath to Vercel for both frontend and backend.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Frontend Deployment](#frontend-deployment)
3. [Backend Deployment](#backend-deployment)
4. [Environment Variables](#environment-variables)
5. [Custom Domain Setup](#custom-domain-setup)
6. [CI/CD Integration](#cicd-integration)
7. [Monitoring and Analytics](#monitoring-and-analytics)
8. [Troubleshooting](#troubleshooting)

---

## Prerequisites

### Required Accounts
- ✅ Vercel account ([vercel.com](https://vercel.com))
- ✅ GitHub account (for repository connection)
- ✅ MongoDB Atlas account (database)
- ✅ Google Cloud account (Maps API)
- ✅ Sentry account (error tracking - optional)

### Required Tools
- Node.js 18.x or 20.x
- npm 8.x or higher
- Git
- Vercel CLI (optional but recommended)

### Install Vercel CLI

```bash
npm install -g vercel
```

---

## Frontend Deployment

### Option 1: Deploy via Vercel Dashboard (Recommended)

#### Step 1: Connect Repository

1. **Login to Vercel**
   - Go to [vercel.com](https://vercel.com)
   - Click "Sign Up" or "Login"
   - Connect with GitHub

2. **Import Project**
   - Click "Add New..." → "Project"
   - Select your GitHub repository
   - Click "Import"

3. **Configure Project**
   ```yaml
   Framework Preset: Vite
   Root Directory: frontend
   Build Command: npm run build
   Output Directory: dist
   Install Command: npm install
   ```

4. **Add Environment Variables**
   
   Click "Environment Variables" and add:
   
   ```env
   VITE_API_URL=https://your-backend.vercel.app
   VITE_API_BASE_URL=https://your-backend.vercel.app
   VITE_GOOGLE_MAPS_API_KEY=your-google-maps-api-key
   VITE_SENTRY_DSN=your-sentry-dsn (optional)
   ```

5. **Deploy**
   - Click "Deploy"
   - Wait for build to complete (2-5 minutes)
   - Your app will be live at `https://your-project.vercel.app`

### Option 2: Deploy via CLI

```bash
# Navigate to frontend directory
cd frontend

# Login to Vercel
vercel login

# Deploy to production
vercel --prod

# Follow the prompts:
# - Set up and deploy? Yes
# - Which scope? Your account
# - Link to existing project? No
# - Project name? securepath-frontend
# - Directory? ./
# - Override settings? No
```

### Option 3: Deploy via GitHub Integration

1. **Connect Repository**
   - Push code to GitHub
   - Vercel auto-detects new commits

2. **Configure in vercel.json**
   - Already configured in `frontend/vercel.json`
   - Automatic deployments on push

3. **Environment Variables**
   - Set in Vercel dashboard
   - Or use Vercel CLI:
   
   ```bash
   vercel env add VITE_API_URL production
   vercel env add VITE_GOOGLE_MAPS_API_KEY production
   ```

---

## Backend Deployment

### Option 1: Deploy via Vercel Dashboard

#### Step 1: Prepare Backend

1. **Update package.json**
   
   Ensure you have a build script (if needed):
   ```json
   {
     "scripts": {
       "start": "node src/server.js",
       "vercel-build": "echo 'No build step required'"
     }
   }
   ```

2. **Create/Verify vercel.json**
   - Already created at `backend/vercel.json`
   - Configures serverless functions

#### Step 2: Deploy

1. **Import Backend Project**
   - Click "Add New..." → "Project"
   - Select same repository
   - Click "Import"

2. **Configure Project**
   ```yaml
   Framework Preset: Other
   Root Directory: backend
   Build Command: npm install
   Output Directory: (leave empty)
   Install Command: npm install
   ```

3. **Add Environment Variables**
   
   ```env
   NODE_ENV=production
   PORT=5000
   MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/securepath
   JWT_SECRET=your-super-secret-jwt-key-min-32-characters
   REFRESH_TOKEN_SECRET=your-refresh-token-secret-min-32-characters
   JWT_EXPIRE=15m
   REFRESH_TOKEN_EXPIRE=7d
   FRONTEND_URL=https://your-frontend.vercel.app
   CORS_ORIGIN=https://your-frontend.vercel.app
   SENTRY_DSN=your-sentry-dsn (optional)
   ```

4. **Deploy**
   - Click "Deploy"
   - Backend will be available at `https://your-backend.vercel.app`

### Option 2: Deploy via CLI

```bash
# Navigate to backend directory
cd backend

# Deploy to production
vercel --prod

# Set environment variables
vercel env add MONGODB_URI production
vercel env add JWT_SECRET production
vercel env add REFRESH_TOKEN_SECRET production
vercel env add FRONTEND_URL production
vercel env add CORS_ORIGIN production

# Redeploy with environment variables
vercel --prod
```

### Important Backend Considerations

⚠️ **Vercel Serverless Limitations:**

1. **Function Timeout**: 10 seconds (Hobby), 60 seconds (Pro)
2. **Cold Starts**: First request may be slower
3. **WebSocket Support**: Limited (consider separate WebSocket server)
4. **File System**: Read-only (use cloud storage for uploads)

**Recommended for Production:**
- Use Vercel for frontend
- Use Render/Railway for backend (better for long-running processes)
- Or upgrade to Vercel Pro for better backend support

---

## Environment Variables

### Frontend Environment Variables

| Variable | Description | Required | Example |
|----------|-------------|----------|---------|
| `VITE_API_URL` | Backend API URL | Yes | `https://api.securepath.com` |
| `VITE_API_BASE_URL` | Backend base URL | Yes | `https://api.securepath.com` |
| `VITE_GOOGLE_MAPS_API_KEY` | Google Maps API key | Yes | `AIza...` |
| `VITE_SENTRY_DSN` | Sentry error tracking | No | `https://...@sentry.io/...` |
| `VITE_ENV` | Environment name | No | `production` |

### Backend Environment Variables

| Variable | Description | Required | Example |
|----------|-------------|----------|---------|
| `NODE_ENV` | Node environment | Yes | `production` |
| `PORT` | Server port | Yes | `5000` |
| `MONGODB_URI` | MongoDB connection string | Yes | `mongodb+srv://...` |
| `JWT_SECRET` | JWT signing secret | Yes | `your-secret-min-32-chars` |
| `REFRESH_TOKEN_SECRET` | Refresh token secret | Yes | `your-secret-min-32-chars` |
| `JWT_EXPIRE` | JWT expiration time | Yes | `15m` |
| `REFRESH_TOKEN_EXPIRE` | Refresh token expiry | Yes | `7d` |
| `FRONTEND_URL` | Frontend URL | Yes | `https://securepath.com` |
| `CORS_ORIGIN` | CORS allowed origin | Yes | `https://securepath.com` |
| `SENTRY_DSN` | Sentry error tracking | No | `https://...@sentry.io/...` |

### Setting Environment Variables

#### Via Vercel Dashboard

1. Go to project settings
2. Click "Environment Variables"
3. Add each variable
4. Select environment (Production, Preview, Development)
5. Click "Save"

#### Via Vercel CLI

```bash
# Add single variable
vercel env add VARIABLE_NAME production

# Add from .env file
vercel env pull .env.production

# List all variables
vercel env ls
```

#### Via GitHub Secrets (for CI/CD)

1. Go to repository settings
2. Click "Secrets and variables" → "Actions"
3. Add secrets with `VERCEL_` prefix
4. Use in GitHub Actions workflow

---

## Custom Domain Setup

### Step 1: Add Domain to Vercel

1. **Go to Project Settings**
   - Select your project
   - Click "Domains"

2. **Add Domain**
   - Click "Add"
   - Enter your domain: `securepath.com`
   - Click "Add"

3. **Configure DNS**
   
   Vercel provides DNS records to add:
   
   **For Root Domain (securepath.com):**
   ```
   Type: A
   Name: @
   Value: 76.76.21.21
   ```
   
   **For Subdomain (www.securepath.com):**
   ```
   Type: CNAME
   Name: www
   Value: cname.vercel-dns.com
   ```

4. **Wait for Verification**
   - DNS propagation takes 24-48 hours
   - Vercel auto-verifies and issues SSL certificate

### Step 2: Configure Multiple Domains

**Frontend:**
- `securepath.com` (primary)
- `www.securepath.com` (redirect to primary)

**Backend:**
- `api.securepath.com`

### Step 3: Update Environment Variables

After domain setup, update:

```env
# Frontend
VITE_API_URL=https://api.securepath.com

# Backend
FRONTEND_URL=https://securepath.com
CORS_ORIGIN=https://securepath.com
```

---

## CI/CD Integration

### GitHub Actions Integration

The project already has GitHub Actions configured. Enhance for Vercel:

#### Update `.github/workflows/deploy.yml`

```yaml
- name: Deploy Frontend to Vercel
  uses: amondnet/vercel-action@v25
  with:
    vercel-token: ${{ secrets.VERCEL_TOKEN }}
    vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
    vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
    working-directory: ./frontend
    vercel-args: '--prod'
```

### Required GitHub Secrets

Add these to repository secrets:

```
VERCEL_TOKEN=your-vercel-token
VERCEL_ORG_ID=your-org-id
VERCEL_PROJECT_ID=your-project-id
```

### Get Vercel Credentials

```bash
# Get token
vercel login
# Go to https://vercel.com/account/tokens

# Get org and project IDs
vercel link
# IDs are in .vercel/project.json
```

### Automatic Deployments

Vercel automatically deploys:
- **Production**: Pushes to `main` branch
- **Preview**: Pull requests
- **Development**: Pushes to other branches

---

## Monitoring and Analytics

### Vercel Analytics

1. **Enable Analytics**
   - Go to project settings
   - Click "Analytics"
   - Click "Enable"

2. **View Metrics**
   - Page views
   - Unique visitors
   - Top pages
   - Performance metrics

### Vercel Speed Insights

1. **Install Package**
   ```bash
   npm install @vercel/speed-insights
   ```

2. **Add to App**
   ```typescript
   // src/main.tsx
   import { SpeedInsights } from '@vercel/speed-insights/react';
   
   <App>
     <SpeedInsights />
   </App>
   ```

### Sentry Integration

Already configured in the project:

1. **Create Sentry Projects**
   - Frontend project (React)
   - Backend project (Node.js)

2. **Add DSN to Environment Variables**
   ```env
   VITE_SENTRY_DSN=your-frontend-dsn
   SENTRY_DSN=your-backend-dsn
   ```

3. **Monitor Errors**
   - Real-time error tracking
   - Performance monitoring
   - Release tracking

### Vercel Logs

View logs in real-time:

```bash
# Via CLI
vercel logs your-deployment-url

# Via Dashboard
# Go to Deployments → Select deployment → View logs
```

---

## Troubleshooting

### Common Issues

#### 1. Build Fails

**Problem**: Build fails with dependency errors

**Solution**:
```bash
# Clear cache and rebuild
rm -rf node_modules package-lock.json
npm install
npm run build

# Check Node version
node --version  # Should be 18.x or 20.x
```

#### 2. Environment Variables Not Working

**Problem**: Variables not accessible in app

**Solution**:
- Ensure variables start with `VITE_` for frontend
- Redeploy after adding variables
- Check variable scope (Production/Preview/Development)

#### 3. CORS Errors

**Problem**: Frontend can't connect to backend

**Solution**:
```javascript
// backend/src/app.js
app.use(cors({
  origin: process.env.FRONTEND_URL,
  credentials: true
}));
```

Update environment variables:
```env
FRONTEND_URL=https://your-frontend.vercel.app
CORS_ORIGIN=https://your-frontend.vercel.app
```

#### 4. Function Timeout

**Problem**: Backend functions timeout

**Solution**:
- Optimize database queries
- Add indexes to MongoDB
- Upgrade to Vercel Pro (60s timeout)
- Or move backend to Render/Railway

#### 5. WebSocket Connection Fails

**Problem**: Real-time features don't work

**Solution**:
- Vercel has limited WebSocket support
- Deploy backend to Render/Railway for WebSocket
- Or use Vercel Pro with WebSocket support

### Rollback Deployment

#### Via Dashboard

1. Go to "Deployments"
2. Find previous successful deployment
3. Click "..." → "Promote to Production"

#### Via CLI

```bash
# List deployments
vercel ls

# Promote specific deployment
vercel promote <deployment-url>
```

---

## Performance Optimization

### Frontend Optimization

1. **Enable Compression**
   - Automatic in Vercel
   - Gzip and Brotli compression

2. **Image Optimization**
   ```typescript
   import { Image } from '@vercel/image';
   
   <Image
     src="/image.jpg"
     width={500}
     height={300}
     alt="Description"
   />
   ```

3. **Edge Functions**
   - Use for API routes
   - Faster response times
   - Global distribution

### Backend Optimization

1. **Database Connection Pooling**
   ```javascript
   mongoose.connect(process.env.MONGODB_URI, {
     maxPoolSize: 10,
     serverSelectionTimeoutMS: 5000
   });
   ```

2. **Caching**
   - Use Vercel Edge Cache
   - Add cache headers
   ```javascript
   res.set('Cache-Control', 'public, max-age=300');
   ```

---

## Cost Optimization

### Vercel Pricing Tiers

**Hobby (Free)**:
- Unlimited deployments
- 100 GB bandwidth/month
- Serverless function execution: 100 GB-hours
- Good for development and small projects

**Pro ($20/month)**:
- Everything in Hobby
- Unlimited bandwidth
- Advanced analytics
- Password protection
- 1000 GB-hours function execution

**Enterprise (Custom)**:
- Everything in Pro
- Custom limits
- SLA guarantees
- Priority support

### Tips to Stay Within Free Tier

1. **Optimize Images**: Reduce bandwidth usage
2. **Use CDN Caching**: Reduce function executions
3. **Efficient Code**: Minimize function runtime
4. **Monitor Usage**: Check dashboard regularly

---

## Security Best Practices

### 1. Environment Variables

- ✅ Never commit secrets to Git
- ✅ Use Vercel environment variables
- ✅ Rotate secrets regularly
- ✅ Use different secrets for each environment

### 2. HTTPS

- ✅ Automatic SSL certificates
- ✅ Force HTTPS redirects
- ✅ HSTS headers enabled

### 3. Security Headers

Already configured in `vercel.json`:
- X-Content-Type-Options
- X-Frame-Options
- X-XSS-Protection
- Referrer-Policy
- Permissions-Policy

### 4. DDoS Protection

- ✅ Automatic DDoS protection
- ✅ Rate limiting (implement in backend)
- ✅ Edge network distribution

---

## Maintenance

### Regular Tasks

**Weekly:**
- Check deployment logs
- Monitor error rates in Sentry
- Review analytics

**Monthly:**
- Update dependencies
- Review and rotate secrets
- Check bandwidth usage
- Optimize performance

### Backup Strategy

**Code:**
- Git repository (GitHub)
- Vercel deployment history

**Database:**
- MongoDB Atlas automatic backups
- Manual exports weekly

---

## Additional Resources

- [Vercel Documentation](https://vercel.com/docs)
- [Vercel CLI Reference](https://vercel.com/docs/cli)
- [Vercel GitHub Integration](https://vercel.com/docs/git)
- [Vercel Environment Variables](https://vercel.com/docs/environment-variables)
- [Vercel Edge Functions](https://vercel.com/docs/functions/edge-functions)

---

## Support

**Vercel Support:**
- Documentation: [vercel.com/docs](https://vercel.com/docs)
- Community: [github.com/vercel/vercel/discussions](https://github.com/vercel/vercel/discussions)
- Email: support@vercel.com (Pro/Enterprise)

**Project Support:**
- GitHub Issues: [Report Issue](https://github.com/KelvinDube514/community-safe-path/issues)
- Email: support@communitysafepath.com

---

**Happy Deploying! 🚀**

*Last Updated: October 2025*
