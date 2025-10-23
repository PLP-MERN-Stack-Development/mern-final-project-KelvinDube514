# SecurePath Frontend

Modern, accessible React frontend for the SecurePath community safety platform.

## 🚀 Quick Start

### Prerequisites
- Node.js 18.x or higher
- npm 8.x or higher

### Installation

```bash
# Navigate to frontend directory
cd frontend

# Install dependencies
npm install

# Copy environment file
cp .env.example .env.local

# Configure your environment variables in .env.local
# VITE_API_URL=http://localhost:5000
# VITE_GOOGLE_MAPS_API_KEY=your-api-key

# Start development server
npm run dev
```

The application will be available at `http://localhost:5173`

## 🛠️ Tech Stack

- **Framework**: React 18.3 with TypeScript 5.8
- **Build Tool**: Vite 5.4 (fast HMR and optimized builds)
- **UI Components**: Radix UI + shadcn/ui
- **Styling**: Tailwind CSS 3.4 with custom animations
- **State Management**: TanStack Query v5 (React Query)
- **Routing**: React Router v6.30
- **Forms**: React Hook Form + Zod validation
- **Maps**: Google Maps API + Leaflet
- **Real-time**: Socket.IO Client 4.8
- **Charts**: Recharts 2.15
- **Icons**: Lucide React
- **Theme**: next-themes (dark mode support)
- **Testing**: Vitest + Playwright + Testing Library
- **Error Tracking**: Sentry

## 📁 Project Structure

```
frontend/
├── public/              # Static assets
│   ├── sounds/         # Notification sounds
│   └── favicon.ico
├── src/
│   ├── assets/         # Images, fonts, etc.
│   ├── components/     # React components
│   │   ├── ui/        # shadcn/ui components
│   │   └── ...        # Feature components
│   ├── config/        # Configuration files
│   ├── hooks/         # Custom React hooks
│   ├── lib/           # Utility functions
│   ├── pages/         # Page components
│   ├── services/      # API services
│   ├── test/          # Test utilities
│   ├── types/         # TypeScript types
│   ├── App.tsx        # Main app component
│   ├── main.tsx       # Entry point
│   └── index.css      # Global styles
├── .env.example       # Environment variables template
├── vite.config.ts     # Vite configuration
├── tailwind.config.ts # Tailwind configuration
└── package.json       # Dependencies and scripts
```

## 🧪 Testing

### Unit Tests (Vitest)
```bash
npm test              # Run all unit tests
npm run test:watch    # Watch mode
npm run test:coverage # With coverage report
```

### E2E Tests (Playwright)
```bash
npm run test:e2e         # Run E2E tests
npm run test:e2e:ui      # With Playwright UI
npm run test:e2e:headed  # In headed mode
npm run test:e2e:debug   # With debugger
```

### All Tests
```bash
npm run test:all  # Run both unit and E2E tests
```

## 🎨 Development

### Available Scripts

- `npm run dev` - Start development server (port 5173)
- `npm run build` - Build for production
- `npm run build:dev` - Build in development mode
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

### Code Style

- Follow TypeScript best practices
- Use functional components with hooks
- Implement proper error boundaries
- Write accessible components (ARIA labels, keyboard navigation)
- Use Tailwind CSS for styling
- Follow the existing component structure

### Adding New Components

1. Create component in appropriate directory
2. Export from index file if needed
3. Add TypeScript types/interfaces
4. Write unit tests
5. Update documentation

## 🌍 Environment Variables

Create a `.env.local` file with:

```env
# API Configuration
VITE_API_URL=http://localhost:5000
VITE_API_BASE_URL=http://localhost:5000

# Google Maps
VITE_GOOGLE_MAPS_API_KEY=your-google-maps-api-key

# Sentry (Optional)
VITE_SENTRY_DSN=your-sentry-dsn
```

## 🚢 Deployment

### Build for Production
```bash
npm run build
```

The build output will be in the `dist/` directory.

### Deploy to Netlify

1. Connect your GitHub repository to Netlify
2. Configure build settings:
   - Build command: `npm run build`
   - Publish directory: `dist`
3. Add environment variables in Netlify dashboard
4. Deploy automatically on push to main branch

### Deploy with Docker

Use the included Dockerfile:
```bash
docker build -t securepath-frontend .
docker run -p 80:80 securepath-frontend
```

## ♿ Accessibility

This project follows WCAG 2.1 AA standards:

- Semantic HTML
- ARIA labels and roles
- Keyboard navigation
- Focus management
- Color contrast compliance
- Screen reader support

Accessibility is tested with @axe-core/playwright.

## 🎨 Theming

The app supports light and dark modes:

- System preference detection
- Manual theme toggle
- Persistent theme selection
- Smooth transitions

## 📝 Contributing

See the main [CONTRIBUTING.md](../CONTRIBUTING.md) for guidelines.

## 📄 License

MIT License - see [LICENSE](../LICENSE) for details.

## 🔗 Links

- [Main README](../README.md)
- [Backend README](../backend/README.md)
- [API Documentation](../docs/API.md)
- [Live Demo](https://community-safe-path.netlify.app)
