# Testing Documentation

## Overview

This document provides comprehensive information about the testing strategy, setup, and execution for the Community Safe Path application.

## Table of Contents

1. [Testing Strategy](#testing-strategy)
2. [Test Types](#test-types)
3. [Setup Instructions](#setup-instructions)
4. [Running Tests](#running-tests)
5. [Writing Tests](#writing-tests)
6. [Code Coverage](#code-coverage)
7. [Continuous Integration](#continuous-integration)
8. [Accessibility Testing](#accessibility-testing)
9. [Best Practices](#best-practices)

---

## Testing Strategy

Our testing approach follows the testing pyramid:

```
        /\
       /E2E\         <- Few, critical user flows
      /------\
     /Integration\   <- API endpoints, service integration
    /------------\
   /  Unit Tests  \  <- Many, fast, isolated tests
  /----------------\
```

### Coverage Goals

- **Unit Tests**: 80%+ coverage
- **Integration Tests**: All API endpoints
- **E2E Tests**: Critical user flows
- **Accessibility**: WCAG 2.1 AA compliance

---

## Test Types

### 1. Unit Tests

**Location**: 
- Frontend: `frontend/src/**/*.test.{ts,tsx}`
- Backend: `backend/src/tests/**/*.test.js`

**Purpose**: Test individual components, functions, and utilities in isolation.

**Tools**:
- Frontend: Vitest + React Testing Library
- Backend: Jest + Supertest

**Examples**:
- Component rendering
- Function logic
- Utility functions
- Service methods

### 2. Integration Tests

**Location**: `backend/src/tests/integration/**/*.integration.test.js`

**Purpose**: Test API endpoints and service interactions.

**Tools**: Jest + Supertest + MongoDB Memory Server

**Coverage**:
- Authentication endpoints
- Incident CRUD operations
- Alert management
- User management
- Dashboard analytics

### 3. End-to-End Tests

**Location**: `frontend/e2e/**/*.spec.ts`

**Purpose**: Test complete user workflows across the application.

**Tools**: Playwright

**Coverage**:
- User authentication flow
- Incident reporting
- Alert viewing
- Map interactions
- Profile management

### 4. Accessibility Tests

**Location**: `frontend/e2e/accessibility.spec.ts`

**Purpose**: Ensure WCAG 2.1 AA compliance.

**Tools**: Playwright + Axe-core

**Coverage**:
- Color contrast
- Keyboard navigation
- Screen reader support
- ARIA labels
- Focus management

---

## Setup Instructions

### Frontend Testing Setup

1. **Install dependencies**:
```bash
cd frontend
npm install
```

2. **Install Playwright browsers** (for E2E tests):
```bash
npx playwright install
```

3. **Configure environment**:
Create `.env.test` file:
```env
VITE_API_URL=http://localhost:5000
```

### Backend Testing Setup

1. **Install dependencies**:
```bash
cd backend
npm install
```

2. **Configure test environment**:
The test setup automatically uses MongoDB Memory Server, no additional configuration needed.

---

## Running Tests

### Frontend Tests

#### Unit Tests
```bash
# Run all unit tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage
```

#### E2E Tests
```bash
# Run all E2E tests
npm run test:e2e

# Run E2E tests with UI
npm run test:e2e:ui

# Run E2E tests in headed mode (see browser)
npm run test:e2e:headed

# Debug E2E tests
npm run test:e2e:debug

# Run specific test file
npx playwright test e2e/auth.spec.ts
```

#### All Tests
```bash
# Run unit and E2E tests
npm run test:all
```

### Backend Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage

# Run specific test file
npm test -- src/tests/auth.test.js

# Run integration tests only
npm test -- src/tests/integration/
```

---

## Writing Tests

### Frontend Component Tests

**Example**: Testing a component

```typescript
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@/test/testUtils';
import MyComponent from './MyComponent';

describe('MyComponent', () => {
  it('renders correctly', () => {
    render(<MyComponent title="Test" />);
    expect(screen.getByText('Test')).toBeInTheDocument();
  });

  it('handles user interaction', async () => {
    const handleClick = vi.fn();
    render(<MyComponent onClick={handleClick} />);
    
    const button = screen.getByRole('button');
    fireEvent.click(button);
    
    expect(handleClick).toHaveBeenCalledTimes(1);
  });
});
```

### Frontend Service Tests

**Example**: Testing an API service

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';
import ApiService from './ApiService';

global.fetch = vi.fn();

describe('ApiService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should fetch data successfully', async () => {
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true, data: [] }),
    });

    const result = await ApiService.getData();
    expect(result.success).toBe(true);
  });
});
```

### Backend Integration Tests

**Example**: Testing an API endpoint

```javascript
const request = require('supertest');
const app = require('../../app');
const User = require('../../models/User');

describe('POST /api/auth/login', () => {
  beforeEach(async () => {
    await User.create({
      email: 'test@example.com',
      password: 'password123',
      firstName: 'Test',
      lastName: 'User',
    });
  });

  it('should login with valid credentials', async () => {
    const response = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'test@example.com',
        password: 'password123',
      })
      .expect(200);

    expect(response.body.success).toBe(true);
    expect(response.body.data.token).toBeDefined();
  });
});
```

### E2E Tests

**Example**: Testing a user flow

```typescript
import { test, expect } from '@playwright/test';

test('user can report an incident', async ({ page }) => {
  await page.goto('/login');
  
  // Login
  await page.fill('input[type="email"]', 'test@example.com');
  await page.fill('input[type="password"]', 'password123');
  await page.click('button[type="submit"]');
  
  // Navigate to report page
  await page.click('text=Report Incident');
  
  // Fill form
  await page.fill('input[name="title"]', 'Test Incident');
  await page.fill('textarea[name="description"]', 'Test description');
  
  // Submit
  await page.click('button:has-text("Submit")');
  
  // Verify success
  await expect(page.locator('text=Success')).toBeVisible();
});
```

---

## Code Coverage

### Viewing Coverage Reports

#### Frontend
```bash
npm run test:coverage
# Open coverage/index.html in browser
```

#### Backend
```bash
npm run test:coverage
# Open coverage/lcov-report/index.html in browser
```

### Coverage Thresholds

**Frontend** (`vite.config.ts`):
```typescript
test: {
  coverage: {
    lines: 80,
    functions: 80,
    branches: 75,
    statements: 80,
  },
}
```

**Backend** (`jest.config.js`):
```javascript
coverageThreshold: {
  global: {
    branches: 75,
    functions: 80,
    lines: 80,
    statements: 80,
  },
}
```

---

## Continuous Integration

### GitHub Actions Workflow

Create `.github/workflows/test.yml`:

```yaml
name: Tests

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main, develop]

jobs:
  backend-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - name: Install dependencies
        run: cd backend && npm ci
      - name: Run tests
        run: cd backend && npm test
      - name: Upload coverage
        uses: codecov/codecov-action@v3
        with:
          files: ./backend/coverage/lcov.info

  frontend-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - name: Install dependencies
        run: cd frontend && npm ci
      - name: Run unit tests
        run: cd frontend && npm test
      - name: Install Playwright
        run: cd frontend && npx playwright install --with-deps
      - name: Run E2E tests
        run: cd frontend && npm run test:e2e
      - name: Upload coverage
        uses: codecov/codecov-action@v3
        with:
          files: ./frontend/coverage/lcov.info
```

---

## Accessibility Testing

### Manual Testing Checklist

- [ ] Keyboard navigation works on all pages
- [ ] Screen reader announces all content correctly
- [ ] Color contrast meets WCAG AA standards
- [ ] Focus indicators are visible
- [ ] Forms have proper labels
- [ ] Images have alt text
- [ ] Headings follow proper hierarchy
- [ ] ARIA attributes are used correctly

### Automated Testing

Run accessibility tests:
```bash
npm run test:e2e -- e2e/accessibility.spec.ts
```

### Tools

1. **Axe DevTools** (Browser Extension)
2. **WAVE** (Web Accessibility Evaluation Tool)
3. **Lighthouse** (Chrome DevTools)
4. **NVDA/JAWS** (Screen Readers)

---

## Best Practices

### General

1. **Write tests first** (TDD approach when possible)
2. **Keep tests isolated** - No dependencies between tests
3. **Use descriptive names** - Test names should explain what they test
4. **Follow AAA pattern** - Arrange, Act, Assert
5. **Mock external dependencies** - APIs, databases, third-party services
6. **Test edge cases** - Not just happy paths
7. **Keep tests fast** - Unit tests should run in milliseconds

### Frontend

1. **Test user behavior, not implementation**
2. **Use semantic queries** - getByRole, getByLabelText
3. **Avoid testing library internals**
4. **Test accessibility** - Use axe-core
5. **Mock API calls** - Don't hit real endpoints
6. **Use test utilities** - Centralize common test setup

### Backend

1. **Use in-memory database** - MongoDB Memory Server
2. **Clean up after tests** - Reset database state
3. **Test authentication** - Include auth in integration tests
4. **Test error cases** - Invalid input, unauthorized access
5. **Test data validation** - Joi schemas
6. **Mock external services** - Email, SMS, third-party APIs

### E2E

1. **Test critical paths only** - Don't duplicate unit tests
2. **Use page objects** - Organize selectors and actions
3. **Handle async properly** - Use proper waits
4. **Test on multiple browsers** - Chrome, Firefox, Safari
5. **Test responsive design** - Mobile and desktop viewports
6. **Keep tests independent** - Each test should work alone

---

## Troubleshooting

### Common Issues

#### Tests timing out
```bash
# Increase timeout in test file
test('slow test', async () => {
  // ...
}, 30000); // 30 second timeout
```

#### Database connection issues
```bash
# Ensure MongoDB Memory Server is properly configured
# Check src/tests/setup.js
```

#### Playwright browser issues
```bash
# Reinstall browsers
npx playwright install --force
```

#### Coverage not generating
```bash
# Frontend
npm install --save-dev @vitest/coverage-v8

# Backend
npm install --save-dev jest
```

---

## Resources

- [Vitest Documentation](https://vitest.dev/)
- [React Testing Library](https://testing-library.com/react)
- [Playwright Documentation](https://playwright.dev/)
- [Jest Documentation](https://jestjs.io/)
- [WCAG Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
- [Axe-core](https://github.com/dequelabs/axe-core)

---

## Contact

For questions or issues with testing, please contact the development team or open an issue on GitHub.
