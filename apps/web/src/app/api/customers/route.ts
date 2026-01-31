/**
 * GLAMO - Customers API Route Handler
 * GET: List customers with pagination and filters
 * POST: Create new customer
 * 
 * @version 1.0.0
 * @description RESTful API for customer management with multi-tenant support
 */

import { NextRequest, NextResponse } from 'next/server';
import { getApiTenantId } from '@/lib/auth';
import { createCustomerService } from '@/lib/services/customerService';
import { customerCreateSchema } from '@/lib/validations/schemas';
import { z } from 'zod';

// ============================================================================
// QUERY PARAMS SCHEMA
// ============================================================================

const listQuerySchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
  search: z.string().optional(),
  sortBy: z.string().default('name'),
  sortOrder: z.enum(['asc', 'desc']).default('asc'),
  status: z.enum(['ACTIVE', 'INACTIVE']).optional(),
  gender: z.enum(['MALE', 'FEMALE', 'OTHER']).optional(),
  hasEmail: z.coerce.boolean().optional(),
  hasPhone: z.coerce.boolean().optional(),
  tags: z.string().optional(), // comma-separated
  createdFrom: z.string().optional(),
  createdTo: z.string().optional(),
  birthDateFrom: z.string().optional(),
  birthDateTo: z.string().optional(),
  includeInactive: z.coerce.boolean().default(false),
});

// ============================================================================
// GET - LIST CUSTOMERS
// ============================================================================

export async function GET(request: NextRequest) {
  try {
    // Auth check
    const tenantId = await getApiTenantId();
    if (!tenantId) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      );
    }

    // Parse query params
    const { searchParams } = new URL(request.url);
    const queryParams: Record<string, string> = {};
    searchParams.forEach((value, key) => {
      queryParams[key] = value;
    });

    const validatedParams = listQuerySchema.parse(queryParams);

    // Build filters
    const filters = {
      status: validatedParams.status,
      gender: validatedParams.gender,
      hasEmail: validatedParams.hasEmail,
      hasPhone: validatedParams.hasPhone,
      tags: validatedParams.tags?.split(',').filter(Boolean),
      createdFrom: validatedParams.createdFrom,
      createdTo: validatedParams.createdTo,
      birthDateFrom: validatedParams.birthDateFrom,
      birthDateTo: validatedParams.birthDateTo,
    };

    // Get customers
    const service = createCustomerService(tenantId);
    const result = await service.list({
      page: validatedParams.page,
      limit: validatedParams.limit,
      search: validatedParams.search,
      sortBy: validatedParams.sortBy,
      sortOrder: validatedParams.sortOrder,
      filters,
      includeInactive: validatedParams.includeInactive,
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error listing customers:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Parâmetros inválidos', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

// ============================================================================
// POST - CREATE CUSTOMER
// ============================================================================

export async function POST(request: NextRequest) {
  try {
    // Auth check
    const tenantId = await getApiTenantId();
    if (!tenantId) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      );
    }

    // Parse body
    const body = await request.json();

    // Validate
    const validatedData = customerCreateSchema.parse(body);

    // Create customer
    const service = createCustomerService(tenantId);
    const customer = await service.create(validatedData);

    return NextResponse.json(customer, { status: 201 });
  } catch (error) {
    console.error('Error creating customer:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Dados inválidos', details: error.errors },
        { status: 400 }
      );
    }

    if (error instanceof Error) {
      // Business rule errors
      if (
        error.message.includes('Já existe') ||
        error.message.includes('email') ||
        error.message.includes('CPF')
      ) {
        return NextResponse.json(
          { error: error.message },
          { status: 409 }
        );
      }
    }

    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
