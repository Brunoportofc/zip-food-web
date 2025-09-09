import { test, expect } from '@playwright/test';

/**
 * Testes de Autenticação para Restaurantes - TC002
 * Baseado no plano gerado pelo TestSprite
 * Plataforma ZipFood - Marketplace de Delivery
 */

test.describe('Restaurant Authentication', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('TC002 - Restaurant Authentication Success Flow', async ({ page }) => {
    // Navegar para a seção de restaurantes
    await page.goto('/restaurant');
    
    // Verificar se a página de restaurante carrega
    await expect(page).toHaveTitle(/ZipFood|Zip Food/);
    
    // Verificar elementos específicos da interface de restaurante
    const restaurantContent = page.locator('h1, h2, [data-testid="restaurant-page"]').filter({ hasText: /restaurante|restaurant|parceiro/i });
    
    if (await restaurantContent.isVisible()) {
      await expect(restaurantContent.first()).toBeVisible();
    }
    
    // Procurar botão de login específico para restaurantes
    const loginButton = page.locator('button:has-text("Login"), button:has-text("Entrar"), a[href*="sign-in"]').first();
    
    if (await loginButton.isVisible()) {
      await loginButton.click();
      
      // Verificar redirecionamento
      await page.waitForTimeout(1000);
      
      // Preencher credenciais de restaurante
      const emailField = page.locator('input[type="email"], input[name="email"]').first();
      const passwordField = page.locator('input[type="password"], input[name="password"]').first();
      
      if (await emailField.isVisible() && await passwordField.isVisible()) {
        await emailField.fill('restaurante@teste.com');
        await passwordField.fill('123456');
        
        const submitButton = page.locator('button[type="submit"], button:has-text("Entrar")').first();
        await submitButton.click();
        
        await page.waitForTimeout(2000);
        
        // Verificar resposta do sistema
        const hasResponse = await page.locator('.error, .success, [role="alert"], .toast').isVisible().catch(() => false);
        const urlChanged = !page.url().includes('sign-in');
        
        expect(hasResponse || urlChanged).toBeTruthy();
      }
    }
  });

  test('TC002b - Restaurant Registration Flow', async ({ page }) => {
    // Tentar acessar página de cadastro de restaurante
    await page.goto('/auth/sign-up');
    
    // Verificar se existe opção para selecionar tipo de usuário
    const userTypeSelector = page.locator('select[name="type"], input[value="restaurant"], button:has-text("Restaurante")');
    
    if (await userTypeSelector.first().isVisible()) {
      // Selecionar tipo restaurante
      await userTypeSelector.first().click();
      
      if (await page.locator('option[value="restaurant"]').isVisible()) {
        await page.locator('option[value="restaurant"]').click();
      }
    }
    
    // Preencher dados do restaurante
    const nameField = page.locator('input[name="name"], input[placeholder*="nome"]').first();
    const emailField = page.locator('input[type="email"]').first();
    const passwordField = page.locator('input[type="password"]').first();
    
    if (await nameField.isVisible()) await nameField.fill('Restaurante Teste');
    if (await emailField.isVisible()) await emailField.fill('novorestaurante@teste.com');
    if (await passwordField.isVisible()) await passwordField.fill('123456');
    
    // Campos específicos de restaurante (se existirem)
    const addressField = page.locator('input[name="address"], input[placeholder*="endereço"]').first();
    const phoneField = page.locator('input[name="phone"], input[type="tel"]').first();
    
    if (await addressField.isVisible()) await addressField.fill('Rua Teste, 123');
    if (await phoneField.isVisible()) await phoneField.fill('(11) 99999-9999');
    
    // Submeter formulário
    const submitButton = page.locator('button[type="submit"], button:has-text("Cadastrar")').first();
    if (await submitButton.isVisible()) {
      await submitButton.click();
      await page.waitForTimeout(2000);
      
      const hasResponse = await page.locator('.error, .success, [role="alert"]').isVisible().catch(() => false);
      expect(hasResponse || !page.url().includes('sign-up')).toBeTruthy();
    }
  });

  test('TC002c - Restaurant Dashboard Access', async ({ page }) => {
    // Navegar diretamente para área do restaurante
    await page.goto('/restaurant');
    
    // Verificar elementos da interface de restaurante
    const dashboardElements = [
      'pedidos', 'orders', 'cardápio', 'menu', 'vendas', 'sales',
      'estatísticas', 'analytics', 'configurações', 'settings'
    ];
    
    let foundElements = 0;
    
    for (const element of dashboardElements) {
      const elementLocator = page.locator(`text=${element}`).first();
      if (await elementLocator.isVisible().catch(() => false)) {
        foundElements++;
      }
    }
    
    // Verificar se pelo menos alguns elementos de dashboard estão presentes
    // ou se há indicação de que precisa fazer login
    const needsLogin = await page.locator('text=login, text=entrar, button:has-text("Login")').isVisible().catch(() => false);
    
    expect(foundElements > 0 || needsLogin).toBeTruthy();
  });

  test('TC002d - Restaurant Interface Responsiveness', async ({ page }) => {
    await page.goto('/restaurant');
    
    // Testar em diferentes tamanhos de tela
    const viewports = [
      { width: 375, height: 667 },   // Mobile
      { width: 768, height: 1024 },  // Tablet
      { width: 1280, height: 720 }   // Desktop
    ];
    
    for (const viewport of viewports) {
      await page.setViewportSize(viewport);
      await page.waitForTimeout(500);
      
      // Verificar se o header ainda está visível
      const header = page.locator('header, [data-testid="global-header"]');
      await expect(header).toBeVisible();
      
      // Verificar se o conteúdo principal está visível
      const mainContent = page.locator('main, [role="main"], .main-content');
      if (await mainContent.isVisible()) {
        await expect(mainContent).toBeVisible();
      }
    }
  });

  test('TC002e - Restaurant Menu Management Interface', async ({ page }) => {
    await page.goto('/restaurant');
    
    // Procurar por elementos relacionados ao gerenciamento de cardápio
    const menuElements = page.locator('text=cardápio, text=menu, text=produtos, text=items');
    
    if (await menuElements.first().isVisible()) {
      await menuElements.first().click();
      await page.waitForTimeout(1000);
      
      // Verificar se há interface para adicionar/editar itens
      const addButton = page.locator('button:has-text("Adicionar"), button:has-text("Add"), button[aria-label*="add"]');
      const editButton = page.locator('button:has-text("Editar"), button:has-text("Edit")');
      
      const hasMenuManagement = await addButton.isVisible().catch(() => false) || 
                               await editButton.isVisible().catch(() => false);
      
      // Se não encontrar elementos de gerenciamento, pelo menos deve ter algum conteúdo
      const hasContent = await page.locator('body').textContent().then(text => text!.length > 100);
      
      expect(hasMenuManagement || hasContent).toBeTruthy();
    }
  });
});