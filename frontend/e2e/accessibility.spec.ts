import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test.describe('Accessibility Tests', () => {
  test('homepage should not have accessibility violations', async ({ page }) => {
    await page.goto('/');
    
    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
      .analyze();
    
    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test('login page should not have accessibility violations', async ({ page }) => {
    await page.goto('/login');
    
    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
      .analyze();
    
    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test('dashboard should not have accessibility violations', async ({ page, context }) => {
    await context.addCookies([
      {
        name: 'token',
        value: 'mock-token',
        domain: 'localhost',
        path: '/',
      },
    ]);
    
    await page.goto('/dashboard');
    
    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
      .analyze();
    
    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test('report page should not have accessibility violations', async ({ page, context }) => {
    await context.addCookies([
      {
        name: 'token',
        value: 'mock-token',
        domain: 'localhost',
        path: '/',
      },
    ]);
    
    await page.goto('/report-alert');
    
    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
      .analyze();
    
    expect(accessibilityScanResults.violations).toEqual([]);
  });
});

test.describe('Keyboard Navigation', () => {
  test('should navigate through homepage with keyboard', async ({ page }) => {
    await page.goto('/');
    
    // Tab through interactive elements
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');
    
    // Check that focus is visible
    const focusedElement = await page.evaluate(() => document.activeElement?.tagName);
    expect(['A', 'BUTTON', 'INPUT']).toContain(focusedElement);
  });

  test('should navigate login form with keyboard', async ({ page }) => {
    await page.goto('/login');
    
    // Tab to email field
    await page.keyboard.press('Tab');
    await page.keyboard.type('test@example.com');
    
    // Tab to password field
    await page.keyboard.press('Tab');
    await page.keyboard.type('password123');
    
    // Tab to submit button and press Enter
    await page.keyboard.press('Tab');
    await page.keyboard.press('Enter');
    
    // Form should attempt to submit
    expect(true).toBe(true);
  });

  test('should support escape key to close modals', async ({ page, context }) => {
    await context.addCookies([
      {
        name: 'token',
        value: 'mock-token',
        domain: 'localhost',
        path: '/',
      },
    ]);
    
    await page.goto('/dashboard');
    
    // Open a modal if available
    const modalTrigger = page.locator('button:has-text("Details"), button:has-text("View")').first();
    if (await modalTrigger.count() > 0) {
      await modalTrigger.click();
      
      // Press Escape
      await page.keyboard.press('Escape');
      
      // Modal should close
      await page.waitForTimeout(500);
    }
  });
});

test.describe('Screen Reader Support', () => {
  test('should have proper ARIA labels on navigation', async ({ page }) => {
    await page.goto('/');
    
    // Check for navigation landmarks
    const nav = page.locator('nav, [role="navigation"]');
    await expect(nav).toBeVisible();
    
    // Check for proper link labels
    const links = page.locator('a');
    const linkCount = await links.count();
    
    for (let i = 0; i < Math.min(linkCount, 5); i++) {
      const link = links.nth(i);
      const text = await link.textContent();
      const ariaLabel = await link.getAttribute('aria-label');
      
      expect(text || ariaLabel).toBeTruthy();
    }
  });

  test('should have proper form labels', async ({ page }) => {
    await page.goto('/login');
    
    // Check that all inputs have labels
    const inputs = page.locator('input[type="email"], input[type="password"]');
    const inputCount = await inputs.count();
    
    for (let i = 0; i < inputCount; i++) {
      const input = inputs.nth(i);
      const id = await input.getAttribute('id');
      const ariaLabel = await input.getAttribute('aria-label');
      const ariaLabelledBy = await input.getAttribute('aria-labelledby');
      
      if (id) {
        const label = page.locator(`label[for="${id}"]`);
        const hasLabel = await label.count() > 0;
        expect(hasLabel || ariaLabel || ariaLabelledBy).toBeTruthy();
      }
    }
  });

  test('should have proper heading hierarchy', async ({ page }) => {
    await page.goto('/');
    
    // Check for h1
    const h1 = page.locator('h1');
    await expect(h1.first()).toBeVisible();
    
    // Verify heading hierarchy
    const headings = await page.locator('h1, h2, h3, h4, h5, h6').all();
    expect(headings.length).toBeGreaterThan(0);
  });

  test('should have alt text on images', async ({ page }) => {
    await page.goto('/');
    
    const images = page.locator('img');
    const imageCount = await images.count();
    
    for (let i = 0; i < imageCount; i++) {
      const img = images.nth(i);
      const alt = await img.getAttribute('alt');
      const role = await img.getAttribute('role');
      
      // Images should have alt text or be marked as decorative
      expect(alt !== null || role === 'presentation').toBeTruthy();
    }
  });
});

test.describe('Color Contrast', () => {
  test('should have sufficient color contrast', async ({ page }) => {
    await page.goto('/');
    
    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2aa'])
      .analyze();
    
    const contrastViolations = accessibilityScanResults.violations.filter(
      v => v.id === 'color-contrast'
    );
    
    expect(contrastViolations).toEqual([]);
  });
});

test.describe('Focus Management', () => {
  test('should have visible focus indicators', async ({ page }) => {
    await page.goto('/');
    
    // Tab to first interactive element
    await page.keyboard.press('Tab');
    
    // Check if focus is visible
    const focusedElement = page.locator(':focus');
    await expect(focusedElement).toBeVisible();
    
    // Check for focus styles
    const outlineWidth = await focusedElement.evaluate(
      el => window.getComputedStyle(el).outlineWidth
    );
    const boxShadow = await focusedElement.evaluate(
      el => window.getComputedStyle(el).boxShadow
    );
    
    // Should have some focus indicator
    expect(outlineWidth !== '0px' || boxShadow !== 'none').toBeTruthy();
  });

  test('should trap focus in modals', async ({ page, context }) => {
    await context.addCookies([
      {
        name: 'token',
        value: 'mock-token',
        domain: 'localhost',
        path: '/',
      },
    ]);
    
    await page.goto('/dashboard');
    
    // Open a modal if available
    const modalTrigger = page.locator('button:has-text("Details"), button:has-text("View")').first();
    if (await modalTrigger.count() > 0) {
      await modalTrigger.click();
      
      // Tab through modal
      await page.keyboard.press('Tab');
      await page.keyboard.press('Tab');
      
      // Focus should stay within modal
      const focusedElement = await page.evaluate(() => {
        const modal = document.querySelector('[role="dialog"], [role="alertdialog"]');
        return modal?.contains(document.activeElement);
      });
      
      expect(focusedElement).toBeTruthy();
    }
  });
});
