# E2E Tests - Glamo Platform

Suite de testes end-to-end para a plataforma Glamo usando Playwright e Jest.

## 📋 Pré-requisitos

- Node.js 18+
- API rodando localmente (porta 3000)
- Dashboard Web rodando localmente (porta 3001)
- Booking Portal rodando localmente (porta 3002)

## 🚀 Instalação

```bash
# Instalar dependências
pnpm install

# Instalar navegadores do Playwright
pnpm exec playwright install
```

## ⚙️ Configuração

1. Copie o arquivo `.env.example` para `.env`:

```bash
cp .env.example .env
```

2. Preencha as variáveis de ambiente:

```env
API_URL=http://localhost:3000/api
DASHBOARD_URL=http://localhost:3001
BOOKING_URL=http://localhost:3002

TEST_OWNER_EMAIL=owner@testsalon.com
TEST_OWNER_PASSWORD=Owner@123456
TEST_ADMIN_EMAIL=admin@glamo.com
TEST_ADMIN_PASSWORD=Admin@123456
TEST_PROFESSIONAL_EMAIL=pro@testsalon.com
TEST_PROFESSIONAL_PASSWORD=Pro@123456

TEST_TENANT_ID=test-tenant-id
TEST_TENANT_SLUG=test-salon
```

## 🧪 Executando Testes

### Testes E2E (Playwright)

```bash
# Executar todos os testes
pnpm test

# Executar com interface visual
pnpm test:ui

# Executar em modo headed (ver navegador)
pnpm test:headed

# Executar em modo debug
pnpm test:debug

# Ver relatório de testes
pnpm test:report

# Gerar código com Playwright Codegen
pnpm codegen
```

### Testes de API (Jest)

```bash
# Executar testes de API
pnpm test:api
```

### Executar testes específicos

```bash
# Executar apenas testes de autenticação
pnpm exec playwright test tests/auth.spec.ts

# Executar apenas testes de agendamento
pnpm exec playwright test tests/appointments.spec.ts

# Executar testes por tag
pnpm exec playwright test --grep @smoke
```

## 📁 Estrutura

```
e2e/
├── fixtures/           # Fixtures customizados do Playwright
│   ├── index.ts       # Configuração e exportação de fixtures
│   └── pages/         # Page Objects
│       ├── auth.page.ts
│       ├── dashboard.page.ts
│       ├── appointments.page.ts
│       ├── customers.page.ts
│       ├── services.page.ts
│       └── booking.page.ts
├── tests/             # Arquivos de teste
│   ├── auth.spec.ts
│   ├── dashboard.spec.ts
│   ├── appointments.spec.ts
│   ├── customers.spec.ts
│   ├── services.spec.ts
│   ├── booking.spec.ts
│   └── api.spec.ts    # Testes de API (Jest)
├── utils/             # Utilitários
│   ├── test-data-factory.ts
│   ├── api-helpers.ts
│   └── index.ts
├── playwright.config.ts
├── jest.config.js
└── package.json
```

## 🎭 Page Objects

Os Page Objects encapsulam a lógica de interação com cada página:

### AuthPage

```typescript
await authPage.login(email, password);
await authPage.logout();
await authPage.goToForgotPassword();
```

### DashboardPage

```typescript
await dashboardPage.navigateTo('Agenda');
await dashboardPage.openUserMenu();
await dashboardPage.waitForDataLoad();
```

### AppointmentsPage

```typescript
await appointmentsPage.createAppointment({ customer, service, date, time });
await appointmentsPage.confirmAppointment(customerName);
await appointmentsPage.cancelAppointment(customerName, reason);
```

### CustomersPage

```typescript
await customersPage.createCustomer({ name, email, phone });
await customersPage.searchCustomer('João');
await customersPage.editCustomer({ name: 'Novo Nome' });
```

### ServicesPage

```typescript
await servicesPage.createService({ name, duration, price });
await servicesPage.toggleServiceStatus(serviceName);
await servicesPage.deleteService(serviceName);
```

### BookingPage

```typescript
await bookingPage.completeBookingFlow({
  tenantSlug: 'salon',
  services: ['Corte'],
  date: tomorrow,
  time: '10:00',
  customer: { name, email, phone }
});
```

## 📊 Relatórios

Após executar os testes, os relatórios ficam disponíveis:

- **HTML Report**: `playwright-report/index.html`
- **Traces**: `test-results/` (em caso de falha)
- **Screenshots**: Capturados automaticamente em falhas

## 🔧 Configuração Avançada

### Múltiplos Navegadores

O `playwright.config.ts` está configurado para rodar em:

- Chromium (Desktop)
- Firefox (Desktop)
- WebKit/Safari (Desktop)
- Chrome Mobile (Pixel 5)
- Safari Mobile (iPhone 12)

### Paralelismo

```typescript
// playwright.config.ts
export default defineConfig({
  workers: process.env.CI ? 1 : undefined, // Paralelo local, serial no CI
});
```

### Timeouts

```typescript
// playwright.config.ts
export default defineConfig({
  timeout: 30000, // 30s por teste
  expect: { timeout: 5000 }, // 5s para assertions
});
```

## 🐛 Debugging

### Modo Debug

```bash
pnpm test:debug
```

### Usar Playwright Inspector

```bash
PWDEBUG=1 pnpm exec playwright test
```

### Ver trace de um teste

```bash
pnpm exec playwright show-trace test-results/[...]/trace.zip
```

## 📝 Boas Práticas

1. **Use Page Objects** para encapsular seletores e ações
2. **Gere dados únicos** usando `Date.now()` ou Faker
3. **Limpe dados de teste** após cada execução
4. **Use fixtures** para setup/teardown
5. **Evite sleeps fixos** - use `waitFor` e condições
6. **Teste cenários realistas** - fluxos completos de usuário

## 🤝 Contribuindo

1. Crie testes para novas funcionalidades
2. Mantenha Page Objects atualizados
3. Use seletores resilientes (`data-testid`, roles, labels)
4. Documente casos de teste complexos
