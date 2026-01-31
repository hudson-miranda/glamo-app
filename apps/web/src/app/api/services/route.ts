/**
 * GLAMO - Services API Routes
 * GET - List services with pagination, filters, search
 * POST - Create new service
 * 
 * @version 1.0.0
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getApiTenantId } from '@/lib/auth';
import { ServiceService } from '@/lib/services/serviceService';

// ============================================================================
// VALIDATION SCHEMAS
// ============================================================================

const listQuerySchema = z.object({
  page: z.coerce.number().int().positive().optional().default(1),
  limit: z.coerce.number().int().positive().max(100).optional().default(20),
  search: z.string().optional(),
  categoryId: z.string().uuid().optional(),
  isActive: z.coerce.boolean().optional(),
  isFeatured: z.coerce.boolean().optional(),
  professionalId: z.string().uuid().optional(),
  sortBy: z.string().optional().default('name'),
  sortOrder: z.enum(['asc', 'desc']).optional().default('asc'),
  includeCategory: z.coerce.boolean().optional().default(true),
  includeProfessionals: z.coerce.boolean().optional().default(false),
});

const createServiceSchema = z.object({
  name: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres').max(100),
  description: z.string().max(500).optional().nullable(),
  durationMinutes: z.number().int().positive('Duração deve ser positiva'),
  price: z.number().nonnegative('Preço não pode ser negativo'),
  categoryId: z.string().uuid().optional().nullable(),
  commissionRate: z.number().nonnegative().optional().nullable(),
  allowOnline: z.boolean().optional().default(true),
  requiresDeposit: z.boolean().optional().default(false),
  depositAmount: z.number().nonnegative().optional().nullable(),
  depositPercentage: z.number().nonnegative().optional().nullable(),
  parallelQuantity: z.number().int().positive().optional().default(1),
  imageUrl: z.string().max(500).optional().nullable(),
  sortOrder: z.number().int().nonnegative().optional().default(0),
  isActive: z.boolean().optional().default(true),
  isFeatured: z.boolean().optional().default(false),
  professionalIds: z.array(z.string().uuid()).optional(),
});

// ============================================================================
// GET - List Services
// ============================================================================

export async function GET(request: NextRequest) {
  try {
    const tenantId = await getApiTenantId();
    
    if (!tenantId) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const params = Object.fromEntries(searchParams.entries());
    
    const validatedParams = listQuerySchema.parse(params);

    const serviceService = new ServiceService(tenantId);
    const result = await serviceService.list(validatedParams);

    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Parâmetros inválidos', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Error listing services:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

// ============================================================================
// POST - Create Service
// ============================================================================

export async function POST(request: NextRequest) {
  try {
    const tenantId = await getApiTenantId();
    
    if (!tenantId) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const validatedData = createServiceSchema.parse(body);

    const serviceService = new ServiceService(tenantId);
    const service = await serviceService.create(validatedData);

    return NextResponse.json(service, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Dados inválidos', details: error.errors },
        { status: 400 }
      );
    }

    if (error instanceof Error) {
      if (error.message.includes('Já existe')) {
        return NextResponse.json(
          { error: error.message },
          { status: 409 }
        );
      }
      if (error.message.includes('não encontrada')) {
        return NextResponse.json(
          { error: error.message },
          { status: 404 }
        );
      }
    }

    console.error('Error creating service:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
