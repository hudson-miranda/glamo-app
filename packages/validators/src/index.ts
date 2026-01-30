import { z } from 'zod';

// ============================================
// COMMON SCHEMAS
// ============================================

export const uuidSchema = z.string().uuid('ID inválido');

export const emailSchema = z
  .string()
  .min(1, 'Email é obrigatório')
  .email('Email inválido');

export const passwordSchema = z
  .string()
  .min(8, 'Senha deve ter pelo menos 8 caracteres')
  .max(128, 'Senha muito longa')
  .regex(
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
    'Senha deve conter pelo menos uma letra minúscula, uma maiúscula e um número'
  );

export const phoneSchema = z
  .string()
  .min(10, 'Telefone inválido')
  .max(15, 'Telefone inválido')
  .regex(/^\d+$/, 'Telefone deve conter apenas números');

export const cpfSchema = z
  .string()
  .length(11, 'CPF deve ter 11 dígitos')
  .regex(/^\d+$/, 'CPF deve conter apenas números');

export const dateSchema = z.coerce.date();

export const paginationSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  perPage: z.coerce.number().int().positive().max(100).default(20),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).optional().default('desc'),
});

// ============================================
// AUTH SCHEMAS
// ============================================

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Senha é obrigatória'),
});

export const registerSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
  name: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres').max(100),
  tenantName: z.string().min(2, 'Nome do estabelecimento é obrigatório').max(100),
  phone: phoneSchema.optional(),
});

export const forgotPasswordSchema = z.object({
  email: emailSchema,
});

export const resetPasswordSchema = z.object({
  token: z.string().min(1, 'Token é obrigatório'),
  password: passwordSchema,
});

export const refreshTokenSchema = z.object({
  refreshToken: z.string().min(1, 'Refresh token é obrigatório'),
});

// ============================================
// USER SCHEMAS
// ============================================

export const userRoleSchema = z.enum([
  'SUPER_ADMIN',
  'OWNER',
  'MANAGER',
  'PROFESSIONAL',
  'RECEPTIONIST',
]);

export const createUserSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
  name: z.string().min(2).max(100),
  role: userRoleSchema,
  phone: phoneSchema.optional(),
});

export const updateUserSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  phone: phoneSchema.optional(),
  avatarUrl: z.string().url().optional(),
  isActive: z.boolean().optional(),
});

// ============================================
// CUSTOMER SCHEMAS
// ============================================

export const addressSchema = z.object({
  street: z.string().min(1),
  number: z.string().min(1),
  complement: z.string().optional(),
  neighborhood: z.string().min(1),
  city: z.string().min(1),
  state: z.string().length(2),
  zipCode: z.string().length(8),
  country: z.string().default('BR'),
});

export const createCustomerSchema = z.object({
  name: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres').max(100),
  email: emailSchema.optional(),
  phone: phoneSchema,
  cpf: cpfSchema.optional(),
  birthDate: dateSchema.optional(),
  gender: z.enum(['M', 'F', 'OTHER']).optional(),
  address: addressSchema.optional(),
  acceptsMarketing: z.boolean().default(true),
  tags: z.array(z.string()).default([]),
  notes: z.string().max(2000).optional(),
});

export const updateCustomerSchema = createCustomerSchema.partial();

export const customerQuerySchema = paginationSchema.extend({
  search: z.string().optional(),
  tags: z.array(z.string()).optional(),
  segment: z.string().optional(),
});

// ============================================
// SERVICE SCHEMAS
// ============================================

export const createServiceSchema = z.object({
  categoryId: uuidSchema,
  name: z.string().min(2).max(100),
  description: z.string().max(500).optional(),
  duration: z.number().int().positive().max(480),
  price: z.number().positive(),
  isActive: z.boolean().default(true),
});

export const updateServiceSchema = createServiceSchema.partial();

export const createServiceCategorySchema = z.object({
  name: z.string().min(2).max(50),
  description: z.string().max(200).optional(),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/),
  icon: z.string().optional(),
  sortOrder: z.number().int().nonnegative().default(0),
});

// ============================================
// APPOINTMENT SCHEMAS
// ============================================

export const appointmentStatusSchema = z.enum([
  'PENDING',
  'CONFIRMED',
  'WAITING',
  'IN_PROGRESS',
  'COMPLETED',
  'CANCELLED',
  'NO_SHOW',
]);

export const appointmentServiceSchema = z.object({
  serviceId: uuidSchema,
  price: z.number().positive().optional(),
});

export const createAppointmentSchema = z.object({
  customerId: uuidSchema,
  professionalId: uuidSchema,
  services: z.array(appointmentServiceSchema).min(1, 'Selecione pelo menos um serviço'),
  startTime: z.coerce.date(),
  notes: z.string().max(500).optional(),
});

export const updateAppointmentSchema = z.object({
  notes: z.string().max(500).optional(),
  status: appointmentStatusSchema.optional(),
});

export const rescheduleAppointmentSchema = z.object({
  startTime: z.coerce.date(),
  professionalId: uuidSchema.optional(),
});

export const cancelAppointmentSchema = z.object({
  reason: z.string().max(500).optional(),
});

export const availabilityQuerySchema = z.object({
  professionalId: uuidSchema,
  serviceIds: z.array(uuidSchema).optional(),
  startDate: z.coerce.date(),
  endDate: z.coerce.date(),
});

// ============================================
// PROFESSIONAL SCHEMAS
// ============================================

export const workingHoursSchema = z.record(
  z.string(),
  z
    .object({
      start: z.string().regex(/^\d{2}:\d{2}$/),
      end: z.string().regex(/^\d{2}:\d{2}$/),
    })
    .nullable()
);

export const createProfessionalSchema = z.object({
  userId: uuidSchema.optional(),
  name: z.string().min(2).max(100),
  email: emailSchema,
  phone: phoneSchema.optional(),
  bio: z.string().max(500).optional(),
  specialties: z.array(z.string()).default([]),
  services: z.array(uuidSchema).default([]),
  workingHours: workingHoursSchema.optional(),
  commissionRate: z.number().min(0).max(100).default(0),
});

export const updateProfessionalSchema = createProfessionalSchema.partial();

// ============================================
// TRANSACTION SCHEMAS
// ============================================

export const paymentMethodSchema = z.enum([
  'CASH',
  'CREDIT_CARD',
  'DEBIT_CARD',
  'PIX',
  'BANK_TRANSFER',
]);

export const createTransactionSchema = z.object({
  type: z.enum(['INCOME', 'EXPENSE']),
  amount: z.number().positive(),
  paymentMethod: paymentMethodSchema,
  customerId: uuidSchema.optional(),
  appointmentId: uuidSchema.optional(),
  description: z.string().max(200).optional(),
  paidAt: z.coerce.date().optional(),
});

// ============================================
// TYPE EXPORTS
// ============================================

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
export type CreateUserInput = z.infer<typeof createUserSchema>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;
export type CreateCustomerInput = z.infer<typeof createCustomerSchema>;
export type UpdateCustomerInput = z.infer<typeof updateCustomerSchema>;
export type CustomerQueryInput = z.infer<typeof customerQuerySchema>;
export type CreateServiceInput = z.infer<typeof createServiceSchema>;
export type UpdateServiceInput = z.infer<typeof updateServiceSchema>;
export type CreateServiceCategoryInput = z.infer<typeof createServiceCategorySchema>;
export type CreateAppointmentInput = z.infer<typeof createAppointmentSchema>;
export type UpdateAppointmentInput = z.infer<typeof updateAppointmentSchema>;
export type RescheduleAppointmentInput = z.infer<typeof rescheduleAppointmentSchema>;
export type CancelAppointmentInput = z.infer<typeof cancelAppointmentSchema>;
export type AvailabilityQueryInput = z.infer<typeof availabilityQuerySchema>;
export type CreateProfessionalInput = z.infer<typeof createProfessionalSchema>;
export type UpdateProfessionalInput = z.infer<typeof updateProfessionalSchema>;
export type CreateTransactionInput = z.infer<typeof createTransactionSchema>;
export type PaginationInput = z.infer<typeof paginationSchema>;

// Re-export zod for convenience
export { z };
