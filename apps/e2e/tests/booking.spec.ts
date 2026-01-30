import { test, expect, testData } from '../fixtures';

test.describe('Public Booking Flow', () => {
  const tenantSlug = testData.tenant.slug;

  test('should display booking page for valid tenant', async ({ bookingPage }) => {
    await bookingPage.goto(tenantSlug);

    await expect(bookingPage.servicesList).toBeVisible();
    await expect(bookingPage.progressSteps).toBeVisible();
  });

  test('should show error for invalid tenant', async ({ page }) => {
    await page.goto('/invalid-tenant-slug');

    await expect(page.getByText(/salão não encontrado/i)).toBeVisible();
  });

  test('should display available services', async ({ bookingPage }) => {
    await bookingPage.goto(tenantSlug);

    const servicesCount = await bookingPage.servicesList.locator('[data-testid="service-card"]').count();
    expect(servicesCount).toBeGreaterThan(0);
  });

  test('should select single service and continue', async ({ bookingPage, page }) => {
    await bookingPage.goto(tenantSlug);

    await bookingPage.selectService('Corte de Cabelo');
    await bookingPage.continueToNext();

    // Deve estar na etapa de profissional
    await expect(bookingPage.professionalsList).toBeVisible();
  });

  test('should select multiple services', async ({ bookingPage }) => {
    await bookingPage.goto(tenantSlug);

    await bookingPage.selectMultipleServices(['Corte de Cabelo', 'Barba']);

    // Verificar que ambos estão selecionados
    const selectedServices = bookingPage.servicesList.locator('[data-testid="service-card"].selected');
    expect(await selectedServices.count()).toBe(2);
  });

  test('should select professional', async ({ bookingPage, page }) => {
    await bookingPage.goto(tenantSlug);

    await bookingPage.selectService('Corte de Cabelo');
    await bookingPage.continueToNext();

    // Selecionar profissional específico
    await bookingPage.selectProfessional('Profissional Teste');
    await bookingPage.continueToNext();

    // Deve estar na etapa de data/hora
    await expect(bookingPage.calendar).toBeVisible();
  });

  test('should select "any professional" option', async ({ bookingPage }) => {
    await bookingPage.goto(tenantSlug);

    await bookingPage.selectService('Corte de Cabelo');
    await bookingPage.continueToNext();

    await bookingPage.selectAnyProfessional();
    await bookingPage.continueToNext();

    await expect(bookingPage.calendar).toBeVisible();
  });

  test('should display available time slots', async ({ bookingPage }) => {
    await bookingPage.goto(tenantSlug);

    await bookingPage.selectService('Corte de Cabelo');
    await bookingPage.continueToNext();

    await bookingPage.selectAnyProfessional();
    await bookingPage.continueToNext();

    // Selecionar uma data futura
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    await bookingPage.selectDate(tomorrow);

    // Verificar que há horários disponíveis
    await expect(bookingPage.timeSlots).toBeVisible();
  });

  test('should not allow past dates', async ({ bookingPage, page }) => {
    await bookingPage.goto(tenantSlug);

    await bookingPage.selectService('Corte de Cabelo');
    await bookingPage.continueToNext();

    await bookingPage.selectAnyProfessional();
    await bookingPage.continueToNext();

    // Tentar selecionar data passada
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);

    const dayButton = bookingPage.calendar.getByText(yesterday.getDate().toString(), { exact: true });
    await expect(dayButton).toBeDisabled();
  });

  test('should complete full booking flow', async ({ bookingPage, page }) => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);

    await bookingPage.completeBookingFlow({
      tenantSlug,
      services: ['Corte de Cabelo'],
      date: tomorrow,
      time: '10:00',
      customer: {
        name: 'Cliente E2E Teste',
        email: `teste.${Date.now()}@email.com`,
        phone: '11999998888',
      },
    });

    // Verificar sucesso
    await expect(bookingPage.successMessage).toBeVisible();
    await expect(page.getByText(/agendamento confirmado/i)).toBeVisible();
  });

  test('should display confirmation code after booking', async ({ bookingPage }) => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);

    await bookingPage.completeBookingFlow({
      tenantSlug,
      services: ['Corte de Cabelo'],
      date: tomorrow,
      time: '11:00',
      customer: {
        name: 'Cliente Código',
        email: `codigo.${Date.now()}@email.com`,
        phone: '11988887777',
      },
    });

    const code = await bookingPage.getConfirmationCode();
    expect(code).not.toBe('');
  });

  test('should validate customer form', async ({ bookingPage, page }) => {
    await bookingPage.goto(tenantSlug);

    await bookingPage.selectService('Corte de Cabelo');
    await bookingPage.continueToNext();

    await bookingPage.selectAnyProfessional();
    await bookingPage.continueToNext();

    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    await bookingPage.selectDate(tomorrow);
    await bookingPage.selectTime('14:00');
    await bookingPage.continueToNext();

    // Tentar confirmar sem preencher dados
    await bookingPage.confirmBooking();

    await expect(page.getByText(/nome.*obrigatório/i)).toBeVisible();
    await expect(page.getByText(/email.*inválido/i)).toBeVisible();
    await expect(page.getByText(/telefone.*inválido/i)).toBeVisible();
  });

  test('should show booking summary before confirmation', async ({ bookingPage, page }) => {
    await bookingPage.goto(tenantSlug);

    await bookingPage.selectService('Corte de Cabelo');
    await bookingPage.continueToNext();

    await bookingPage.selectAnyProfessional();
    await bookingPage.continueToNext();

    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    await bookingPage.selectDate(tomorrow);
    await bookingPage.selectTime('15:00');
    await bookingPage.continueToNext();

    // Verificar resumo
    await expect(page.getByText(/resumo/i)).toBeVisible();
    await expect(page.getByText('Corte de Cabelo')).toBeVisible();
  });

  test('should allow adding notes to booking', async ({ bookingPage, page }) => {
    await bookingPage.goto(tenantSlug);

    await bookingPage.selectService('Corte de Cabelo');
    await bookingPage.continueToNext();

    await bookingPage.selectAnyProfessional();
    await bookingPage.continueToNext();

    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    await bookingPage.selectDate(tomorrow);
    await bookingPage.selectTime('16:00');
    await bookingPage.continueToNext();

    await bookingPage.fillCustomerInfo({
      name: 'Cliente Nota',
      email: `nota.${Date.now()}@email.com`,
      phone: '11977776666',
      notes: 'Tenho alergia a alguns produtos',
    });

    await bookingPage.confirmBooking();
    await bookingPage.waitForSuccess();
  });

  test('should navigate back through steps', async ({ bookingPage }) => {
    await bookingPage.goto(tenantSlug);

    await bookingPage.selectService('Corte de Cabelo');
    await bookingPage.continueToNext();

    // Voltar para serviços
    await bookingPage.page.getByRole('button', { name: /voltar/i }).click();

    await expect(bookingPage.servicesList).toBeVisible();
  });

  test('should handle add to calendar action', async ({ bookingPage, page }) => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);

    await bookingPage.completeBookingFlow({
      tenantSlug,
      services: ['Corte de Cabelo'],
      date: tomorrow,
      time: '17:00',
      customer: {
        name: 'Cliente Calendário',
        email: `calendario.${Date.now()}@email.com`,
        phone: '11966665555',
      },
    });

    // Tentar adicionar ao calendário
    const popupPromise = page.waitForEvent('popup');
    await bookingPage.addToCalendar();
    const popup = await popupPromise;

    // Verificar que abriu link do Google Calendar
    expect(popup.url()).toContain('calendar.google.com');
    await popup.close();
  });
});
