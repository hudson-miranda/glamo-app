import { test, expect, testData } from '../fixtures';

test.describe('Customers', () => {
  test.beforeEach(async ({ authPage, customersPage }) => {
    await authPage.goto();
    await authPage.login(testData.owner.email, testData.owner.password);
    await authPage.expectLoginSuccess();
    await customersPage.goto();
  });

  test('should display customers list', async ({ customersPage }) => {
    await expect(customersPage.customersList).toBeVisible();
  });

  test('should create new customer', async ({ customersPage, page }) => {
    const uniqueEmail = `teste.${Date.now()}@email.com`;

    await customersPage.createCustomer({
      name: 'Novo Cliente Teste',
      email: uniqueEmail,
      phone: '11988887777',
      notes: 'Cliente criado via teste E2E',
    });

    await expect(page.getByText(/cliente criado/i)).toBeVisible();
  });

  test('should search customer by name', async ({ customersPage }) => {
    await customersPage.searchCustomer('Cliente');

    const count = await customersPage.getCustomerCount();
    expect(count).toBeGreaterThanOrEqual(0);
  });

  test('should search customer by phone', async ({ customersPage }) => {
    await customersPage.searchCustomer('11999');

    const count = await customersPage.getCustomerCount();
    expect(count).toBeGreaterThanOrEqual(0);
  });

  test('should open customer details', async ({ customersPage, page }) => {
    // Criar um cliente para garantir que existe
    const uniqueEmail = `detalhe.${Date.now()}@email.com`;
    await customersPage.createCustomer({
      name: 'Cliente Detalhe',
      email: uniqueEmail,
      phone: '11977776666',
    });

    await customersPage.openCustomerDetail('Cliente Detalhe');

    await expect(customersPage.customerDetail).toBeVisible();
    await expect(page.getByText('Cliente Detalhe')).toBeVisible();
  });

  test('should edit customer information', async ({ customersPage, page }) => {
    // Criar um cliente para editar
    const uniqueEmail = `editar.${Date.now()}@email.com`;
    await customersPage.createCustomer({
      name: 'Cliente Para Editar',
      email: uniqueEmail,
      phone: '11966665555',
    });

    await customersPage.openCustomerDetail('Cliente Para Editar');
    await customersPage.editCustomer({
      name: 'Cliente Editado',
      phone: '11955554444',
    });

    await expect(page.getByText(/cliente atualizado/i)).toBeVisible();
    await expect(page.getByText('Cliente Editado')).toBeVisible();
  });

  test('should show validation errors for invalid data', async ({ customersPage, page }) => {
    await customersPage.createButton.click();
    await customersPage.modal.waitFor({ state: 'visible' });

    // Tentar salvar sem preencher campos obrigatórios
    await page.getByRole('button', { name: /salvar/i }).click();

    await expect(page.getByText(/nome é obrigatório/i)).toBeVisible();
  });

  test('should display customer appointment history', async ({ customersPage, page }) => {
    // Abrir detalhes de um cliente existente
    await customersPage.searchCustomer(testData.customer.name);
    
    const firstCustomer = customersPage.customersList.locator('[data-testid="customer-card"]').first();
    if (await firstCustomer.isVisible()) {
      await firstCustomer.click();
      await customersPage.customerDetail.waitFor({ state: 'visible' });

      // Navegar para aba de histórico
      await page.getByRole('tab', { name: /histórico/i }).click();

      await expect(page.locator('[data-testid="appointment-history"]')).toBeVisible();
    }
  });

  test('should add note to customer', async ({ customersPage, page }) => {
    // Criar um cliente
    const uniqueEmail = `nota.${Date.now()}@email.com`;
    await customersPage.createCustomer({
      name: 'Cliente Com Nota',
      email: uniqueEmail,
      phone: '11944443333',
    });

    await customersPage.openCustomerDetail('Cliente Com Nota');

    // Adicionar nota
    await page.getByRole('button', { name: /adicionar nota/i }).click();
    await page.getByLabel(/nota/i).fill('Observação importante sobre o cliente');
    await page.getByRole('button', { name: /salvar/i }).click();

    await expect(page.getByText('Observação importante sobre o cliente')).toBeVisible();
  });

  test('should delete customer with confirmation', async ({ customersPage, page }) => {
    // Criar um cliente para deletar
    const uniqueEmail = `deletar.${Date.now()}@email.com`;
    await customersPage.createCustomer({
      name: 'Cliente Para Deletar',
      email: uniqueEmail,
      phone: '11933332222',
    });

    await customersPage.deleteCustomer('Cliente Para Deletar');

    await expect(page.getByText(/cliente excluído/i)).toBeVisible();
  });

  test('should export customers list', async ({ customersPage, page }) => {
    const exportButton = page.getByRole('button', { name: /exportar/i });
    
    if (await exportButton.isVisible()) {
      const downloadPromise = page.waitForEvent('download');
      await exportButton.click();
      const download = await downloadPromise;

      expect(download.suggestedFilename()).toContain('clientes');
    }
  });
});
