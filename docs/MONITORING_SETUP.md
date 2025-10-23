# Monitoring and Error Tracking Setup

Comprehensive guide for setting up monitoring, error tracking, and observability for SecurePath.

## Table of Contents

1. [Overview](#overview)
2. [Sentry Setup](#sentry-setup)
3. [Application Performance Monitoring](#application-performance-monitoring)
4. [Logging Strategy](#logging-strategy)
5. [Uptime Monitoring](#uptime-monitoring)
6. [Analytics](#analytics)
7. [Alerts and Notifications](#alerts-and-notifications)
8. [Dashboard Setup](#dashboard-setup)

---

## Overview

### Monitoring Stack

```
┌─────────────────────────────────────────────────────────┐
│                    Monitoring Stack                      │
├─────────────────────────────────────────────────────────┤
│  Error Tracking        │  Sentry                         │
│  Performance           │  Sentry Performance             │
│  Uptime                │  UptimeRobot / Pingdom          │
│  Analytics             │  Vercel Analytics / Google      │
│  Logging               │  Winston + Cloud Logging        │
│  Real-time Monitoring  │  Custom Dashboard               │
└─────────────────────────────────────────────────────────┘
```

---

## Sentry Setup

### 1. Create Sentry Account

1. Go to [sentry.io](https://sentry.io)
2. Sign up for free account
3. Create organization

### 2. Create Projects

#### Frontend Project

1. **Create Project**
   - Click "Create Project"
   - Platform: React
   - Name: `securepath-frontend`
   - Click "Create Project"

2. **Get DSN**
   - Copy the DSN from project settings
   - Format: `https://[key]@sentry.io/[project-id]`

#### Backend Project

1. **Create Project**
   - Click "Create Project"
   - Platform: Node.js
   - Name: `securepath-backend`
   - Click "Create Project"

2. **Get DSN**
   - Copy the DSN from project settings

### 3. Configure Frontend

The frontend is already configured with Sentry. Verify configuration:

```typescript
// frontend/src/main.tsx
import * as Sentry from "@sentry/react";

Sentry.init({
  dsn: import.meta.env.VITE_SENTRY_DSN,
  environment: import.meta.env.MODE,
  integrations: [
    new Sentry.BrowserTracing({
      tracePropagationTargets: [
        "localhost",
        /^https:\/\/yourbackend\.com\/api/
      ],
    }),
    new Sentry.Replay({
      maskAllText: false,
      blockAllMedia: false,
    }),
  ],
  tracesSampleRate: 1.0,
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1.0,
});
```

### 4. Configure Backend

The backend is already configured. Verify:

```javascript
// backend/src/config/sentry.js
const Sentry = require('@sentry/node');

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 1.0,
  integrations: [
    new Sentry.Integrations.Http({ tracing: true }),
    new Sentry.Integrations.Express({ app }),
    new Sentry.Integrations.Mongo({
      useMongoose: true
    }),
  ],
});
```

### 5. Add Environment Variables

```env
# Frontend (.env.production)
VITE_SENTRY_DSN=https://[key]@sentry.io/[frontend-project-id]

# Backend (.env)
SENTRY_DSN=https://[key]@sentry.io/[backend-project-id]
```

### 6. Test Error Tracking

#### Frontend Test

```typescript
// Trigger test error
throw new Error("Test error from frontend");

// Or use Sentry test
Sentry.captureException(new Error("Test error"));
```

#### Backend Test

```javascript
// Trigger test error
app.get('/test-error', (req, res) => {
  throw new Error("Test error from backend");
});
```

### 7. Configure Alerts

1. **Go to Project Settings**
   - Click "Alerts"
   - Click "Create Alert Rule"

2. **Set Up Alert Rules**
   
   **High Error Rate Alert:**
   ```yaml
   Condition: Error count > 10 in 1 minute
   Action: Send email + Slack notification
   ```
   
   **New Issue Alert:**
   ```yaml
   Condition: First seen error
   Action: Send email notification
   ```
   
   **Performance Alert:**
   ```yaml
   Condition: Transaction duration > 3s
   Action: Send Slack notification
   ```

### 8. Integrate with Slack

1. **Install Sentry Slack App**
   - Go to Sentry Settings → Integrations
   - Find Slack
   - Click "Install"

2. **Configure Notifications**
   - Select Slack channel
   - Choose notification types
   - Save configuration

---

## Application Performance Monitoring

### 1. Frontend Performance

#### Sentry Performance Monitoring

Already configured in the frontend:

```typescript
// Automatic transaction tracking
Sentry.BrowserTracing({
  routingInstrumentation: Sentry.reactRouterV6Instrumentation(
    useEffect,
    useLocation,
    useNavigationType,
    createRoutesFromChildren,
    matchRoutes
  ),
});
```

#### Custom Performance Tracking

```typescript
// Track custom operations
const transaction = Sentry.startTransaction({
  name: "Load Incidents",
  op: "api.request"
});

try {
  const incidents = await fetchIncidents();
  transaction.setStatus("ok");
} catch (error) {
  transaction.setStatus("error");
  throw error;
} finally {
  transaction.finish();
}
```

#### Web Vitals Tracking

```typescript
// frontend/src/lib/webVitals.ts
import { getCLS, getFID, getFCP, getLCP, getTTFB } from 'web-vitals';

function sendToAnalytics(metric) {
  // Send to Sentry
  Sentry.captureMessage(`Web Vital: ${metric.name}`, {
    level: 'info',
    extra: {
      value: metric.value,
      rating: metric.rating
    }
  });
}

getCLS(sendToAnalytics);
getFID(sendToAnalytics);
getFCP(sendToAnalytics);
getLCP(sendToAnalytics);
getTTFB(sendToAnalytics);
```

### 2. Backend Performance

#### Transaction Tracking

```javascript
// Track API endpoint performance
app.get('/api/incidents', async (req, res) => {
  const transaction = Sentry.startTransaction({
    op: "http.server",
    name: "GET /api/incidents"
  });

  try {
    const incidents = await Incident.find();
    res.json(incidents);
    transaction.setStatus("ok");
  } catch (error) {
    transaction.setStatus("error");
    throw error;
  } finally {
    transaction.finish();
  }
});
```

#### Database Query Monitoring

```javascript
// Monitor slow queries
mongoose.set('debug', (collectionName, method, query, doc) => {
  const start = Date.now();
  
  // Log slow queries (> 100ms)
  const duration = Date.now() - start;
  if (duration > 100) {
    Sentry.captureMessage('Slow database query', {
      level: 'warning',
      extra: {
        collection: collectionName,
        method: method,
        duration: duration,
        query: query
      }
    });
  }
});
```

---

## Logging Strategy

### 1. Backend Logging (Winston)

Already configured. Verify setup:

```javascript
// backend/src/config/logger.js
const winston = require('winston');

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({ 
      filename: 'logs/error.log', 
      level: 'error' 
    }),
    new winston.transports.File({ 
      filename: 'logs/combined.log' 
    }),
  ],
});

if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.simple()
  }));
}
```

### 2. Log Levels

```javascript
// Error - Critical errors
logger.error('Database connection failed', { error: err });

// Warn - Warning messages
logger.warn('High memory usage detected', { usage: memoryUsage });

// Info - General information
logger.info('User logged in', { userId: user.id });

// HTTP - HTTP requests
logger.http('GET /api/incidents', { 
  method: req.method,
  url: req.url,
  status: res.statusCode 
});

// Debug - Debug information
logger.debug('Cache hit', { key: cacheKey });
```

### 3. Structured Logging

```javascript
// Always include context
logger.info('Incident created', {
  incidentId: incident._id,
  userId: user._id,
  type: incident.type,
  severity: incident.severity,
  timestamp: new Date().toISOString()
});
```

### 4. Cloud Logging (Production)

#### Option 1: Logtail

```bash
npm install @logtail/node @logtail/winston
```

```javascript
const { Logtail } = require("@logtail/node");
const { LogtailTransport } = require("@logtail/winston");

const logtail = new Logtail(process.env.LOGTAIL_TOKEN);

logger.add(new LogtailTransport(logtail));
```

#### Option 2: Papertrail

```bash
npm install winston-papertrail
```

```javascript
const winston = require('winston');
require('winston-papertrail').Papertrail;

logger.add(new winston.transports.Papertrail({
  host: 'logs.papertrailapp.com',
  port: 12345
}));
```

---

## Uptime Monitoring

### 1. UptimeRobot Setup (Free)

1. **Create Account**
   - Go to [uptimerobot.com](https://uptimerobot.com)
   - Sign up for free account

2. **Add Monitors**
   
   **Frontend Monitor:**
   ```yaml
   Monitor Type: HTTP(s)
   Friendly Name: SecurePath Frontend
   URL: https://your-frontend.vercel.app
   Monitoring Interval: 5 minutes
   ```
   
   **Backend Health Check:**
   ```yaml
   Monitor Type: HTTP(s)
   Friendly Name: SecurePath Backend Health
   URL: https://your-backend.vercel.app/health
   Monitoring Interval: 5 minutes
   Keyword: "healthy"
   ```
   
   **API Endpoint:**
   ```yaml
   Monitor Type: HTTP(s)
   Friendly Name: SecurePath API
   URL: https://your-backend.vercel.app/api/incidents
   Monitoring Interval: 5 minutes
   ```

3. **Configure Alerts**
   - Email notifications
   - SMS notifications (paid)
   - Webhook notifications
   - Slack integration

4. **Create Status Page**
   - Public status page
   - Share with users
   - Custom domain support

### 2. Pingdom Setup (Paid Alternative)

1. **Create Account**
   - Go to [pingdom.com](https://www.pingdom.com)
   - Start free trial

2. **Add Checks**
   - Similar to UptimeRobot
   - More detailed monitoring
   - Transaction monitoring
   - Real user monitoring

---

## Analytics

### 1. Vercel Analytics

Already enabled if using Vercel:

```typescript
// frontend/src/main.tsx
import { Analytics } from '@vercel/analytics/react';

<App>
  <Analytics />
</App>
```

**Metrics Tracked:**
- Page views
- Unique visitors
- Top pages
- Referrers
- Devices
- Locations

### 2. Google Analytics (Optional)

```bash
npm install react-ga4
```

```typescript
// frontend/src/lib/analytics.ts
import ReactGA from 'react-ga4';

export const initGA = () => {
  ReactGA.initialize('G-XXXXXXXXXX');
};

export const logPageView = () => {
  ReactGA.send({ hitType: "pageview", page: window.location.pathname });
};

export const logEvent = (category: string, action: string) => {
  ReactGA.event({
    category: category,
    action: action
  });
};
```

### 3. Custom Analytics Dashboard

Create custom analytics endpoint:

```javascript
// backend/src/routes/analytics.js
router.get('/analytics/summary', auth, async (req, res) => {
  const analytics = {
    totalIncidents: await Incident.countDocuments(),
    activeIncidents: await Incident.countDocuments({ status: 'active' }),
    totalUsers: await User.countDocuments(),
    incidentsByType: await Incident.aggregate([
      { $group: { _id: '$type', count: { $sum: 1 } } }
    ]),
    incidentsBySeverity: await Incident.aggregate([
      { $group: { _id: '$severity', count: { $sum: 1 } } }
    ]),
    recentActivity: await Incident.find()
      .sort({ createdAt: -1 })
      .limit(10)
  };
  
  res.json(analytics);
});
```

---

## Alerts and Notifications

### 1. Slack Integration

#### Create Slack Webhook

1. Go to [api.slack.com/apps](https://api.slack.com/apps)
2. Create new app
3. Enable Incoming Webhooks
4. Add webhook to workspace
5. Copy webhook URL

#### Send Alerts to Slack

```javascript
// backend/src/utils/slack.js
const axios = require('axios');

async function sendSlackAlert(message, severity = 'info') {
  const colors = {
    error: '#ff0000',
    warning: '#ffa500',
    info: '#0000ff',
    success: '#00ff00'
  };

  const payload = {
    attachments: [{
      color: colors[severity],
      title: 'SecurePath Alert',
      text: message,
      footer: 'SecurePath Monitoring',
      ts: Math.floor(Date.now() / 1000)
    }]
  };

  try {
    await axios.post(process.env.SLACK_WEBHOOK_URL, payload);
  } catch (error) {
    logger.error('Failed to send Slack alert', { error });
  }
}

module.exports = { sendSlackAlert };
```

### 2. Email Alerts

```javascript
// backend/src/utils/email.js
const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD
  }
});

async function sendEmailAlert(to, subject, message) {
  const mailOptions = {
    from: process.env.EMAIL_FROM,
    to: to,
    subject: subject,
    html: message
  };

  try {
    await transporter.sendMail(mailOptions);
  } catch (error) {
    logger.error('Failed to send email alert', { error });
  }
}
```

### 3. Alert Rules

```javascript
// backend/src/middleware/alerting.js
const { sendSlackAlert } = require('../utils/slack');

// High error rate alert
let errorCount = 0;
let errorWindow = Date.now();

function checkErrorRate() {
  if (Date.now() - errorWindow > 60000) {
    if (errorCount > 10) {
      sendSlackAlert(
        `High error rate detected: ${errorCount} errors in last minute`,
        'error'
      );
    }
    errorCount = 0;
    errorWindow = Date.now();
  }
}

// Database connection alert
mongoose.connection.on('disconnected', () => {
  sendSlackAlert('Database connection lost!', 'error');
});

mongoose.connection.on('reconnected', () => {
  sendSlackAlert('Database connection restored', 'success');
});
```

---

## Dashboard Setup

### 1. Create Monitoring Dashboard

```typescript
// frontend/src/pages/MonitoringDashboard.tsx
import { useQuery } from '@tanstack/react-query';
import { Card } from '@/components/ui/card';

export function MonitoringDashboard() {
  const { data: health } = useQuery({
    queryKey: ['health'],
    queryFn: () => fetch('/api/health').then(r => r.json()),
    refetchInterval: 30000 // Refresh every 30 seconds
  });

  const { data: metrics } = useQuery({
    queryKey: ['metrics'],
    queryFn: () => fetch('/api/metrics').then(r => r.json()),
    refetchInterval: 60000 // Refresh every minute
  });

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <Card>
        <h3>System Health</h3>
        <p>Status: {health?.status}</p>
        <p>Uptime: {health?.uptime}s</p>
      </Card>
      
      <Card>
        <h3>Error Rate</h3>
        <p>{metrics?.errorRate}%</p>
      </Card>
      
      <Card>
        <h3>Response Time</h3>
        <p>{metrics?.avgResponseTime}ms</p>
      </Card>
    </div>
  );
}
```

### 2. Metrics Endpoint

```javascript
// backend/src/routes/metrics.js
const express = require('express');
const router = express.Router();

let metrics = {
  requests: 0,
  errors: 0,
  responseTimes: []
};

// Middleware to track metrics
function trackMetrics(req, res, next) {
  const start = Date.now();
  metrics.requests++;

  res.on('finish', () => {
    const duration = Date.now() - start;
    metrics.responseTimes.push(duration);
    
    // Keep only last 100 response times
    if (metrics.responseTimes.length > 100) {
      metrics.responseTimes.shift();
    }
    
    if (res.statusCode >= 400) {
      metrics.errors++;
    }
  });

  next();
}

router.get('/metrics', (req, res) => {
  const avgResponseTime = metrics.responseTimes.length > 0
    ? metrics.responseTimes.reduce((a, b) => a + b, 0) / metrics.responseTimes.length
    : 0;

  const errorRate = metrics.requests > 0
    ? (metrics.errors / metrics.requests) * 100
    : 0;

  res.json({
    totalRequests: metrics.requests,
    totalErrors: metrics.errors,
    errorRate: errorRate.toFixed(2),
    avgResponseTime: avgResponseTime.toFixed(2)
  });
});

module.exports = { router, trackMetrics };
```

---

## Best Practices

### 1. Error Handling

```typescript
// Always catch and log errors
try {
  await riskyOperation();
} catch (error) {
  logger.error('Operation failed', { error, context });
  Sentry.captureException(error);
  // Handle gracefully
}
```

### 2. Performance Monitoring

```typescript
// Monitor critical operations
const startTime = performance.now();
await criticalOperation();
const duration = performance.now() - startTime;

if (duration > 1000) {
  logger.warn('Slow operation detected', { duration });
}
```

### 3. User Feedback

```typescript
// Capture user feedback on errors
Sentry.showReportDialog({
  eventId: lastEventId,
  user: {
    email: user.email,
    name: user.name
  }
});
```

---

## Maintenance Checklist

### Daily
- [ ] Check Sentry for new errors
- [ ] Review uptime status
- [ ] Check alert notifications

### Weekly
- [ ] Review performance metrics
- [ ] Analyze error trends
- [ ] Check log files
- [ ] Review analytics data

### Monthly
- [ ] Update monitoring thresholds
- [ ] Review and optimize alerts
- [ ] Audit logging configuration
- [ ] Generate monthly report

---

## Additional Resources

- [Sentry Documentation](https://docs.sentry.io/)
- [Winston Documentation](https://github.com/winstonjs/winston)
- [UptimeRobot Documentation](https://uptimerobot.com/api/)
- [Vercel Analytics](https://vercel.com/docs/analytics)

---

**Stay Monitored! 📊**

*Last Updated: October 2025*
