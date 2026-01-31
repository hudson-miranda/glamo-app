/**
 * GLAMO - Professionals API Route
 * GET: List professionals with pagination and filters
 * POST: Create new professional
 * 
 * @version 2.0.0
 * @description Aligned with Prisma Professional model
 */

import { NextRequest, NextResponse } from 'next/server';
import { getApiTenantId } from '@/lib/auth';
import { ProfessionalService } from '@/lib/services/professionalService';
import { z } from 'zod';

// ============================================================================
// SCHEMAS - Aligned with Prisma
// ============================================================================

const dayScheduleSchema = z.object({
  isWorking: z.boolean(),
  startTime: z.string().optional(),
  endTime: z.string().optional(),
  breakStart: z.string().optional(),
  breakEnd: z.string().optional(),
}).optional();

const listQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  search: z.string().optional(),
  isActive: z.coerce.boolean().optional(),
  unitId: z.string().uuid().optional(),
  serviceId: z.string().uuid().optional(),
  includeServices: z.coerce.boolean().default(false),
  sortBy: z.string().default('sortOrder'),
  sortOrder: z.enum(['asc', 'desc']).default('asc'),
});

const createProfessionalSchema = z.object({
  name: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres').max(100),
  email: z.string().email('Email inválido').max(255).optional().nullable(),
  phone: z.string().max(20).optional().nullable(),
  avatarUrl: z.string().url().max(500).optional().nullable(),
  specialties: z.array(z.string()).optional().default([]),
  bio: z.string().max(500).optional().nullable(),
  commissionRate: z.number().min(0).max(100).default(0),
  calendarColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional().nullable(),
  unitId: z.string().uuid().optional().nullable(),
  isActive: z.boolean().default(true),
  sortOrder: z.number().int().min(0).optional(),
  workingHours: z.object({
    monday: dayScheduleSchema,
    tuesday: dayScheduleSchema,
    wednesday: dayScheduleSchema,
    thursday: dayScheduleSchema,
    friday: dayScheduleSchema,
    saturday: dayScheduleSchema,
    sunday: dayScheduleSchema,
  }).optional().nullable(),
  serviceIds: z.array(z.string().uuid()).optional(),
});

// ============================================================================
// GET - List Professionals
// ============================================================================

export async function GET(request: NextRequest) {
  try {
    const tenantId = await getApiTenantId();
    if (!tenantId) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const searchParams = Object.fromEntries(request.nextUrl.searchParams);
    const params = listQuerySchema.parse(searchParams);

    const service = new ProfessionalService(tenantId);
    const result = await service.list(params);

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error listing professionals:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Parâmetros inválidos', details: error.errors },
        { status: 400 }
      );
    }
    
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}

// ============================================================================
// POST - Create Professional
// ============================================================================

export async function POST(request: NextRequest) {
  try {
    const tenantId = await getApiTenantId();
    if (!tenantId) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const body = await request.json();
    const data = createProfessionalSchema.parse(body);

    const service = new ProfessionalService(tenantId);
    const professional = await service.create(data);

    return NextResponse.json(professional, { status: 201 });
  } catch (error) {
    console.error('Error creating professional:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Dados inválidos', details: error.errors },
        { status: 400 }
      );
    }
    
    if (error instanceof Error) {
      if (error.message.includes('Já existe')) {
        return NextResponse.json({ error: error.message }, { status: 409 });
      }
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}
