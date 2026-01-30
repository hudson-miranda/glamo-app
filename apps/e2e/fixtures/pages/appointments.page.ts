import { Page, Locator } from '@playwright/test';

export class AppointmentsPage {
  readonly page: Page;
  readonly calendar: Locator;
  readonly appointmentsList: Locator;
  readonly createButton: Locator;
  readonly filterStatus: Locator;
  readonly searchInput: Locator;
  readonly modal: Locator;

  constructor(page: Page) {
    this.page = page;
    this.calendar = page.locator('[data-testid="calendar"]');
    this.appointmentsList = page.locator('[data-testid="appointments-list"]');
    this.createButton = page.getByRole('button', { name: /novo agendamento/i });
    this.filterStatus = page.locator('[data-testid="filter-status"]');
    this.searchInput = page.getByPlaceholder(/buscar/i);
    this.modal = page.locator('[data-testid="appointment-modal"]');
  }

  async goto() {
    await this.page.goto('/dashboard/agenda');
  }

  async selectDate(date: Date) {
    const day = date.getDate().toString();
    await this.calendar.getByText(day, { exact: true }).click();
  }

  async createAppointment(data: {
    customer: string;
    service: string;
    professional: string;
    date: Date;
    time: string;
  }) {
    await this.createButton.click();
    await this.modal.waitFor({ state: 'visible' });

    // Preencher formulário
    await this.page.getByLabel(/cliente/i).fill(data.customer);
    await this.page.getByLabel(/serviço/i).selectOption({ label: data.service });
    await this.page.getByLabel(/profissional/i).selectOption({ label: data.professional });
    await this.page.getByLabel(/horário/i).fill(data.time);

    await this.page.getByRole('button', { name: /salvar/i }).click();
    await this.modal.waitFor({ state: 'hidden' });
  }

  async filterByStatus(status: string) {
    await this.filterStatus.selectOption(status);
  }

  async searchAppointment(query: string) {
    await this.searchInput.fill(query);
    await this.page.keyboard.press('Enter');
  }

  async getAppointmentCard(customerName: string): Promise<Locator> {
    return this.appointmentsList.locator(`[data-testid="appointment-card"]:has-text("${customerName}")`);
  }

  async confirmAppointment(customerName: string) {
    const card = await this.getAppointmentCard(customerName);
    await card.getByRole('button', { name: /confirmar/i }).click();
  }

  async cancelAppointment(customerName: string, reason?: string) {
    const card = await this.getAppointmentCard(customerName);
    await card.getByRole('button', { name: /cancelar/i }).click();

    if (reason) {
      await this.page.getByLabel(/motivo/i).fill(reason);
    }

    await this.page.getByRole('button', { name: /confirmar cancelamento/i }).click();
  }

  async completeAppointment(customerName: string) {
    const card = await this.getAppointmentCard(customerName);
    await card.getByRole('button', { name: /concluir/i }).click();
  }
}
