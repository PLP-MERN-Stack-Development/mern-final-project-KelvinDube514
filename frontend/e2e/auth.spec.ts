import { test, expect } from '@playwright/test';

test.describe('Authentication Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should display login page', async ({ page }) => {
    await page.goto('/login');
    await expect(page.locator('h1, h2')).toContainText(/login|sign in/i);
  });

  test('should navigate to signup page', async ({ page }) => {
    await page.goto('/login');
    const signupLink = page.getByRole('link', { name: /sign up|register/i });
    await signupLink.click();
    await expect(page).toHaveURL(/.*signup/);
  });

  test('should show validation errors on empty login form', async ({ page }) => {
    await page.goto('/login');
    const submitButton = page.getByRole('button', { name: /login|sign in/i });
    await submitButton.click();
    
    // Should show validation errors
    await expect(page.locator('text=/email.*required|required.*email/i')).toBeVisible();
  });

  test('should show error for invalid credentials', async ({ page }) => {
    await page.goto('/login');
    
    await page.fill('input[type="email"]', 'invalid@example.com');
    await page.fill('input[type="password"]', 'wrongpassword');
    
    const submitButton = page.getByRole('button', { name: /login|sign in/i });
    await submitButton.click();
    
    // Should show error message
    await expect(page.locator('text=/invalid.*credentials|incorrect.*password/i')).toBeVisible({ timeout: 5000 });
  });

  test('should complete signup flow', async ({ page }) => {
    await page.goto('/signup');
    
    // Fill signup form
    await page.fill('input[name="firstName"]', 'Test');
    await page.fill('input[name="lastName"]', 'User');
    await page.fill('input[type="email"]', `test${Date.now()}@example.com`);
    await page.fill('input[name="password"]', 'Password123!');
    await page.fill('input[name="confirmPassword"]', 'Password123!');
    
    const submitButton = page.getByRole('button', { name: /sign up|register/i });
    await submitButton.click();
    
    // Should redirect or show success message
    await expect(page).toHaveURL(/.*dashboard|.*login/, { timeout: 10000 });
  });

  test('should logout successfully', async ({ page, context }) => {
    // First, set up an authenticated session
    await context.addCookies([
      {
        name: 'token',
        value: 'mock-token',
        domain: 'localhost',
        path: '/',
      },
    ]);
    
    await page.goto('/dashboard');
    
    // Find and click logout button
    const logoutButton = page.getByRole('button', { name: /logout|sign out/i });
    await logoutButton.click();
    
    // Should redirect to home or login
    await expect(page).toHaveURL(/.*\/|.*login/);
  });

  test('should persist login state after page refresh', async ({ page, context }) => {
    // Set up authenticated session
    await context.addCookies([
      {
        name: 'token',
        value: 'mock-token',
        domain: 'localhost',
        path: '/',
      },
    ]);
    
    await page.goto('/dashboard');
    await page.reload();
    
    // Should still be on dashboard
    await expect(page).toHaveURL(/.*dashboard/);
  });
});

test.describe('Protected Routes', () => {
  test('should redirect to login when accessing protected route', async ({ page }) => {
    await page.goto('/dashboard');
    
    // Should redirect to login
    await expect(page).toHaveURL(/.*login/, { timeout: 5000 });
  });

  test('should allow access to protected routes when authenticated', async ({ page, context }) => {
    // Set up authenticated session
    await context.addCookies([
      {
        name: 'token',
        value: 'mock-token',
        domain: 'localhost',
        path: '/',
      },
    ]);
    
    await page.goto('/dashboard');
    
    // Should stay on dashboard
    await expect(page).toHaveURL(/.*dashboard/);
  });
});
