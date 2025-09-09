import { test, expect } from '@playwright/test';

test.describe('Restaurant Navigation Tests', () => {
  test('TC005 - Customer can navigate to restaurant menu', async ({ page }) => {
    // Navigate to the main page
    await page.goto('http://localhost:3000');
    
    // Wait for page to load
    await page.waitForLoadState('networkidle');
    
    // Click on "Entrar" button
    await page.click('button:has-text("Entrar")');
    
    // Select customer profile
    await page.click('button:has-text("Cliente")');
    
    // Fill login form
    await page.fill('input[type="email"]', 'admin@gmail.com');
    await page.fill('input[type="password"]', '12341234');
    
    // Click sign in
    await page.click('button:has-text("Entrar")');
    
    // Wait for redirect to customer dashboard
    await page.waitForURL('**/customer');
    
    // Wait for restaurants to load
    await page.waitForSelector('[data-testid="restaurant-card"], .restaurant-card, .bg-white.rounded-xl.shadow-sm', { timeout: 10000 });
    
    // Find and click on the first restaurant card
    const restaurantCard = page.locator('.bg-white.rounded-xl.shadow-sm').first();
    await expect(restaurantCard).toBeVisible();
    
    // Click on the restaurant card
    await restaurantCard.click();
    
    // Wait for navigation to restaurant page
    await page.waitForURL('**/customer/restaurant/**', { timeout: 10000 });
    
    // Verify we're on the restaurant page by checking for menu elements
    await expect(page.locator('h1')).toBeVisible(); // Restaurant name
    await expect(page.locator('button:has-text("Voltar")')).toBeVisible(); // Back button
    
    // Check if menu items are displayed
    const menuItems = page.locator('.bg-white.rounded-xl.shadow-sm');
    await expect(menuItems.first()).toBeVisible();
    
    console.log('✅ TC005 - Restaurant navigation test passed!');
  });
  
  test('Restaurant page displays menu items correctly', async ({ page }) => {
    // Navigate directly to a restaurant page (assuming restaurant ID 1)
    await page.goto('http://localhost:3000/customer/restaurant/1');
    
    // Wait for page to load
    await page.waitForLoadState('networkidle');
    
    // Check restaurant info is displayed
    await expect(page.locator('h1')).toBeVisible();
    
    // Check menu categories are displayed
    await expect(page.locator('button:has-text("Todos")')).toBeVisible();
    
    // Check menu items are displayed
    const menuItems = page.locator('.bg-white.rounded-xl.shadow-sm');
    await expect(menuItems.first()).toBeVisible();
    
    // Check add to cart functionality
    const addButton = page.locator('button:has-text("Adicionar")').first();
    await expect(addButton).toBeVisible();
    
    console.log('✅ Restaurant menu page displays correctly!');
  });
  
  test('Add items to cart functionality', async ({ page }) => {
    // Navigate to restaurant page
    await page.goto('http://localhost:3000/customer/restaurant/1');
    await page.waitForLoadState('networkidle');
    
    // Add first item to cart
    const addButton = page.locator('button:has-text("Adicionar")').first();
    await addButton.click();
    
    // Check if cart button appears
    await expect(page.locator('button:has-text("itens")')).toBeVisible({ timeout: 5000 });
    
    // Check if quantity controls appear
    await expect(page.locator('button').filter({ hasText: '-' })).toBeVisible();
    await expect(page.locator('button').filter({ hasText: '+' })).toBeVisible();
    
    console.log('✅ Add to cart functionality works!');
  });
});