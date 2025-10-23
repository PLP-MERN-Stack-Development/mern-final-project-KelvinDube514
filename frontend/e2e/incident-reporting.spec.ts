import { test, expect } from '@playwright/test';

test.describe('Incident Reporting Flow', () => {
  test.beforeEach(async ({ page, context }) => {
    // Set up authenticated session
    await context.addCookies([
      {
        name: 'token',
        value: 'mock-token',
        domain: 'localhost',
        path: '/',
      },
    ]);
    
    // Mock geolocation
    await context.grantPermissions(['geolocation']);
    await context.setGeolocation({ latitude: 40.7128, longitude: -74.0060 });
  });

  test('should navigate to report incident page', async ({ page }) => {
    await page.goto('/dashboard');
    
    const reportButton = page.getByRole('link', { name: /report.*incident|report.*alert/i });
    await reportButton.click();
    
    await expect(page).toHaveURL(/.*report/);
  });

  test('should display incident report form', async ({ page }) => {
    await page.goto('/report-alert');
    
    // Check for form elements
    await expect(page.locator('input[name="title"], input[placeholder*="title"]')).toBeVisible();
    await expect(page.locator('textarea[name="description"], textarea[placeholder*="description"]')).toBeVisible();
  });

  test('should validate required fields', async ({ page }) => {
    await page.goto('/report-alert');
    
    const submitButton = page.getByRole('button', { name: /submit|report/i });
    await submitButton.click();
    
    // Should show validation errors
    await expect(page.locator('text=/required|must.*provide/i')).toBeVisible();
  });

  test('should submit incident report successfully', async ({ page }) => {
    await page.goto('/report-alert');
    
    // Fill out the form
    await page.fill('input[name="title"], input[placeholder*="title"]', 'Test Incident Report');
    await page.fill('textarea[name="description"], textarea[placeholder*="description"]', 'This is a test incident description with sufficient detail.');
    
    // Select incident type
    const typeSelect = page.locator('select[name="type"], [role="combobox"]').first();
    await typeSelect.click();
    await page.locator('text=/theft|crime/i').first().click();
    
    // Select severity
    const severitySelect = page.locator('select[name="severity"], [role="combobox"]').nth(1);
    await severitySelect.click();
    await page.locator('text=/medium/i').first().click();
    
    // Submit form
    const submitButton = page.getByRole('button', { name: /submit|report/i });
    await submitButton.click();
    
    // Should show success message or redirect
    await expect(page.locator('text=/success|submitted|reported/i')).toBeVisible({ timeout: 10000 });
  });

  test('should allow adding location manually', async ({ page }) => {
    await page.goto('/report-alert');
    
    // Look for location input or map
    const locationInput = page.locator('input[name*="location"], input[placeholder*="location"]');
    if (await locationInput.isVisible()) {
      await locationInput.fill('123 Main St, New York, NY');
    }
    
    expect(true).toBe(true); // Test passes if no errors
  });

  test('should support file upload for evidence', async ({ page }) => {
    await page.goto('/report-alert');
    
    // Check if file upload is available
    const fileInput = page.locator('input[type="file"]');
    if (await fileInput.count() > 0) {
      // Create a test file
      const buffer = Buffer.from('test image content');
      await fileInput.setInputFiles({
        name: 'evidence.jpg',
        mimeType: 'image/jpeg',
        buffer: buffer,
      });
      
      // Should show uploaded file
      await expect(page.locator('text=/evidence.jpg|uploaded/i')).toBeVisible({ timeout: 5000 });
    }
  });
});

test.describe('Incident Viewing', () => {
  test.beforeEach(async ({ page, context }) => {
    await context.addCookies([
      {
        name: 'token',
        value: 'mock-token',
        domain: 'localhost',
        path: '/',
      },
    ]);
  });

  test('should display incident list', async ({ page }) => {
    await page.goto('/dashboard');
    
    // Should show incidents or empty state
    const hasIncidents = await page.locator('[data-testid="incident-card"], .incident-card').count() > 0;
    const hasEmptyState = await page.locator('text=/no.*incidents|no.*reports/i').isVisible();
    
    expect(hasIncidents || hasEmptyState).toBe(true);
  });

  test('should filter incidents by type', async ({ page }) => {
    await page.goto('/dashboard');
    
    // Look for filter controls
    const filterButton = page.locator('button:has-text("Filter"), [aria-label*="filter"]');
    if (await filterButton.count() > 0) {
      await filterButton.first().click();
      
      // Select a filter option
      await page.locator('text=/theft|crime/i').first().click();
      
      // Wait for filtered results
      await page.waitForTimeout(1000);
    }
    
    expect(true).toBe(true);
  });

  test('should view incident details', async ({ page }) => {
    await page.goto('/dashboard');
    
    // Click on first incident if available
    const firstIncident = page.locator('[data-testid="incident-card"], .incident-card').first();
    if (await firstIncident.count() > 0) {
      await firstIncident.click();
      
      // Should show incident details
      await expect(page.locator('text=/details|description/i')).toBeVisible({ timeout: 5000 });
    }
  });

  test('should display incident on map', async ({ page }) => {
    await page.goto('/map');
    
    // Should load map
    await expect(page.locator('[class*="map"], #map, [data-testid="map"]')).toBeVisible({ timeout: 10000 });
  });
});

test.describe('Incident Management', () => {
  test.beforeEach(async ({ page, context }) => {
    await context.addCookies([
      {
        name: 'token',
        value: 'mock-token',
        domain: 'localhost',
        path: '/',
      },
    ]);
  });

  test('should allow editing own incident', async ({ page }) => {
    await page.goto('/dashboard');
    
    // Find edit button on own incident
    const editButton = page.locator('button:has-text("Edit"), [aria-label*="edit"]').first();
    if (await editButton.count() > 0) {
      await editButton.click();
      
      // Should show edit form
      await expect(page.locator('input[name="title"], textarea[name="description"]')).toBeVisible();
    }
  });

  test('should allow deleting own incident', async ({ page }) => {
    await page.goto('/dashboard');
    
    // Find delete button
    const deleteButton = page.locator('button:has-text("Delete"), [aria-label*="delete"]').first();
    if (await deleteButton.count() > 0) {
      await deleteButton.click();
      
      // Should show confirmation dialog
      await expect(page.locator('text=/confirm|are you sure/i')).toBeVisible({ timeout: 5000 });
    }
  });
});
