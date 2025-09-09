import { defineConfig, devices } from '@playwright/test';

/**
 * Configuração do Playwright para testes E2E da plataforma ZipFood
 * Marketplace de delivery com três tipos de usuário: cliente, restaurante, entregador
 */
export default defineConfig({
  testDir: './tests',
  /* Executar testes em paralelo */
  fullyParallel: true,
  /* Falhar build se houver testes sem retry */
  forbidOnly: !!process.env.CI,
  /* Retry nos testes que falharam */
  retries: process.env.CI ? 2 : 0,
  /* Opt out of parallel tests on CI */
  workers: process.env.CI ? 1 : undefined,
  /* Reporter para usar */
  reporter: 'html',
  /* Configurações compartilhadas para todos os projetos */
  use: {
    /* URL base para usar em actions como `await page.goto('/')` */
    baseURL: 'http://localhost:3000',

    /* Coletar trace quando retry de teste falhar */
    trace: 'on-first-retry',
    
    /* Screenshot apenas quando falhar */
    screenshot: 'only-on-failure',
    
    /* Video apenas quando falhar */
    video: 'retain-on-failure',
  },

  /* Configurar projetos para principais browsers */
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },

    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },

    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },

    /* Testes em dispositivos móveis */
    {
      name: 'Mobile Chrome',
      use: { ...devices['Pixel 5'] },
    },
    {
      name: 'Mobile Safari',
      use: { ...devices['iPhone 12'] },
    },
  ],

  /* Executar servidor de desenvolvimento local antes de iniciar os testes */
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 120 * 1000,
  },
});