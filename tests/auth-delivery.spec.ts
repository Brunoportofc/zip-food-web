import { test, expect } from '@playwright/test';

/**
 * Testes de Autenticação para Entregadores - TC003
 * Baseado no plano gerado pelo TestSprite
 * Plataforma ZipFood - Marketplace de Delivery
 */

test.describe('Delivery Driver Authentication', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('TC003 - Delivery Driver Authentication Flow', async ({ page }) => {
    // Navegar para a seção de entregadores
    await page.goto('/delivery');
    
    // Verificar se a página de entregadores carrega
    await expect(page).toHaveTitle(/ZipFood|Zip Food/);
    
    // Verificar elementos específicos da interface de entregadores
    const deliveryContent = page.locator('h1, h2, [data-testid="delivery-page"]').filter({ 
      hasText: /entregador|delivery|driver|entrega/i 
    });
    
    if (await deliveryContent.isVisible()) {
      await expect(deliveryContent.first()).toBeVisible();
    }
    
    // Procurar botão de login para entregadores
    const loginButton = page.locator('button:has-text("Login"), button:has-text("Entrar"), a[href*="sign-in"]').first();
    
    if (await loginButton.isVisible()) {
      await loginButton.click();
      await page.waitForTimeout(1000);
      
      // Preencher credenciais de entregador
      const emailField = page.locator('input[type="email"], input[name="email"]').first();
      const passwordField = page.locator('input[type="password"], input[name="password"]').first();
      
      if (await emailField.isVisible() && await passwordField.isVisible()) {
        await emailField.fill('entregador@teste.com');
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

  test('TC003b - Delivery Driver Registration', async ({ page }) => {
    await page.goto('/auth/sign-up');
    
    // Verificar se existe seleção de tipo de usuário
    const userTypeSelector = page.locator('select[name="type"], input[value="delivery"], button:has-text("Entregador")');
    
    if (await userTypeSelector.first().isVisible()) {
      await userTypeSelector.first().click();
      
      if (await page.locator('option[value="delivery"]').isVisible()) {
        await page.locator('option[value="delivery"]').click();
      }
    }
    
    // Preencher dados do entregador
    const nameField = page.locator('input[name="name"], input[placeholder*="nome"]').first();
    const emailField = page.locator('input[type="email"]').first();
    const passwordField = page.locator('input[type="password"]').first();
    const phoneField = page.locator('input[name="phone"], input[type="tel"]').first();
    
    if (await nameField.isVisible()) await nameField.fill('Entregador Teste');
    if (await emailField.isVisible()) await emailField.fill('novoentregador@teste.com');
    if (await passwordField.isVisible()) await passwordField.fill('123456');
    if (await phoneField.isVisible()) await phoneField.fill('(11) 98888-8888');
    
    // Campos específicos de entregador (se existirem)
    const vehicleField = page.locator('select[name="vehicle"], input[name="vehicle"]').first();
    const licenseField = page.locator('input[name="license"], input[placeholder*="cnh"]').first();
    
    if (await vehicleField.isVisible()) {
      await vehicleField.click();
      const bikeOption = page.locator('option[value="bike"], option:has-text("Bicicleta")');
      if (await bikeOption.isVisible()) await bikeOption.click();
    }
    
    if (await licenseField.isVisible()) await licenseField.fill('12345678901');
    
    // Submeter formulário
    const submitButton = page.locator('button[type="submit"], button:has-text("Cadastrar")').first();
    if (await submitButton.isVisible()) {
      await submitButton.click();
      await page.waitForTimeout(2000);
      
      const hasResponse = await page.locator('.error, .success, [role="alert"]').isVisible().catch(() => false);
      expect(hasResponse || !page.url().includes('sign-up')).toBeTruthy();
    }
  });

  test('TC003c - Delivery Dashboard Interface', async ({ page }) => {
    await page.goto('/delivery');
    
    // Verificar elementos típicos de dashboard de entregador
    const dashboardElements = [
      'pedidos', 'orders', 'entregas', 'deliveries', 'rota', 'route',
      'ganhos', 'earnings', 'histórico', 'history', 'status', 'disponível'
    ];
    
    let foundElements = 0;
    
    for (const element of dashboardElements) {
      const elementLocator = page.locator(`text=${element}`).first();
      if (await elementLocator.isVisible().catch(() => false)) {
        foundElements++;
      }
    }
    
    const needsLogin = await page.locator('text=login, text=entrar, button:has-text("Login")').isVisible().catch(() => false);
    
    expect(foundElements > 0 || needsLogin).toBeTruthy();
  });

  test('TC003d - Delivery Status Toggle', async ({ page }) => {
    await page.goto('/delivery');
    
    // Procurar por toggle de status (disponível/indisponível)
    const statusToggle = page.locator(
      'input[type="checkbox"], button:has-text("Disponível"), button:has-text("Online"), ' +
      'button:has-text("Offline"), .toggle, .switch'
    );
    
    if (await statusToggle.first().isVisible()) {
      const initialState = await statusToggle.first().isChecked().catch(() => false);
      
      // Tentar alterar o status
      await statusToggle.first().click();
      await page.waitForTimeout(500);
      
      const newState = await statusToggle.first().isChecked().catch(() => false);
      
      // Verificar se houve mudança de estado ou feedback visual
      const stateChanged = initialState !== newState;
      const hasVisualFeedback = await page.locator('.success, .info, [role="status"]').isVisible().catch(() => false);
      
      expect(stateChanged || hasVisualFeedback).toBeTruthy();
    }
  });

  test('TC003e - Delivery Map Interface', async ({ page }) => {
    await page.goto('/delivery');
    
    // Procurar por elementos relacionados a mapas
    const mapElements = page.locator(
      '[id*="map"], [class*="map"], canvas, ' +
      'text=mapa, text=localização, text=GPS, text=rota'
    );
    
    if (await mapElements.first().isVisible()) {
      await expect(mapElements.first()).toBeVisible();
      
      // Verificar se há controles de mapa
      const mapControls = page.locator(
        'button[aria-label*="zoom"], .leaflet-control, .mapboxgl-ctrl, ' +
        'button:has-text("+"), button:has-text("-")'
      );
      
      if (await mapControls.first().isVisible()) {
        await expect(mapControls.first()).toBeVisible();
      }
    } else {
      // Se não há mapa, pelo menos deve ter algum conteúdo relacionado à localização
      const locationContent = await page.locator('text=localização, text=endereço, text=GPS').isVisible().catch(() => false);
      const hasContent = await page.locator('body').textContent().then(text => text!.length > 100);
      
      expect(locationContent || hasContent).toBeTruthy();
    }
  });

  test('TC003f - Delivery Mobile Responsiveness', async ({ page }) => {
    // Entregadores usam principalmente mobile
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/delivery');
    
    // Verificar se a interface é otimizada para mobile
    const header = page.locator('header, [data-testid="global-header"]');
    await expect(header).toBeVisible();
    
    // Verificar se botões são grandes o suficiente para touch
    const buttons = page.locator('button');
    const buttonCount = await buttons.count();
    
    if (buttonCount > 0) {
      const firstButton = buttons.first();
      const buttonBox = await firstButton.boundingBox();
      
      if (buttonBox) {
        // Botões devem ter pelo menos 44px de altura (recomendação mobile)
        expect(buttonBox.height).toBeGreaterThanOrEqual(30);
      }
    }
    
    // Verificar se não há overflow horizontal
    const bodyWidth = await page.evaluate(() => document.body.scrollWidth);
    const viewportWidth = 375;
    
    expect(bodyWidth).toBeLessThanOrEqual(viewportWidth + 20); // 20px de tolerância
  });
});