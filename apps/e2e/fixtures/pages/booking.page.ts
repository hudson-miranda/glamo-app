import { Page, Locator } from '@playwright/test';

export class BookingPage {
  readonly page: Page;
  readonly servicesList: Locator;
  readonly professionalsList: Locator;
  readonly calendar: Locator;
  readonly timeSlots: Locator;
  readonly customerForm: Locator;
  readonly submitButton: Locator;
  readonly successMessage: Locator;
  readonly progressSteps: Locator;

  constructor(page: Page) {
    this.page = page;
    this.servicesList = page.locator('[data-testid="services-list"]');
    this.professionalsList = page.locator('[data-testid="professionals-list"]');
    this.calendar = page.locator('[data-testid="calendar"]');
    this.timeSlots = page.locator('[data-testid="time-slots"]');
    this.customerForm = page.locator('[data-testid="customer-form"]');
    this.submitButton = page.getByRole('button', { name: /confirmar agendamento/i });
    this.successMessage = page.locator('[data-testid="success-message"]');
    this.progressSteps = page.locator('[data-testid="progress-steps"]');
  }

  async goto(tenantSlug: string) {
    await this.page.goto(`/${tenantSlug}`);
  }

  async selectService(serviceName: string) {
    await this.servicesList.getByText(serviceName).click();
  }

  async selectMultipleServices(serviceNames: string[]) {
    for (const name of serviceNames) {
      await this.selectService(name);
    }
  }

  async continueToNext() {
    await this.page.getByRole('button', { name: /continuar/i }).click();
  }

  async selectProfessional(professionalName: string) {
    await this.professionalsList.getByText(professionalName).click();
  }

  async selectAnyProfessional() {
    await this.professionalsList.getByText(/sem preferência/i).click();
  }

  async selectDate(date: Date) {
    const day = date.getDate().toString();
    await this.calendar.getByText(day, { exact: true }).click();
  }

  async selectTime(time: string) {
    await this.timeSlots.getByText(time, { exact: true }).click();
  }

  async fillCustomerInfo(data: {
    name: string;
    email: string;
    phone: string;
    notes?: string;
  }) {
    await this.page.getByLabel(/nome completo/i).fill(data.name);
    await this.page.getByLabel(/email/i).fill(data.email);
    await this.page.getByLabel(/telefone/i).fill(data.phone);

    if (data.notes) {
      await this.page.getByLabel(/observações/i).fill(data.notes);
    }
  }

  async confirmBooking() {
    await this.submitButton.click();
  }

  async waitForSuccess() {
    await this.successMessage.waitFor({ state: 'visible', timeout: 10000 });
  }

  async getConfirmationCode(): Promise<string> {
    const codeElement = this.page.locator('[data-testid="confirmation-code"]');
    const code = await codeElement.textContent();
    return code || '';
  }

  async completeBookingFlow(data: {
    tenantSlug: string;
    services: string[];
    professional?: string;
    date: Date;
    time: string;
    customer: {
      name: string;
      email: string;
      phone: string;
    };
  }) {
    // Ir para página de booking
    await this.goto(data.tenantSlug);

    // Selecionar serviços
    await this.selectMultipleServices(data.services);
    await this.continueToNext();

    // Selecionar profissional
    if (data.professional) {
      await this.selectProfessional(data.professional);
    } else {
      await this.selectAnyProfessional();
    }
    await this.continueToNext();

    // Selecionar data e hora
    await this.selectDate(data.date);
    await this.selectTime(data.time);
    await this.continueToNext();

    // Preencher dados do cliente
    await this.fillCustomerInfo(data.customer);

    // Confirmar
    await this.confirmBooking();
    await this.waitForSuccess();
  }

  async addToCalendar() {
    await this.page.getByRole('button', { name: /adicionar ao calendário/i }).click();
  }

  async shareBooking() {
    await this.page.getByRole('button', { name: /compartilhar/i }).click();
  }
}
