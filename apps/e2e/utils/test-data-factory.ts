import { faker } from '@faker-js/faker/locale/pt_BR';

/**
 * Fábrica de dados de teste
 */
export const createTestData = {
  /**
   * Cria dados de cliente
   */
  customer: (overrides?: Partial<CustomerData>): CustomerData => ({
    name: faker.person.fullName(),
    email: faker.internet.email().toLowerCase(),
    phone: faker.phone.number('119########'),
    birthDate: faker.date.birthdate({ min: 18, max: 70, mode: 'age' }),
    notes: faker.lorem.sentence(),
    ...overrides,
  }),

  /**
   * Cria dados de serviço
   */
  service: (overrides?: Partial<ServiceData>): ServiceData => ({
    name: `${faker.commerce.productName()} ${Date.now()}`,
    description: faker.commerce.productDescription(),
    duration: faker.helpers.arrayElement([15, 30, 45, 60, 90, 120]),
    price: faker.number.int({ min: 2000, max: 50000 }),
    category: faker.helpers.arrayElement([
      'Cabelo',
      'Barba',
      'Estética',
      'Manicure',
      'Pedicure',
    ]),
    ...overrides,
  }),

  /**
   * Cria dados de profissional
   */
  professional: (overrides?: Partial<ProfessionalData>): ProfessionalData => ({
    name: faker.person.fullName(),
    email: faker.internet.email().toLowerCase(),
    phone: faker.phone.number('119########'),
    specialty: faker.helpers.arrayElement([
      'Cabeleireiro',
      'Barbeiro',
      'Manicure',
      'Esteticista',
    ]),
    ...overrides,
  }),

  /**
   * Cria dados de agendamento
   */
  appointment: (overrides?: Partial<AppointmentData>): AppointmentData => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(10, 0, 0, 0);

    return {
      date: tomorrow,
      time: faker.helpers.arrayElement([
        '09:00',
        '10:00',
        '11:00',
        '14:00',
        '15:00',
        '16:00',
      ]),
      notes: faker.lorem.sentence(),
      ...overrides,
    };
  },

  /**
   * Cria dados de categoria
   */
  category: (overrides?: Partial<CategoryData>): CategoryData => ({
    name: `${faker.commerce.department()} ${Date.now()}`,
    description: faker.lorem.sentence(),
    ...overrides,
  }),
};

// Tipos de dados de teste
export interface CustomerData {
  name: string;
  email: string;
  phone: string;
  birthDate?: Date;
  notes?: string;
}

export interface ServiceData {
  name: string;
  description?: string;
  duration: number;
  price: number;
  category?: string;
}

export interface ProfessionalData {
  name: string;
  email: string;
  phone: string;
  specialty?: string;
}

export interface AppointmentData {
  date: Date;
  time: string;
  notes?: string;
  customerId?: string;
  serviceId?: string;
  professionalId?: string;
}

export interface CategoryData {
  name: string;
  description?: string;
}

/**
 * Utilitários para manipulação de datas
 */
export const dateUtils = {
  /**
   * Retorna a data de amanhã
   */
  tomorrow: (): Date => {
    const date = new Date();
    date.setDate(date.getDate() + 1);
    return date;
  },

  /**
   * Retorna a data de N dias no futuro
   */
  daysFromNow: (days: number): Date => {
    const date = new Date();
    date.setDate(date.getDate() + days);
    return date;
  },

  /**
   * Formata data para YYYY-MM-DD
   */
  formatISO: (date: Date): string => {
    return date.toISOString().split('T')[0];
  },

  /**
   * Retorna horários de trabalho padrão
   */
  workingHours: (): string[] => {
    return [
      '09:00',
      '09:30',
      '10:00',
      '10:30',
      '11:00',
      '11:30',
      '14:00',
      '14:30',
      '15:00',
      '15:30',
      '16:00',
      '16:30',
      '17:00',
      '17:30',
      '18:00',
    ];
  },
};

/**
 * Utilitários para formatação
 */
export const formatUtils = {
  /**
   * Formata preço em centavos para exibição
   */
  price: (cents: number): string => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(cents / 100);
  },

  /**
   * Formata duração em minutos para exibição
   */
  duration: (minutes: number): string => {
    if (minutes < 60) return `${minutes} min`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}h ${mins}min` : `${hours}h`;
  },

  /**
   * Formata telefone
   */
  phone: (phone: string): string => {
    const cleaned = phone.replace(/\D/g, '');
    if (cleaned.length === 11) {
      return cleaned.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
    }
    return phone;
  },
};

/**
 * Utilitários para espera
 */
export const waitUtils = {
  /**
   * Aguarda um tempo em milissegundos
   */
  sleep: (ms: number): Promise<void> => {
    return new Promise((resolve) => setTimeout(resolve, ms));
  },

  /**
   * Retry com backoff exponencial
   */
  retry: async <T>(
    fn: () => Promise<T>,
    maxRetries: number = 3,
    delay: number = 1000
  ): Promise<T> => {
    let lastError: Error;
    for (let i = 0; i < maxRetries; i++) {
      try {
        return await fn();
      } catch (error) {
        lastError = error as Error;
        await waitUtils.sleep(delay * Math.pow(2, i));
      }
    }
    throw lastError!;
  },
};

/**
 * Utilitários para geração de IDs únicos
 */
export const idUtils = {
  /**
   * Gera um ID único baseado em timestamp
   */
  unique: (): string => {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  },

  /**
   * Gera um email único
   */
  email: (prefix: string = 'test'): string => {
    return `${prefix}.${idUtils.unique()}@e2e.test`;
  },
};
