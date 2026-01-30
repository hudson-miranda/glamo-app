import { test, expect, testData } from '../fixtures';

test.describe('Dashboard', () => {
  test.beforeEach(async ({ authPage, dashboardPage }) => {
    await authPage.goto();
    await authPage.login(testData.owner.email, testData.owner.password);
    await authPage.expectLoginSuccess();
  });

  test('should display dashboard correctly', async ({ dashboardPage, page }) => {
    await dashboardPage.goto();
    await dashboardPage.waitForDataLoad();

    // Verificar elementos principais
    await expect(dashboardPage.sidebar).toBeVisible();
    await expect(dashboardPage.header).toBeVisible();
    await expect(dashboardPage.statsCards.first()).toBeVisible();
  });

  test('should display stats cards with data', async ({ dashboardPage }) => {
    await dashboardPage.goto();
    await dashboardPage.waitForDataLoad();

    // Verificar que os cards de estatísticas estão visíveis
    const cardsCount = await dashboardPage.statsCards.count();
    expect(cardsCount).toBeGreaterThan(0);
  });

  test('should navigate to appointments page', async ({ dashboardPage, page }) => {
    await dashboardPage.goto();
    await dashboardPage.navigateTo('Agenda');
    
    await expect(page).toHaveURL(/agenda/);
  });

  test('should navigate to customers page', async ({ dashboardPage, page }) => {
    await dashboardPage.goto();
    await dashboardPage.navigateTo('Clientes');
    
    await expect(page).toHaveURL(/clientes/);
  });

  test('should navigate to services page', async ({ dashboardPage, page }) => {
    await dashboardPage.goto();
    await dashboardPage.navigateTo('Serviços');
    
    await expect(page).toHaveURL(/servicos/);
  });

  test('should navigate to professionals page', async ({ dashboardPage, page }) => {
    await dashboardPage.goto();
    await dashboardPage.navigateTo('Profissionais');
    
    await expect(page).toHaveURL(/profissionais/);
  });

  test('should navigate to financial page', async ({ dashboardPage, page }) => {
    await dashboardPage.goto();
    await dashboardPage.navigateTo('Financeiro');
    
    await expect(page).toHaveURL(/financeiro/);
  });

  test('should toggle sidebar collapse', async ({ dashboardPage, page }) => {
    await dashboardPage.goto();

    const collapseButton = page.locator('[data-testid="sidebar-collapse"]');
    await collapseButton.click();

    // Verificar que sidebar está colapsada
    await expect(dashboardPage.sidebar).toHaveClass(/collapsed/);

    // Expandir novamente
    await collapseButton.click();
    await expect(dashboardPage.sidebar).not.toHaveClass(/collapsed/);
  });

  test('should display user menu', async ({ dashboardPage, page }) => {
    await dashboardPage.goto();
    await dashboardPage.openUserMenu();

    await expect(page.getByText(/meu perfil/i)).toBeVisible();
    await expect(page.getByText(/configurações/i)).toBeVisible();
    await expect(page.getByText(/sair/i)).toBeVisible();
  });

  test('should switch between dark and light theme', async ({ dashboardPage, page }) => {
    await dashboardPage.goto();

    const themeToggle = page.locator('[data-testid="theme-toggle"]');
    await themeToggle.click();

    // Verificar tema escuro
    await expect(page.locator('html')).toHaveClass(/dark/);

    // Voltar para tema claro
    await themeToggle.click();
    await expect(page.locator('html')).not.toHaveClass(/dark/);
  });
});
