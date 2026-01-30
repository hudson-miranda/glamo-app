import { test as base, expect } from '@playwright/test';
import { AuthPage } from './pages/auth.page';
import { DashboardPage } from './pages/dashboard.page';
import { AppointmentsPage } from './pages/appointments.page';
import { CustomersPage } from './pages/customers.page';
import { ServicesPage } from './pages/services.page';
import { BookingPage } from './pages/booking.page';

// Custom fixtures
export interface TestFixtures {
  authPage: AuthPage;
  dashboardPage: DashboardPage;
  appointmentsPage: AppointmentsPage;
  customersPage: CustomersPage;
  servicesPage: ServicesPage;
  bookingPage: BookingPage;
}

export const test = base.extend<TestFixtures>({
  authPage: async ({ page }, use) => {
    await use(new AuthPage(page));
  },
  dashboardPage: async ({ page }, use) => {
    await use(new DashboardPage(page));
  },
  appointmentsPage: async ({ page }, use) => {
    await use(new AppointmentsPage(page));
  },
  customersPage: async ({ page }, use) => {
    await use(new CustomersPage(page));
  },
  servicesPage: async ({ page }, use) => {
    await use(new ServicesPage(page));
  },
  bookingPage: async ({ page }, use) => {
    await use(new BookingPage(page));
  },
});

export { expect };

// Test data helpers
export const testData = {
  admin: {
    email: process.env.TEST_ADMIN_EMAIL || 'admin@glamo.app',
    password: process.env.TEST_ADMIN_PASSWORD || 'Admin@123456',
  },
  owner: {
    email: process.env.TEST_OWNER_EMAIL || 'owner@testsalon.com',
    password: process.env.TEST_OWNER_PASSWORD || 'Owner@123456',
  },
  professional: {
    email: process.env.TEST_PROFESSIONAL_EMAIL || 'professional@testsalon.com',
    password: process.env.TEST_PROFESSIONAL_PASSWORD || 'Pro@123456',
  },
  tenant: {
    slug: process.env.TEST_TENANT_SLUG || 'test-salon',
    id: process.env.TEST_TENANT_ID || 'test-tenant-id',
  },
  customer: {
    name: 'Cliente Teste',
    email: 'cliente.teste@email.com',
    phone: '11999999999',
  },
  service: {
    name: 'Corte de Cabelo',
    duration: 30,
    price: 5000, // R$ 50,00
  },
};
