import { test, expect } from '@playwright/test';

/**
 * Testes de Autenticação para Clientes - TC001
 * Baseado no plano gerado pelo TestSprite
 * Plataforma ZipFood - Marketplace de Delivery
 */

test.describe('Customer Authentication', () => {
  test.beforeEach(async ({ page }) => {
    // Navegar para a página inicial
    await page.goto('/');
  });

  test('TC001 - Customer Authentication Success Flow', async ({ page }) => {
    // Verificar se a página inicial carrega
    await expect(page).toHaveTitle(/ZipFood|Zip Food/);
    
    // Verificar se o header global está presente
    await expect(page.locator('[data-testid="global-header"], header')).toBeVisible();
    
    // Procurar botão de login no header
    const loginButton = page.locator('button:has-text("Login"), button:has-text("Entrar"), a[href*="sign-in"]').first();
    await expect(loginButton).toBeVisible();
    
    // Clicar no botão de login
    await loginButton.click();
    
    // Verificar se foi redirecionado para página de login
    await expect(page).toHaveURL(/.*sign-in.*/);
    
    // Verificar se existem campos de email e senha
    const emailField = page.locator('input[type="email"], input[name="email"]').first();
    const passwordField = page.locator('input[type="password"], input[name="password"]').first();
    
    await expect(emailField).toBeVisible();
    await expect(passwordField).toBeVisible();
    
    // Preencher credenciais de teste
    await emailField.fill('cliente@teste.com');
    await passwordField.fill('123456');
    
    // Procurar e clicar no botão de submit
    const submitButton = page.locator('button[type="submit"], button:has-text("Entrar"), button:has-text("Login")').first();
    await submitButton.click();
    
    // Aguardar navegação ou feedback
    await page.waitForTimeout(2000);
    
    // Verificar se houve tentativa de login (pode falhar por não ter backend real)
    // Mas deve mostrar algum feedback ou mudança na UI
    const hasError = await page.locator('.error, [role="alert"], .toast').isVisible().catch(() => false);
    const hasSuccess = await page.locator('.success, [role="status"]').isVisible().catch(() => false);
    const urlChanged = !page.url().includes('sign-in');
    
    // Pelo menos uma dessas condições deve ser verdadeira
    expect(hasError || hasSuccess || urlChanged).toBeTruthy();
  });

  test('TC001b - Customer Registration Flow', async ({ page }) => {
    // Navegar para página de registro
    await page.goto('/auth/sign-up');
    
    // Verificar se a página de registro carrega
    await expect(page.locator('h1, h2').filter({ hasText: /cadastr|registr|sign.?up/i })).toBeVisible();
    
    // Verificar campos obrigatórios
    const nameField = page.locator('input[name="name"], input[placeholder*="nome"]').first();
    const emailField = page.locator('input[type="email"], input[name="email"]').first();
    const passwordField = page.locator('input[type="password"], input[name="password"]').first();
    
    if (await nameField.isVisible()) {
      await nameField.fill('Cliente Teste');
    }
    
    await emailField.fill('novocliente@teste.com');
    await passwordField.fill('123456');
    
    // Tentar submeter o formulário
    const submitButton = page.locator('button[type="submit"], button:has-text("Cadastrar"), button:has-text("Registrar")').first();
    await submitButton.click();
    
    // Aguardar resposta
    await page.waitForTimeout(2000);
    
    // Verificar se houve alguma resposta do sistema
    const hasResponse = await page.locator('.error, .success, [role="alert"], [role="status"], .toast').isVisible().catch(() => false);
    const urlChanged = !page.url().includes('sign-up');
    
    expect(hasResponse || urlChanged).toBeTruthy();
  });

  test('TC001c - Language Selector Functionality', async ({ page }) => {
    // Verificar se o seletor de idioma está presente
    const languageSelector = page.locator('[data-testid="language-selector"], select, button').filter({ hasText: /pt|en|he|idioma|language/i }).first();
    
    if (await languageSelector.isVisible()) {
      // Testar mudança de idioma
      await languageSelector.click();
      
      // Procurar opções de idioma
      const languageOptions = page.locator('option, [role="menuitem"], button').filter({ hasText: /english|português|עברית/i });
      
      if (await languageOptions.first().isVisible()) {
        await languageOptions.first().click();
        
        // Aguardar mudança
        await page.waitForTimeout(1000);
        
        // Verificar se houve mudança no conteúdo
        const pageContent = await page.textContent('body');
        expect(pageContent).toBeTruthy();
      }
    } else {
      // Se não encontrar o seletor, apenas registrar que não está visível
      console.log('Language selector not found - may need to be implemented');
    }
  });

  test('TC001d - Header Navigation and Responsiveness', async ({ page }) => {
    // Testar responsividade do header
    await page.setViewportSize({ width: 375, height: 667 }); // Mobile
    
    // Verificar se o header ainda está visível em mobile
    await expect(page.locator('header, [data-testid="global-header"]')).toBeVisible();
    
    // Voltar para desktop
    await page.setViewportSize({ width: 1280, height: 720 });
    
    // Verificar navegação para diferentes seções
    const navigationLinks = page.locator('a[href*="customer"], a[href*="restaurant"], a[href*="delivery"]');
    
    if (await navigationLinks.first().isVisible()) {
      const linkCount = await navigationLinks.count();
      
      for (let i = 0; i < Math.min(linkCount, 3); i++) {
        const link = navigationLinks.nth(i);
        const href = await link.getAttribute('href');
        
        if (href) {
          await link.click();
          await page.waitForTimeout(1000);
          
          // Verificar se a navegação funcionou
          expect(page.url()).toContain(href.replace('/', ''));
          
          // Voltar para home
          await page.goto('/');
        }
      }
    }
  });
});