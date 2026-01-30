import { test, expect, testData } from '../fixtures';

test.describe('Appointments', () => {
  test.beforeEach(async ({ authPage, appointmentsPage }) => {
    await authPage.goto();
    await authPage.login(testData.owner.email, testData.owner.password);
    await authPage.expectLoginSuccess();
    await appointmentsPage.goto();
  });

  test('should display appointments calendar', async ({ appointmentsPage }) => {
    await expect(appointmentsPage.calendar).toBeVisible();
  });

  test('should display appointments list', async ({ appointmentsPage }) => {
    await expect(appointmentsPage.appointmentsList).toBeVisible();
  });

  test('should create new appointment', async ({ appointmentsPage, page }) => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);

    await appointmentsPage.createAppointment({
      customer: testData.customer.name,
      service: testData.service.name,
      professional: 'Profissional Teste',
      date: tomorrow,
      time: '10:00',
    });

    // Verificar que o agendamento foi criado
    await expect(page.getByText(/agendamento criado/i)).toBeVisible();
  });

  test('should filter appointments by status', async ({ appointmentsPage }) => {
    await appointmentsPage.filterByStatus('confirmed');
    
    // Aguardar atualização da lista
    await appointmentsPage.page.waitForLoadState('networkidle');

    // Verificar que apenas agendamentos confirmados são exibidos
    const cards = appointmentsPage.appointmentsList.locator('[data-testid="appointment-card"]');
    const count = await cards.count();

    for (let i = 0; i < count; i++) {
      await expect(cards.nth(i)).toContainText(/confirmado/i);
    }
  });

  test('should search appointments by customer name', async ({ appointmentsPage }) => {
    await appointmentsPage.searchAppointment(testData.customer.name);

    const cards = appointmentsPage.appointmentsList.locator('[data-testid="appointment-card"]');
    const count = await cards.count();

    for (let i = 0; i < count; i++) {
      await expect(cards.nth(i)).toContainText(testData.customer.name);
    }
  });

  test('should confirm appointment', async ({ appointmentsPage, page }) => {
    // Primeiro criar um agendamento
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);

    await appointmentsPage.createAppointment({
      customer: 'Cliente Confirmação',
      service: testData.service.name,
      professional: 'Profissional Teste',
      date: tomorrow,
      time: '11:00',
    });

    // Confirmar o agendamento
    await appointmentsPage.confirmAppointment('Cliente Confirmação');

    await expect(page.getByText(/agendamento confirmado/i)).toBeVisible();
  });

  test('should cancel appointment with reason', async ({ appointmentsPage, page }) => {
    // Primeiro criar um agendamento
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);

    await appointmentsPage.createAppointment({
      customer: 'Cliente Cancelamento',
      service: testData.service.name,
      professional: 'Profissional Teste',
      date: tomorrow,
      time: '12:00',
    });

    // Cancelar o agendamento
    await appointmentsPage.cancelAppointment('Cliente Cancelamento', 'Cliente solicitou cancelamento');

    await expect(page.getByText(/agendamento cancelado/i)).toBeVisible();
  });

  test('should complete appointment', async ({ appointmentsPage, page }) => {
    // Buscar um agendamento confirmado
    await appointmentsPage.filterByStatus('confirmed');
    
    const firstCard = appointmentsPage.appointmentsList.locator('[data-testid="appointment-card"]').first();
    const customerName = await firstCard.locator('[data-testid="customer-name"]').textContent();

    if (customerName) {
      await appointmentsPage.completeAppointment(customerName);
      await expect(page.getByText(/agendamento concluído/i)).toBeVisible();
    }
  });

  test('should navigate between weeks in calendar', async ({ appointmentsPage, page }) => {
    const nextWeekButton = page.locator('[data-testid="next-week"]');
    const prevWeekButton = page.locator('[data-testid="prev-week"]');

    // Navegar para próxima semana
    await nextWeekButton.click();
    await page.waitForLoadState('networkidle');

    // Navegar para semana anterior
    await prevWeekButton.click();
    await page.waitForLoadState('networkidle');
  });

  test('should show appointment details on click', async ({ appointmentsPage, page }) => {
    const firstCard = appointmentsPage.appointmentsList.locator('[data-testid="appointment-card"]').first();
    
    if (await firstCard.isVisible()) {
      await firstCard.click();

      // Verificar modal de detalhes
      await expect(appointmentsPage.modal).toBeVisible();
      await expect(page.getByText(/detalhes do agendamento/i)).toBeVisible();
    }
  });
});
