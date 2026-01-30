/**
 * GLAMO - Database Seed Script
 * 
 * Este script popula o banco de dados com dados de demonstração.
 * Uso: pnpm db:seed
 */

import { PrismaClient, TenantPlan, TenantStatus, UserRole, UserStatus, Gender, LoyaltyTier } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

// =====================================================
// CONFIGURAÇÃO
// =====================================================

const BCRYPT_ROUNDS = 12;
const DEFAULT_PASSWORD = 'Glamo@2024';

// =====================================================
// HELPERS
// =====================================================

async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, BCRYPT_ROUNDS);
}

// =====================================================
// SEED DATA
// =====================================================

async function main(): Promise<void> {
  console.log('🌱 Iniciando seed do banco de dados...\n');

  try {
    // Limpar dados existentes
    await cleanDatabase();

    // Criar tenant demo
    const tenant = await createDemoTenant();
    console.log(`✅ Tenant criado: ${tenant.name} (${tenant.slug})`);

    // Criar unidade principal
    const unit = await createMainUnit(tenant.id);
    console.log(`✅ Unidade criada: ${unit.name}`);

    // Criar usuários
    const users = await createUsers(tenant.id);
    console.log(`✅ ${users.length} usuários criados`);

    // Criar categorias de serviço
    const serviceCategories = await createServiceCategories(tenant.id);
    console.log(`✅ ${serviceCategories.length} categorias de serviço criadas`);

    // Criar serviços
    const services = await createServices(tenant.id, serviceCategories);
    console.log(`✅ ${services.length} serviços criados`);

    // Criar profissionais
    const professionals = await createProfessionals(tenant.id, unit.id, users, services);
    console.log(`✅ ${professionals.length} profissionais criados`);

    // Criar clientes
    const customers = await createCustomers(tenant.id);
    console.log(`✅ ${customers.length} clientes criados`);

    // Criar programa de fidelidade
    const loyaltyProgram = await createLoyaltyProgram(tenant.id);
    console.log(`✅ Programa de fidelidade criado: ${loyaltyProgram.name}`);

    // Criar templates de notificação
    const templates = await createNotificationTemplates(tenant.id);
    console.log(`✅ ${templates.length} templates de notificação criados`);

    console.log('\n🎉 Seed concluído com sucesso!');
    console.log('\n📋 Resumo:');
    console.log(`   - Tenant: ${tenant.name}`);
    console.log(`   - Slug: ${tenant.slug}`);
    console.log(`   - Admin: admin@${tenant.slug}.glamo.app`);
    console.log(`   - Senha: ${DEFAULT_PASSWORD}`);

  } catch (error) {
    console.error('\n❌ Erro durante o seed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// =====================================================
// CLEAN DATABASE
// =====================================================

async function cleanDatabase(): Promise<void> {
  console.log('🧹 Limpando dados existentes...');
  
  // Deletar em ordem reversa de dependências
  const tablesToClean = [
    'notification', 'notificationTemplate', 'review', 'customerPoints',
    'loyaltyReward', 'loyaltyProgram', 'campaign', 'stockMovement',
    'product', 'productCategory', 'supplier', 'cashMovement', 'cashRegister',
    'commission', 'payment', 'transactionItem', 'transaction',
    'appointmentService', 'appointment', 'anamnesis', 'customer',
    'professionalAbsence', 'professionalSchedule', 'serviceProfessional',
    'professional', 'service', 'serviceCategory', 'session', 'refreshToken',
    'user', 'unit', 'tenant'
  ];

  for (const table of tablesToClean) {
    try {
      await (prisma as any)[table].deleteMany();
    } catch (e) {
      // Ignorar erros de tabelas que não existem
    }
  }

  console.log('✅ Dados limpos\n');
}

// =====================================================
// CREATE DEMO TENANT
// =====================================================

async function createDemoTenant() {
  return prisma.tenant.create({
    data: {
      name: 'Studio Glamo Demo',
      slug: 'studio-glamo-demo',
      plan: TenantPlan.PROFESSIONAL,
      status: TenantStatus.ACTIVE,
      timezone: 'America/Sao_Paulo',
      currency: 'BRL',
      locale: 'pt-BR',
      primaryColor: '#C9A86C',
      secondaryColor: '#1a1a1a',
      phone: '11999999999',
      email: 'contato@studioglamo.com.br',
      website: 'https://studioglamo.com.br',
      street: 'Rua Augusta',
      number: '1500',
      complement: 'Loja 10',
      neighborhood: 'Consolação',
      city: 'São Paulo',
      state: 'SP',
      zipCode: '01304001',
      country: 'BR',
      settings: {
        bookingSettings: {
          allowOnlineBooking: true,
          requireConfirmation: true,
          minAdvanceHours: 2,
          maxAdvanceDays: 30,
          cancellationHours: 4,
        },
        notificationSettings: {
          sendReminders: true,
          reminderHours: [24, 2],
          sendConfirmation: true,
        },
      },
    },
  });
}

// =====================================================
// CREATE MAIN UNIT
// =====================================================

async function createMainUnit(tenantId: string) {
  return prisma.unit.create({
    data: {
      tenantId,
      name: 'Unidade Principal',
      phone: '11999999999',
      email: 'unidade1@studioglamo.com.br',
      street: 'Rua Augusta',
      number: '1500',
      complement: 'Loja 10',
      neighborhood: 'Consolação',
      city: 'São Paulo',
      state: 'SP',
      zipCode: '01304001',
      isMainUnit: true,
      isActive: true,
      settings: {
        workingHours: {
          monday: { start: '09:00', end: '20:00' },
          tuesday: { start: '09:00', end: '20:00' },
          wednesday: { start: '09:00', end: '20:00' },
          thursday: { start: '09:00', end: '20:00' },
          friday: { start: '09:00', end: '20:00' },
          saturday: { start: '09:00', end: '18:00' },
          sunday: null,
        },
      },
    },
  });
}

// =====================================================
// CREATE USERS
// =====================================================

async function createUsers(tenantId: string) {
  const passwordHash = await hashPassword(DEFAULT_PASSWORD);

  const usersData = [
    { email: 'admin@studioglamo.com.br', name: 'Administrador Glamo', role: UserRole.OWNER, status: UserStatus.ACTIVE },
    { email: 'gerente@studioglamo.com.br', name: 'Maria Silva', role: UserRole.MANAGER, status: UserStatus.ACTIVE },
    { email: 'recepcao@studioglamo.com.br', name: 'Ana Santos', role: UserRole.RECEPTIONIST, status: UserStatus.ACTIVE },
    { email: 'camila@studioglamo.com.br', name: 'Camila Oliveira', role: UserRole.PROFESSIONAL, status: UserStatus.ACTIVE },
    { email: 'fernanda@studioglamo.com.br', name: 'Fernanda Costa', role: UserRole.PROFESSIONAL, status: UserStatus.ACTIVE },
    { email: 'julia@studioglamo.com.br', name: 'Julia Mendes', role: UserRole.PROFESSIONAL, status: UserStatus.ACTIVE },
  ];

  const users = [];
  for (const userData of usersData) {
    const user = await prisma.user.create({
      data: { tenantId, passwordHash, emailVerifiedAt: new Date(), ...userData },
    });
    users.push(user);
  }

  return users;
}

// =====================================================
// CREATE SERVICE CATEGORIES
// =====================================================

async function createServiceCategories(tenantId: string) {
  const categories = [
    { name: 'Cabelo', description: 'Serviços de cabelo', color: '#E91E63', icon: 'scissors', sortOrder: 1 },
    { name: 'Unhas', description: 'Manicure e pedicure', color: '#9C27B0', icon: 'hand', sortOrder: 2 },
    { name: 'Estética', description: 'Tratamentos faciais e corporais', color: '#00BCD4', icon: 'sparkles', sortOrder: 3 },
    { name: 'Maquiagem', description: 'Maquiagem profissional', color: '#FF5722', icon: 'palette', sortOrder: 4 },
    { name: 'Massagem', description: 'Massagens relaxantes e terapêuticas', color: '#4CAF50', icon: 'heart', sortOrder: 5 },
    { name: 'Depilação', description: 'Serviços de depilação', color: '#FFC107', icon: 'zap', sortOrder: 6 },
  ];

  const createdCategories = [];
  for (const cat of categories) {
    const created = await prisma.serviceCategory.create({
      data: { tenantId, ...cat },
    });
    createdCategories.push(created);
  }
  return createdCategories;
}

// =====================================================
// CREATE SERVICES
// =====================================================

async function createServices(tenantId: string, categories: { id: string; name: string }[]) {
  const categoryMap = new Map(categories.map(c => [c.name, c.id]));

  const servicesData = [
    { name: 'Corte Feminino', categoryName: 'Cabelo', durationMinutes: 60, price: 120 },
    { name: 'Corte Masculino', categoryName: 'Cabelo', durationMinutes: 30, price: 60 },
    { name: 'Escova Modeladora', categoryName: 'Cabelo', durationMinutes: 45, price: 80 },
    { name: 'Progressiva', categoryName: 'Cabelo', durationMinutes: 180, price: 350 },
    { name: 'Coloração', categoryName: 'Cabelo', durationMinutes: 120, price: 200 },
    { name: 'Mechas/Luzes', categoryName: 'Cabelo', durationMinutes: 150, price: 280 },
    { name: 'Hidratação Profunda', categoryName: 'Cabelo', durationMinutes: 60, price: 100 },
    { name: 'Manicure Simples', categoryName: 'Unhas', durationMinutes: 40, price: 40 },
    { name: 'Pedicure Simples', categoryName: 'Unhas', durationMinutes: 50, price: 50 },
    { name: 'Manicure + Pedicure', categoryName: 'Unhas', durationMinutes: 80, price: 80 },
    { name: 'Unhas em Gel', categoryName: 'Unhas', durationMinutes: 90, price: 150 },
    { name: 'Limpeza de Pele', categoryName: 'Estética', durationMinutes: 90, price: 180 },
    { name: 'Design de Sobrancelhas', categoryName: 'Estética', durationMinutes: 30, price: 50 },
    { name: 'Extensão de Cílios', categoryName: 'Estética', durationMinutes: 120, price: 200 },
    { name: 'Maquiagem Social', categoryName: 'Maquiagem', durationMinutes: 60, price: 150 },
    { name: 'Maquiagem Noiva', categoryName: 'Maquiagem', durationMinutes: 90, price: 350 },
    { name: 'Massagem Relaxante', categoryName: 'Massagem', durationMinutes: 60, price: 150 },
    { name: 'Drenagem Linfática', categoryName: 'Massagem', durationMinutes: 60, price: 160 },
    { name: 'Depilação Perna Completa', categoryName: 'Depilação', durationMinutes: 45, price: 80 },
    { name: 'Depilação Virilha', categoryName: 'Depilação', durationMinutes: 30, price: 60 },
  ];

  const services = [];
  for (const serviceData of servicesData) {
    const categoryId = categoryMap.get(serviceData.categoryName);
    if (!categoryId) continue;

    const service = await prisma.service.create({
      data: {
        tenantId, categoryId,
        name: serviceData.name,
        durationMinutes: serviceData.durationMinutes,
        price: serviceData.price,
        allowOnline: true, isActive: true, commissionRate: 40,
      },
    });
    services.push(service);
  }

  return services;
}

// =====================================================
// CREATE PROFESSIONALS
// =====================================================

async function createProfessionals(
  tenantId: string,
  unitId: string,
  users: { id: string; name: string; role: UserRole }[],
  services: { id: string; name: string }[]
) {
  const professionalUsers = users.filter(u => u.role === UserRole.PROFESSIONAL);

  const professionalsData = [
    { name: 'Camila Oliveira', email: 'camila@studioglamo.com.br', phone: '11988881111', specialties: ['Cabelo', 'Coloração'], commissionRate: 45, calendarColor: '#E91E63', serviceNames: ['Corte Feminino', 'Corte Masculino', 'Escova Modeladora', 'Coloração', 'Mechas/Luzes', 'Hidratação Profunda'] },
    { name: 'Fernanda Costa', email: 'fernanda@studioglamo.com.br', phone: '11988882222', specialties: ['Unhas', 'Nail Art'], commissionRate: 40, calendarColor: '#9C27B0', serviceNames: ['Manicure Simples', 'Pedicure Simples', 'Manicure + Pedicure', 'Unhas em Gel'] },
    { name: 'Julia Mendes', email: 'julia@studioglamo.com.br', phone: '11988883333', specialties: ['Estética', 'Maquiagem'], commissionRate: 42, calendarColor: '#00BCD4', serviceNames: ['Limpeza de Pele', 'Design de Sobrancelhas', 'Extensão de Cílios', 'Maquiagem Social', 'Maquiagem Noiva'] },
  ];

  const professionals = [];
  for (let i = 0; i < professionalsData.length; i++) {
    const data = professionalsData[i];
    const user = professionalUsers[i];

    const professional = await prisma.professional.create({
      data: {
        tenantId, unitId, userId: user?.id,
        name: data.name, email: data.email, phone: data.phone,
        specialties: data.specialties, commissionRate: data.commissionRate,
        calendarColor: data.calendarColor, isActive: true,
      },
    });

    // Criar schedules
    for (let dayOfWeek = 1; dayOfWeek <= 6; dayOfWeek++) {
      await prisma.professionalSchedule.create({
        data: {
          professionalId: professional.id, dayOfWeek,
          startTime: '09:00', endTime: dayOfWeek === 6 ? '14:00' : '18:00',
          breakStart: dayOfWeek === 6 ? undefined : '12:00',
          breakEnd: dayOfWeek === 6 ? undefined : '13:00',
        },
      });
    }

    // Associar serviços
    for (const serviceName of data.serviceNames) {
      const service = services.find(s => s.name === serviceName);
      if (service) {
        await prisma.serviceProfessional.create({
          data: { professionalId: professional.id, serviceId: service.id },
        });
      }
    }

    professionals.push(professional);
  }

  return professionals;
}

// =====================================================
// CREATE CUSTOMERS
// =====================================================

async function createCustomers(tenantId: string) {
  const customersData = [
    { name: 'Mariana Souza', email: 'mariana.souza@email.com', phone: '11991111111', gender: Gender.FEMALE, tier: LoyaltyTier.GOLD },
    { name: 'Carolina Lima', email: 'carolina.lima@email.com', phone: '11992222222', gender: Gender.FEMALE, tier: LoyaltyTier.SILVER },
    { name: 'Beatriz Ferreira', email: 'beatriz.f@email.com', phone: '11993333333', gender: Gender.FEMALE, tier: LoyaltyTier.BRONZE },
    { name: 'Amanda Rodrigues', email: 'amanda.r@email.com', phone: '11994444444', gender: Gender.FEMALE, tier: LoyaltyTier.PLATINUM },
    { name: 'Larissa Santos', email: 'larissa.s@email.com', phone: '11995555555', gender: Gender.FEMALE, tier: LoyaltyTier.BRONZE },
    { name: 'Isabela Martins', email: 'isabela.m@email.com', phone: '11996666666', gender: Gender.FEMALE, tier: LoyaltyTier.SILVER },
    { name: 'Rafael Pereira', email: 'rafael.p@email.com', phone: '11999999000', gender: Gender.MALE, tier: LoyaltyTier.BRONZE },
    { name: 'Lucas Oliveira', email: 'lucas.o@email.com', phone: '11991110000', gender: Gender.MALE, tier: LoyaltyTier.BRONZE },
  ];

  const customers = [];
  for (const customer of customersData) {
    const created = await prisma.customer.create({
      data: {
        tenantId, ...customer,
        acceptsMarketing: true, tags: ['regular'],
        visitCount: Math.floor(Math.random() * 20) + 1,
        totalSpent: Math.random() * 2000 + 100,
        pointsBalance: Math.floor(Math.random() * 500) + 50,
      },
    });
    customers.push(created);
  }
  return customers;
}

// =====================================================
// CREATE LOYALTY PROGRAM
// =====================================================

async function createLoyaltyProgram(tenantId: string) {
  const program = await prisma.loyaltyProgram.create({
    data: {
      tenantId,
      name: 'Programa Glamo Fidelidade',
      description: 'Acumule pontos a cada visita e troque por serviços e produtos exclusivos',
      pointsPerCurrency: 1,
      silverThreshold: 500, goldThreshold: 1500,
      platinumThreshold: 3000, diamondThreshold: 5000,
      referralPoints: 100, referredPoints: 50, isActive: true,
    },
  });

  const rewards = [
    { name: 'Escova Grátis', pointsCost: 500, rewardType: 'service', minTier: LoyaltyTier.BRONZE },
    { name: '10% de Desconto', pointsCost: 300, rewardType: 'discount', rewardValue: 10, minTier: LoyaltyTier.BRONZE },
    { name: 'Hidratação Grátis', pointsCost: 800, rewardType: 'service', minTier: LoyaltyTier.SILVER },
    { name: '20% de Desconto', pointsCost: 600, rewardType: 'discount', rewardValue: 20, minTier: LoyaltyTier.SILVER },
    { name: 'Manicure + Pedicure Grátis', pointsCost: 700, rewardType: 'service', minTier: LoyaltyTier.GOLD },
  ];

  for (const reward of rewards) {
    await prisma.loyaltyReward.create({
      data: { loyaltyProgramId: program.id, ...reward },
    });
  }

  return program;
}

// =====================================================
// CREATE NOTIFICATION TEMPLATES
// =====================================================

async function createNotificationTemplates(tenantId: string) {
  const templates = [
    { name: 'Confirmação de Agendamento', type: 'appointment_confirmation', channel: 'WHATSAPP', content: 'Olá {{customer_name}}! Seu agendamento foi confirmado para {{date}} às {{time}}.', isDefault: true },
    { name: 'Lembrete 24h', type: 'appointment_reminder_24h', channel: 'WHATSAPP', content: 'Olá {{customer_name}}! Lembrete: seu agendamento é amanhã, {{date}} às {{time}}.', isDefault: true },
    { name: 'Lembrete 2h', type: 'appointment_reminder_2h', channel: 'WHATSAPP', content: 'Olá {{customer_name}}! Seu horário é daqui a 2 horas, às {{time}}!', isDefault: true },
    { name: 'Pós-Atendimento', type: 'post_service', channel: 'WHATSAPP', content: 'Olá {{customer_name}}! Obrigada pela visita! Avalie nosso atendimento: {{review_link}}', isDefault: true },
    { name: 'Aniversário', type: 'birthday', channel: 'WHATSAPP', content: 'Feliz Aniversário, {{customer_name}}! Presente especial: {{discount}}% de desconto!', isDefault: true },
  ];

  const createdTemplates = [];
  for (const template of templates) {
    const created = await prisma.notificationTemplate.create({
      data: { tenantId, ...template, channel: template.channel as any, isActive: true },
    });
    createdTemplates.push(created);
  }

  return createdTemplates;
}

// =====================================================
// EXECUTE MAIN
// =====================================================

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
