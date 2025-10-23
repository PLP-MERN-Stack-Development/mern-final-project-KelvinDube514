# 🛡️ SecurePath - Community Safety Platform

> A production-ready real-time neighborhood safety and alert system empowering communities to report, track, and respond to incidents effectively. Built with modern web technologies for scalability, security, and accessibility.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js Version](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen)](https://nodejs.org)
[![PRs Welcome](https://cdn.leonardo.ai/users/b664e3c2-6d8d-438e-8609-99976bee2e2b/generations/0f46b844-db33-4a4e-be02-3fb0e1102d29/segments/3:4:1/Flux_Dev_Create_a_SecurePath_Revolutionizing_Neighborhood_Safe_2.jpg)](http://makeapullrequest.com)

[Live Demo](https://graceful-capybara-5ba2c7.netlify.app/) | [Documentation](./docs) | [API Docs](./docs/API.md) | [Contributing](./CONTRIBUTING.md)

---

## 📋 Table of Contents

- [Features](#-features)
- [Tech Stack](#-tech-stack)
- [Quick Start](#-quick-start)
- [Installation](#-installation)
- [Usage](#-usage)
- [API Documentation](#-api-documentation)
- [Testing](#-testing)
- [Deployment](#-deployment)
- [Contributing](#-contributing)
- [License](#-license)

---

## ✨ Features

### 🚨 Incident Reporting
- **Real-time Reporting**: Report incidents instantly with location, photos, and descriptions
- **Categorization**: Classify incidents by type (crime, accident, hazard, suspicious activity, etc.)
- **Severity Levels**: Mark incidents as low, medium, high, or critical
- **Media Upload**: Attach photos and videos as evidence with secure file handling
- **Status Tracking**: Track incident status (reported, verified, investigating, resolved)
- **Community Verification**: Vote-based system for incident credibility

### 📍 Interactive Map
- **Live Incident Map**: View all incidents on an interactive map powered by Google Maps & Leaflet
- **Location-based Filtering**: Find incidents near you with geospatial queries
- **Heat Maps**: Visualize incident density and patterns
- **Custom Markers**: Color-coded by severity with detailed popups
- **Geolocation**: Auto-detect your location with browser geolocation API
- **Real-time Updates**: Socket.IO integration for live incident updates

### 🔔 Alert System
- **Emergency Alerts**: Authorities can broadcast critical alerts
- **Targeted Notifications**: Alerts based on location and radius
- **Push Notifications**: Browser notifications for nearby incidents
- **Alert History**: View past alerts and their status
- **Priority Levels**: Critical, warning, info, and safe alerts

### 👥 User Management
- **Role-based Access**: Citizens, authorities, and administrators
- **Profile Management**: Update personal information and preferences
- **Activity History**: Track your reported incidents
- **Notification Settings**: Customize alert preferences

### 📊 Analytics Dashboard
- **Statistics**: View incident trends and patterns
- **Charts & Graphs**: Visualize data with interactive charts
- **Export Data**: Download reports in various formats
- **Time-based Analysis**: Filter by date ranges
- **Type Distribution**: See breakdown by incident type

### 🔒 Security Features
- **JWT Authentication**: Secure token-based authentication
- **Role-based Authorization**: Granular permission control
- **Rate Limiting**: Prevent abuse and DDoS attacks
- **Input Validation**: Comprehensive data validation
- **HTTPS**: Encrypted communication
- **CORS Protection**: Configured cross-origin policies

### ♿ Accessibility & UX
- **WCAG 2.1 AA Compliant**: Meets accessibility standards
- **Keyboard Navigation**: Full keyboard support with focus management
- **Screen Reader Support**: ARIA labels and semantic HTML
- **High Contrast**: Sufficient color contrast ratios (tested with axe-core)
- **Responsive Design**: Mobile-first design that works on all devices
- **Dark Mode**: System-aware dark mode with manual toggle
- **Loading States**: Skeleton loaders and progress indicators

---

## 🛠️ Tech Stack

### Frontend
- **Framework**: React 18.3 with TypeScript 5.8
- **Build Tool**: Vite 5.4
- **UI Library**: Radix UI + shadcn/ui
- **Styling**: Tailwind CSS 3.4 with animations
- **State Management**: TanStack Query v5 (React Query)
- **Routing**: React Router v6.30
- **Maps**: Google Maps API (@googlemaps/react-wrapper) + Leaflet 1.9
- **Forms**: React Hook Form 7.61 + Zod 3.25
- **Real-time**: Socket.IO Client 4.8
- **Charts**: Recharts 2.15
- **Icons**: Lucide React
- **Theme**: next-themes with dark mode support
- **Error Tracking**: Sentry 8.31

### Backend
- **Runtime**: Node.js 18+ (v18.0.0 minimum)
- **Framework**: Express.js 5.1
- **Database**: MongoDB Atlas with Mongoose 8.18
- **Authentication**: JWT (jsonwebtoken 9.0) + bcryptjs 3.0
- **Validation**: Joi 18.0
- **Real-time**: Socket.IO 4.8
- **File Upload**: Multer 2.0 with size/type validation
- **Security**: Helmet 8.1, CORS 2.8, express-rate-limit 8.1
- **Logging**: Winston 3.17 with structured logging
- **Error Tracking**: Sentry Node 8.31

### DevOps & Testing
- **Backend Testing**: Jest 30.1 with Supertest 7.1
- **Frontend Testing**: Vitest 2.1 with Testing Library, Playwright 1.49
- **Accessibility Testing**: @axe-core/playwright 4.10
- **Coverage**: Vitest coverage-v8 for comprehensive reports
- **CI/CD**: GitHub Actions (separate workflows for backend/frontend)
- **Containerization**: Docker with docker-compose
- **Hosting**: Render (Backend), Netlify (Frontend)
- **Database**: MongoDB Atlas (cloud-hosted)
- **Monitoring**: Sentry for error tracking and performance

---

## 🚀 Quick Start

### Prerequisites
- Node.js 18.x or 20.x
- npm 8.x or higher
- MongoDB (local or Atlas)
- Google Maps API key

### Clone Repository
```bash
git clone https://github.com/KelvinDube514/community-safe-path.git
cd community-safe-path
```

### Backend Setup
```bash
cd backend
npm install
cp .env.example .env
# Edit .env with your configuration
npm run dev
```

### Frontend Setup
```bash
cd frontend
npm install
cp .env.example .env.local
# Edit .env.local with your configuration
npm run dev
```

### Access Application
- Frontend: http://localhost:5173 (Vite dev server)
- Backend API: http://localhost:5000
- API Health Check: http://localhost:5000/health

---

## 📦 Installation

### Detailed Setup Instructions

#### 1. Backend Installation

```bash
cd backend

# Install dependencies
npm install

# Create environment file
cp .env.example .env
```

**Configure `.env`:**
```env
NODE_ENV=development
PORT=5000
MONGODB_URI=mongodb://localhost:27017/securepath
JWT_SECRET=your-super-secret-jwt-key-min-32-characters
REFRESH_TOKEN_SECRET=your-refresh-token-secret-min-32-characters
FRONTEND_URL=http://localhost:8080
CORS_ORIGIN=http://localhost:8080
```

**Start Development Server:**
```bash
npm run dev
```

**Create Demo Data** (Optional):
```bash
npm run create-demo-users
npm run seed:incidents
```

#### 2. Frontend Installation

```bash
cd frontend

# Install dependencies
npm install

# Create environment file
cp .env.example .env.local
```

**Configure `.env.local`:**
```env
VITE_API_URL=http://localhost:5000
VITE_API_BASE_URL=http://localhost:5000
VITE_GOOGLE_MAPS_API_KEY=your-google-maps-api-key
VITE_SENTRY_DSN=your-sentry-dsn-optional
```

> **Note**: See [GOOGLE_MAPS_SETUP.md](./GOOGLE_MAPS_SETUP.md) for detailed Google Maps API setup instructions.

**Start Development Server:**
```bash
npm run dev
```

#### 3. Database Setup

**Option A: Local MongoDB**
```bash
# Install MongoDB
# macOS
brew install mongodb-community

# Ubuntu
sudo apt-get install mongodb

# Start MongoDB
mongod --dbpath /path/to/data/directory
```

**Option B: MongoDB Atlas** (Recommended)
1. Create account at [mongodb.com/cloud/atlas](https://www.mongodb.com/cloud/atlas)
2. Create cluster
3. Get connection string
4. Update `MONGODB_URI` in `.env`

---

## 💻 Usage

### User Roles

#### 👤 Citizen
- Report incidents
- View incidents and alerts
- Update own profile
- Receive notifications

#### 👮 Authority
- All citizen permissions
- Verify incidents
- Create alerts
- Manage incidents

#### 👨‍💼 Admin
- All authority permissions
- Manage users
- Access analytics
- System configuration

### Common Tasks

#### Report an Incident
1. Log in to your account
2. Click "Report Incident" button
3. Fill in incident details:
   - Title and description
   - Select type and severity
   - Add location (auto-detected or manual)
   - Upload photos/videos (optional)
4. Submit report
5. Track status in your dashboard

#### View Incidents on Map
1. Navigate to "Map" page
2. Incidents appear as markers
3. Click marker to view details
4. Filter by type, severity, or date
5. Search by location

#### Receive Alerts
1. Enable browser notifications
2. Set notification preferences in profile
3. Receive alerts for incidents near you
4. View alert history in dashboard

---

## 📚 API Documentation

### Base URL
```
Development: http://localhost:5000/api
Production: https://your-backend.onrender.com/api
```

### Authentication

All authenticated endpoints require JWT token in header:
```
Authorization: Bearer <your-jwt-token>
```

### Key Endpoints

#### Authentication
```http
POST /api/auth/register     # Register new user
POST /api/auth/login        # Login user
GET  /api/auth/me           # Get current user
POST /api/auth/logout       # Logout user
PUT  /api/auth/profile      # Update profile
PUT  /api/auth/change-password  # Change password
```

#### Incidents
```http
GET    /api/incidents           # List incidents
POST   /api/incidents           # Create incident
GET    /api/incidents/:id       # Get incident
PUT    /api/incidents/:id       # Update incident
DELETE /api/incidents/:id       # Delete incident
GET    /api/incidents/stats/summary  # Get statistics
```

#### Alerts
```http
GET    /api/alerts              # List alerts
POST   /api/alerts              # Create alert (authority only)
GET    /api/alerts/:id          # Get alert
PUT    /api/alerts/:id          # Update alert
DELETE /api/alerts/:id          # Delete alert
```

For complete API documentation, see [API.md](./docs/API.md)

---

## 🧪 Testing

### Run Tests

```bash
# Backend tests
cd backend
npm test                    # Run all tests with Jest
npm run test:watch          # Watch mode
npm run test:coverage       # With coverage report

# Frontend tests
cd frontend
npm test                    # Unit tests with Vitest
npm run test:watch          # Watch mode
npm run test:coverage       # With coverage report
npm run test:e2e            # E2E tests with Playwright
npm run test:e2e:ui         # E2E with Playwright UI
npm run test:e2e:headed     # E2E in headed mode
npm run test:e2e:debug      # E2E with debugger
npm run test:all            # Run all tests (unit + E2E)
```

### Test Coverage

- **Backend**: Comprehensive Jest tests with Supertest for API endpoints
- **Frontend**: Vitest unit tests with React Testing Library
- **E2E**: Playwright tests for critical user flows
- **Accessibility**: Automated axe-core testing for WCAG 2.1 AA compliance
- **Coverage Reports**: Available via `npm run test:coverage` in both frontend and backend

---

## 🚢 Deployment

### Quick Start Deployment

**Deploy in under 30 minutes!** See [QUICK_DEPLOY.md](./QUICK_DEPLOY.md)

### Deployment Options

#### Frontend
- **Vercel** (Recommended) - [Guide](./docs/VERCEL_DEPLOYMENT.md)
- **Netlify** - [Guide](./docs/DEPLOYMENT.md#frontend-deployment)
- **GitHub Pages** - [Guide](./docs/DEPLOYMENT.md#option-3-deploy-to-github-pages)

#### Backend
- **Render** (Recommended for WebSocket) - [Guide](./docs/DEPLOYMENT.md#option-2-deploy-to-railway)
- **Vercel** (Serverless) - [Guide](./docs/VERCEL_DEPLOYMENT.md#backend-deployment)
- **Railway** - [Guide](./docs/DEPLOYMENT.md#option-2-deploy-to-railway)
- **Heroku** - [Guide](./docs/DEPLOYMENT.md#option-3-deploy-to-heroku)
- **Docker** - [Guide](./docs/DEPLOYMENT.md#option-4-deploy-with-docker)

### CI/CD Pipeline

Automated deployment via GitHub Actions:
- **Tests**: Run on every push and PR
- **Deploy**: Automatic deployment to production on push to `main`
- **Monitoring**: Integrated error tracking and performance monitoring

See [GitHub Actions Workflows](./.github/workflows/)

### Deployment Checklist

Complete pre-deployment checklist: [DEPLOYMENT_CHECKLIST.md](./DEPLOYMENT_CHECKLIST.md)

### Monitoring & Error Tracking

- **Sentry**: Error tracking and performance monitoring
- **UptimeRobot**: Uptime monitoring and alerts
- **Vercel Analytics**: Traffic and performance analytics

Setup guide: [MONITORING_SETUP.md](./docs/MONITORING_SETUP.md)

For detailed deployment instructions, see:
- [Complete Deployment Guide](./docs/DEPLOYMENT.md)
- [Vercel Deployment Guide](./docs/VERCEL_DEPLOYMENT.md)
- [Quick Deploy Guide](./QUICK_DEPLOY.md)

---

## 🤝 Contributing

We welcome contributions! Please see [CONTRIBUTING.md](./CONTRIBUTING.md) for details.

### Development Workflow

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

### Code Style

- Follow ESLint configuration
- Use Prettier for formatting
- Write tests for new features
- Update documentation

---

## 📖 Documentation

- [API Documentation](./docs/API.md) - Complete REST API reference
- [Google Maps Setup](./GOOGLE_MAPS_SETUP.md) - Google Maps API configuration
- [Backend README](./backend/README.md) - Backend-specific documentation
- [Frontend README](./frontend/README.md) - Frontend-specific documentation
- [Product Context](./memory-bank/productContext.md) - Product vision and user journeys
- [Enhancement Summary](./memory-bank/enhancementSummary.md) - Recent improvements

---

## 🔐 Security

### Reporting Vulnerabilities

Please report security vulnerabilities to: security@communitysafepath.com

### Security Features

- JWT-based authentication
- Password hashing with bcrypt
- Rate limiting
- CORS protection
- Input validation
- XSS protection
- CSRF protection
- Helmet security headers

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 👥 Team

**Kelvin Dube** - *Lead Developer*
- GitHub: [@KelvinDube514](https://github.com/KelvinDube514)
- Email: kelvindube514@gmail.com

---

## 🙏 Acknowledgments

- [React](https://reactjs.org/)
- [Express.js](https://expressjs.com/)
- [MongoDB](https://www.mongodb.com/)
- [Tailwind CSS](https://tailwindcss.com/)
- [shadcn/ui](https://ui.shadcn.com/)
- [Radix UI](https://www.radix-ui.com/)
- All contributors and supporters

---

## 📞 Support

- 📧 Email: support@communitysafepath.com
- 💬 Discord: [Join our community](https://discord.gg/community-safe-path)
- 🐛 Issues: [GitHub Issues](https://github.com/KelvinDube514/community-safe-path/issues)
- 📖 Docs: [Documentation](./docs)

---

## 🗺️ Roadmap

### Version 2.0 (Planned)
- [ ] Mobile applications (iOS/Android)
- [ ] AI-powered incident prediction
- [ ] Multi-language support
- [ ] Advanced analytics dashboard
- [ ] Integration with emergency services
- [ ] Community forums
- [ ] Gamification features

### Version 1.1 (Current)
- [x] Real-time notifications via Socket.IO
- [x] Interactive maps with Google Maps & Leaflet
- [x] Role-based access control (citizen, authority, admin)
- [x] Dark mode with system preference detection
- [x] Comprehensive testing suite (Jest, Vitest, Playwright)
- [x] Accessibility compliance (WCAG 2.1 AA)
- [x] Community verification voting system
- [ ] Email notifications
- [ ] SMS alerts
- [ ] Export functionality (CSV/PDF reports)

---

<div align="center">

**Made with ❤️ for safer communities**

[⬆ Back to Top](#️-securepath---community-safety-platform)

</div>
