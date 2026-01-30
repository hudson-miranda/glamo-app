import { Page, Locator } from '@playwright/test';

export class DashboardPage {
  readonly page: Page;
  readonly sidebar: Locator;
  readonly header: Locator;
  readonly userMenu: Locator;
  readonly logoutButton: Locator;
  readonly statsCards: Locator;
  readonly revenueChart: Locator;
  readonly appointmentsList: Locator;

  constructor(page: Page) {
    this.page = page;
    this.sidebar = page.locator('[data-testid="sidebar"]');
    this.header = page.locator('[data-testid="header"]');
    this.userMenu = page.locator('[data-testid="user-menu"]');
    this.logoutButton = page.getByRole('button', { name: /sair/i });
    this.statsCards = page.locator('[data-testid="stats-card"]');
    this.revenueChart = page.locator('[data-testid="revenue-chart"]');
    this.appointmentsList = page.locator('[data-testid="appointments-list"]');
  }

  async goto() {
    await this.page.goto('/dashboard');
  }

  async navigateTo(menuItem: string) {
    await this.sidebar.getByText(menuItem).click();
  }

  async openUserMenu() {
    await this.userMenu.click();
  }

  async logout() {
    await this.openUserMenu();
    await this.logoutButton.click();
    await this.page.waitForURL(/\/login/);
  }

  async getStatsValue(title: string): Promise<string> {
    const card = this.statsCards.filter({ hasText: title });
    const value = await card.locator('[data-testid="stats-value"]').textContent();
    return value || '';
  }

  async waitForDataLoad() {
    await this.page.waitForLoadState('networkidle');
  }
}
