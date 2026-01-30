import { Page, Locator } from '@playwright/test';

export class CustomersPage {
  readonly page: Page;
  readonly customersList: Locator;
  readonly createButton: Locator;
  readonly searchInput: Locator;
  readonly modal: Locator;
  readonly customerDetail: Locator;

  constructor(page: Page) {
    this.page = page;
    this.customersList = page.locator('[data-testid="customers-list"]');
    this.createButton = page.getByRole('button', { name: /novo cliente/i });
    this.searchInput = page.getByPlaceholder(/buscar/i);
    this.modal = page.locator('[data-testid="customer-modal"]');
    this.customerDetail = page.locator('[data-testid="customer-detail"]');
  }

  async goto() {
    await this.page.goto('/dashboard/clientes');
  }

  async createCustomer(data: {
    name: string;
    email: string;
    phone: string;
    birthDate?: string;
    notes?: string;
  }) {
    await this.createButton.click();
    await this.modal.waitFor({ state: 'visible' });

    await this.page.getByLabel(/nome/i).fill(data.name);
    await this.page.getByLabel(/email/i).fill(data.email);
    await this.page.getByLabel(/telefone/i).fill(data.phone);

    if (data.birthDate) {
      await this.page.getByLabel(/data de nascimento/i).fill(data.birthDate);
    }

    if (data.notes) {
      await this.page.getByLabel(/observações/i).fill(data.notes);
    }

    await this.page.getByRole('button', { name: /salvar/i }).click();
    await this.modal.waitFor({ state: 'hidden' });
  }

  async searchCustomer(query: string) {
    await this.searchInput.fill(query);
    await this.page.keyboard.press('Enter');
    await this.page.waitForLoadState('networkidle');
  }

  async openCustomerDetail(name: string) {
    await this.customersList.getByText(name).click();
    await this.customerDetail.waitFor({ state: 'visible' });
  }

  async editCustomer(data: Partial<{
    name: string;
    email: string;
    phone: string;
  }>) {
    await this.page.getByRole('button', { name: /editar/i }).click();
    await this.modal.waitFor({ state: 'visible' });

    if (data.name) {
      await this.page.getByLabel(/nome/i).clear();
      await this.page.getByLabel(/nome/i).fill(data.name);
    }

    if (data.email) {
      await this.page.getByLabel(/email/i).clear();
      await this.page.getByLabel(/email/i).fill(data.email);
    }

    if (data.phone) {
      await this.page.getByLabel(/telefone/i).clear();
      await this.page.getByLabel(/telefone/i).fill(data.phone);
    }

    await this.page.getByRole('button', { name: /salvar/i }).click();
    await this.modal.waitFor({ state: 'hidden' });
  }

  async deleteCustomer(name: string) {
    await this.openCustomerDetail(name);
    await this.page.getByRole('button', { name: /excluir/i }).click();
    await this.page.getByRole('button', { name: /confirmar/i }).click();
  }

  async getCustomerCount(): Promise<number> {
    const count = await this.customersList.locator('[data-testid="customer-card"]').count();
    return count;
  }
}
