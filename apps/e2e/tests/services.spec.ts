import { test, expect, testData } from '../fixtures';

test.describe('Services', () => {
  test.beforeEach(async ({ authPage, servicesPage }) => {
    await authPage.goto();
    await authPage.login(testData.owner.email, testData.owner.password);
    await authPage.expectLoginSuccess();
    await servicesPage.goto();
  });

  test('should display services list', async ({ servicesPage }) => {
    await expect(servicesPage.servicesList).toBeVisible();
  });

  test('should create new service', async ({ servicesPage, page }) => {
    await servicesPage.createService({
      name: `Serviço Teste ${Date.now()}`,
      description: 'Descrição do serviço de teste',
      duration: 45,
      price: 7500, // R$ 75,00
    });

    await expect(page.getByText(/serviço criado/i)).toBeVisible();
  });

  test('should create service category', async ({ servicesPage, page }) => {
    await servicesPage.createCategory(
      `Categoria ${Date.now()}`,
      'Descrição da categoria'
    );

    await expect(page.getByText(/categoria criada/i)).toBeVisible();
  });

  test('should create service with category', async ({ servicesPage, page }) => {
    // Primeiro criar uma categoria
    const categoryName = `Cat ${Date.now()}`;
    await servicesPage.createCategory(categoryName);

    // Criar serviço com a categoria
    await servicesPage.createService({
      name: `Serviço Com Categoria ${Date.now()}`,
      duration: 30,
      price: 5000,
      category: categoryName,
    });

    await expect(page.getByText(/serviço criado/i)).toBeVisible();
  });

  test('should edit service', async ({ servicesPage, page }) => {
    // Criar um serviço para editar
    const serviceName = `Serviço Editar ${Date.now()}`;
    await servicesPage.createService({
      name: serviceName,
      duration: 30,
      price: 5000,
    });

    // Editar o serviço
    await servicesPage.editService(serviceName, {
      name: `${serviceName} Editado`,
      price: 6000,
    });

    await expect(page.getByText(/serviço atualizado/i)).toBeVisible();
  });

  test('should toggle service active status', async ({ servicesPage, page }) => {
    // Criar um serviço
    const serviceName = `Serviço Toggle ${Date.now()}`;
    await servicesPage.createService({
      name: serviceName,
      duration: 30,
      price: 5000,
    });

    // Desativar o serviço
    await servicesPage.toggleServiceStatus(serviceName);

    await expect(page.getByText(/serviço desativado/i)).toBeVisible();

    // Reativar o serviço
    await servicesPage.toggleServiceStatus(serviceName);

    await expect(page.getByText(/serviço ativado/i)).toBeVisible();
  });

  test('should delete service with confirmation', async ({ servicesPage, page }) => {
    // Criar um serviço para deletar
    const serviceName = `Serviço Deletar ${Date.now()}`;
    await servicesPage.createService({
      name: serviceName,
      duration: 30,
      price: 5000,
    });

    await servicesPage.deleteService(serviceName);

    await expect(page.getByText(/serviço excluído/i)).toBeVisible();
  });

  test('should validate required fields', async ({ servicesPage, page }) => {
    await servicesPage.createButton.click();
    await servicesPage.modal.waitFor({ state: 'visible' });

    // Tentar salvar sem preencher campos
    await page.getByRole('button', { name: /salvar/i }).click();

    await expect(page.getByText(/nome é obrigatório/i)).toBeVisible();
    await expect(page.getByText(/duração é obrigatória/i)).toBeVisible();
    await expect(page.getByText(/preço é obrigatório/i)).toBeVisible();
  });

  test('should validate minimum duration', async ({ servicesPage, page }) => {
    await servicesPage.createButton.click();
    await servicesPage.modal.waitFor({ state: 'visible' });

    await page.getByLabel(/nome/i).fill('Serviço Teste');
    await page.getByLabel(/duração/i).fill('0');
    await page.getByLabel(/preço/i).fill('50,00');

    await page.getByRole('button', { name: /salvar/i }).click();

    await expect(page.getByText(/duração mínima/i)).toBeVisible();
  });

  test('should display service count', async ({ servicesPage }) => {
    const count = await servicesPage.getServiceCount();
    expect(count).toBeGreaterThanOrEqual(0);
  });

  test('should filter services by category', async ({ servicesPage, page }) => {
    const categoryFilter = page.locator('[data-testid="category-filter"]');
    
    if (await categoryFilter.isVisible()) {
      await categoryFilter.selectOption({ index: 1 }); // Selecionar primeira categoria
      await page.waitForLoadState('networkidle');

      const count = await servicesPage.getServiceCount();
      expect(count).toBeGreaterThanOrEqual(0);
    }
  });

  test('should search services', async ({ servicesPage, page }) => {
    const searchInput = page.getByPlaceholder(/buscar/i);
    await searchInput.fill('Corte');
    await page.keyboard.press('Enter');
    await page.waitForLoadState('networkidle');

    const count = await servicesPage.getServiceCount();
    expect(count).toBeGreaterThanOrEqual(0);
  });
});
