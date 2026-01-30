import { test, expect, testData } from '../fixtures';

test.describe('Authentication', () => {
  test.beforeEach(async ({ authPage }) => {
    await authPage.goto();
  });

  test('should display login page correctly', async ({ authPage }) => {
    await expect(authPage.emailInput).toBeVisible();
    await expect(authPage.passwordInput).toBeVisible();
    await expect(authPage.submitButton).toBeVisible();
    await expect(authPage.forgotPasswordLink).toBeVisible();
  });

  test('should login successfully with valid credentials', async ({ authPage }) => {
    await authPage.login(testData.owner.email, testData.owner.password);
    await authPage.expectLoginSuccess();
  });

  test('should show error with invalid credentials', async ({ authPage }) => {
    await authPage.login('invalid@email.com', 'wrongpassword');
    await authPage.expectLoginError();
  });

  test('should show error with empty fields', async ({ authPage, page }) => {
    await authPage.submitButton.click();
    
    // Verificar validação do formulário
    await expect(page.getByText(/email é obrigatório/i)).toBeVisible();
  });

  test('should navigate to forgot password page', async ({ authPage, page }) => {
    await authPage.goToForgotPassword();
    await expect(page).toHaveURL(/forgot-password/);
  });

  test('should persist session after page reload', async ({ authPage, page }) => {
    await authPage.login(testData.owner.email, testData.owner.password);
    await authPage.expectLoginSuccess();

    // Recarregar página
    await page.reload();

    // Deve permanecer logado
    await expect(page).toHaveURL(/dashboard/);
  });

  test('should logout successfully', async ({ authPage, dashboardPage }) => {
    await authPage.login(testData.owner.email, testData.owner.password);
    await authPage.expectLoginSuccess();

    await dashboardPage.logout();
  });
});

test.describe('Password Recovery', () => {
  test('should send recovery email for valid email', async ({ authPage, page }) => {
    await authPage.goto();
    await authPage.goToForgotPassword();

    await page.getByLabel(/email/i).fill(testData.owner.email);
    await page.getByRole('button', { name: /enviar/i }).click();

    await expect(page.getByText(/email enviado/i)).toBeVisible();
  });

  test('should show error for non-existent email', async ({ authPage, page }) => {
    await authPage.goto();
    await authPage.goToForgotPassword();

    await page.getByLabel(/email/i).fill('nonexistent@email.com');
    await page.getByRole('button', { name: /enviar/i }).click();

    await expect(page.getByRole('alert')).toBeVisible();
  });
});
