import { Page, Locator } from '@playwright/test';

export class ServicesPage {
  readonly page: Page;
  readonly servicesList: Locator;
  readonly categoriesList: Locator;
  readonly createButton: Locator;
  readonly createCategoryButton: Locator;
  readonly modal: Locator;

  constructor(page: Page) {
    this.page = page;
    this.servicesList = page.locator('[data-testid="services-list"]');
    this.categoriesList = page.locator('[data-testid="categories-list"]');
    this.createButton = page.getByRole('button', { name: /novo serviço/i });
    this.createCategoryButton = page.getByRole('button', { name: /nova categoria/i });
    this.modal = page.locator('[data-testid="service-modal"]');
  }

  async goto() {
    await this.page.goto('/dashboard/servicos');
  }

  async createService(data: {
    name: string;
    description?: string;
    duration: number;
    price: number;
    category?: string;
  }) {
    await this.createButton.click();
    await this.modal.waitFor({ state: 'visible' });

    await this.page.getByLabel(/nome/i).fill(data.name);
    
    if (data.description) {
      await this.page.getByLabel(/descrição/i).fill(data.description);
    }

    await this.page.getByLabel(/duração/i).fill(data.duration.toString());
    await this.page.getByLabel(/preço/i).fill((data.price / 100).toFixed(2));

    if (data.category) {
      await this.page.getByLabel(/categoria/i).selectOption({ label: data.category });
    }

    await this.page.getByRole('button', { name: /salvar/i }).click();
    await this.modal.waitFor({ state: 'hidden' });
  }

  async createCategory(name: string, description?: string) {
    await this.createCategoryButton.click();
    await this.modal.waitFor({ state: 'visible' });

    await this.page.getByLabel(/nome/i).fill(name);
    
    if (description) {
      await this.page.getByLabel(/descrição/i).fill(description);
    }

    await this.page.getByRole('button', { name: /salvar/i }).click();
    await this.modal.waitFor({ state: 'hidden' });
  }

  async editService(serviceName: string, data: Partial<{
    name: string;
    duration: number;
    price: number;
  }>) {
    await this.servicesList.getByText(serviceName).click();
    await this.page.getByRole('button', { name: /editar/i }).click();
    await this.modal.waitFor({ state: 'visible' });

    if (data.name) {
      await this.page.getByLabel(/nome/i).clear();
      await this.page.getByLabel(/nome/i).fill(data.name);
    }

    if (data.duration) {
      await this.page.getByLabel(/duração/i).clear();
      await this.page.getByLabel(/duração/i).fill(data.duration.toString());
    }

    if (data.price) {
      await this.page.getByLabel(/preço/i).clear();
      await this.page.getByLabel(/preço/i).fill((data.price / 100).toFixed(2));
    }

    await this.page.getByRole('button', { name: /salvar/i }).click();
    await this.modal.waitFor({ state: 'hidden' });
  }

  async deleteService(serviceName: string) {
    await this.servicesList.getByText(serviceName).click();
    await this.page.getByRole('button', { name: /excluir/i }).click();
    await this.page.getByRole('button', { name: /confirmar/i }).click();
  }

  async toggleServiceStatus(serviceName: string) {
    const serviceCard = this.servicesList.locator(`[data-testid="service-card"]:has-text("${serviceName}")`);
    await serviceCard.getByRole('switch').click();
  }

  async getServiceCount(): Promise<number> {
    const count = await this.servicesList.locator('[data-testid="service-card"]').count();
    return count;
  }
}
