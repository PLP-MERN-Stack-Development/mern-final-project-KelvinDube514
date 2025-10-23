import { ReactElement } from 'react';
import { render, RenderOptions } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider } from '@/components/theme-provider';
import { vi } from 'vitest';

// Create a custom render function that includes all providers
const AllTheProviders = ({ children }: { children: React.ReactNode }) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: 0,
      },
    },
  });

  return (
    <BrowserRouter>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider defaultTheme="light" storageKey="vite-ui-theme">
          {children}
        </ThemeProvider>
      </QueryClientProvider>
    </BrowserRouter>
  );
};

const customRender = (
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>,
) => render(ui, { wrapper: AllTheProviders, ...options });

// Mock user data for tests
export const mockUser = {
  _id: '123',
  firstName: 'Test',
  lastName: 'User',
  email: 'test@example.com',
  role: 'citizen' as const,
  isActive: true,
  createdAt: '2024-01-01T00:00:00.000Z',
  updatedAt: '2024-01-01T00:00:00.000Z',
};

// Mock incident/post data
export const mockIncident = {
  _id: '456',
  type: 'crime' as const,
  title: 'Test Incident',
  description: 'This is a test incident',
  location: {
    type: 'Point' as const,
    coordinates: [-74.006, 40.7128] as [number, number],
    address: {
      street: '123 Test St',
      city: 'New York',
      state: 'NY',
      zipCode: '10001',
      country: 'USA',
    },
  },
  severity: 'medium' as const,
  status: 'pending' as const,
  reportedBy: mockUser,
  isActive: true,
  createdAt: '2024-01-01T00:00:00.000Z',
  updatedAt: '2024-01-01T00:00:00.000Z',
};

// Mock alert data
export const mockAlert = {
  _id: '789',
  type: 'warning' as const,
  title: 'Test Alert',
  message: 'This is a test alert',
  location: {
    type: 'Point' as const,
    coordinates: [-74.006, 40.7128] as [number, number],
    address: {
      street: '123 Test St',
      city: 'New York',
      state: 'NY',
      zipCode: '10001',
      country: 'USA',
    },
  },
  severity: 'medium' as const,
  radius: 1000,
  isActive: true,
  createdAt: '2024-01-01T00:00:00.000Z',
  updatedAt: '2024-01-01T00:00:00.000Z',
  expiresAt: '2024-01-02T00:00:00.000Z',
};

// Mock localStorage
export const mockLocalStorage = (() => {
  let store: Record<string, string> = {};

  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value.toString();
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
  };
})();

// Mock geolocation
export const mockGeolocation = {
  getCurrentPosition: vi.fn(),
  watchPosition: vi.fn(),
  clearWatch: vi.fn(),
};

// Setup function for tests requiring auth
export const setupAuthenticatedTest = () => {
  const token = 'mock-jwt-token';
  mockLocalStorage.setItem('token', token);
  mockLocalStorage.setItem('user', JSON.stringify(mockUser));
  return { token, user: mockUser };
};

// Cleanup function
export const cleanupTest = () => {
  mockLocalStorage.clear();
  vi.clearAllMocks();
};

// Re-export everything from testing-library
export * from '@testing-library/react';
export { customRender as render };
