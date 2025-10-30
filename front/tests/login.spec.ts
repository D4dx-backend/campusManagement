import { test, expect } from '@playwright/test';

const testUsers = [
  { mobile: '9876543210', pin: '1234', role: 'Super Admin', name: 'Super Administrator' },
  { mobile: '9876543211', pin: '5678', role: 'Branch Admin', name: 'Branch Administrator' },
  { mobile: '9876543212', pin: '9012', role: 'Teacher', name: 'Teacher User' },
  { mobile: '9876543213', pin: '3456', role: 'Accountant', name: 'Accountant User' }
];

test.describe('Login Functionality', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
  });

  test('should display login form correctly', async ({ page }) => {
    // Check if login form elements are present
    await expect(page.locator('h1')).toContainText('CampusWise');
    await expect(page.locator('input[placeholder*="Mobile"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();
  });

  test('should show validation errors for empty fields', async ({ page }) => {
    // Click login without entering credentials
    await page.click('button[type="submit"]');
    
    // Check for validation messages (this depends on your validation implementation)
    await expect(page.locator('input[placeholder*="Mobile"]')).toBeFocused();
  });

  test('should show error for invalid credentials', async ({ page }) => {
    // Enter invalid credentials
    await page.fill('input[placeholder*="Mobile"]', '1111111111');
    await page.fill('input[type="password"]', '0000');
    await page.click('button[type="submit"]');

    // Wait for error message
    await expect(page.locator('text=Invalid credentials')).toBeVisible({ timeout: 10000 });
  });

  // Test each user role
  for (const user of testUsers) {
    test(`should login successfully as ${user.role}`, async ({ page }) => {
      // Fill in credentials
      await page.fill('input[placeholder*="Mobile"]', user.mobile);
      await page.fill('input[type="password"]', user.pin);
      
      // Click login button
      await page.click('button[type="submit"]');

      // Wait for successful login and redirect to dashboard
      await expect(page).toHaveURL('/dashboard', { timeout: 15000 });
      
      // Check if dashboard loads correctly
      await expect(page.locator('h1')).toContainText('Dashboard');
      
      // Check if user name appears somewhere on the page (adjust selector as needed)
      await expect(page.locator('text=' + user.name)).toBeVisible();
    });
  }

  test('should handle network errors gracefully', async ({ page }) => {
    // Block network requests to simulate server down
    await page.route('**/api/auth/login', route => route.abort());
    
    await page.fill('input[placeholder*="Mobile"]', '9876543210');
    await page.fill('input[type="password"]', '1234');
    await page.click('button[type="submit"]');

    // Should show network error message
    await expect(page.locator('text=Network Error')).toBeVisible({ timeout: 10000 });
  });

  test('should logout successfully', async ({ page }) => {
    // First login
    await page.fill('input[placeholder*="Mobile"]', '9876543210');
    await page.fill('input[type="password"]', '1234');
    await page.click('button[type="submit"]');

    // Wait for dashboard
    await expect(page).toHaveURL('/dashboard', { timeout: 15000 });

    // Find and click logout button (adjust selector as needed)
    await page.click('button:has-text("Logout")');

    // Should redirect to login page
    await expect(page).toHaveURL('/login', { timeout: 10000 });
  });
});

test.describe('Dashboard Access Control', () => {
  test('should redirect to login when accessing dashboard without authentication', async ({ page }) => {
    await page.goto('/dashboard');
    
    // Should redirect to login
    await expect(page).toHaveURL('/login', { timeout: 10000 });
  });

  test('should maintain session after page refresh', async ({ page }) => {
    // Login first
    await page.goto('/login');
    await page.fill('input[placeholder*="Mobile"]', '9876543210');
    await page.fill('input[type="password"]', '1234');
    await page.click('button[type="submit"]');
    
    await expect(page).toHaveURL('/dashboard', { timeout: 15000 });

    // Refresh the page
    await page.reload();

    // Should still be on dashboard (session maintained)
    await expect(page).toHaveURL('/dashboard');
    await expect(page.locator('h1')).toContainText('Dashboard');
  });
});