/**
 * GLAMO - Suppliers API Routes
 * GET: List suppliers / POST: Create supplier
 * 
 * @version 2.0.0
 * @description Aligned with Prisma Supplier model
 */

import { NextRequest, NextResponse } from 'next/server';
import { getApiTenantId } from '@/lib/auth';
import { SupplierService } from '@/lib/services/supplierService';
import { z } from 'zod';

// ============================================================================
// SCHEMAS - Aligned with Prisma
// ============================================================================

const listQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  search: z.string().optional(),
  isActive: z.coerce.boolean().optional(),
  sortBy: z.string().default('name'),
  sortOrder: z.enum(['asc', 'desc']).default('asc'),
});

const createSupplierSchema = z.object({
  name: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres').max(100),
  contactName: z.string().max(100).optional().nullable(),
  email: z.string().email('Email inválido').max(255).optional().nullable(),
  phone: z.string().max(20).optional().nullable(),
  cnpj: z.string().max(14).optional().nullable(),
  address: z.string().max(300).optional().nullable(),
  notes: z.string().max(500).optional().nullable(),
  isActive: z.boolean().default(true),
});

// ============================================================================
// GET - List Suppliers
// ============================================================================

export async function GET(request: NextRequest) {
  try {
    const tenantId = await getApiTenantId();
    if (!tenantId) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const params = Object.fromEntries(searchParams.entries());
    
    const validated = listQuerySchema.parse(params);
    const service = new SupplierService(tenantId);

    const result = await service.list(validated);
    return NextResponse.json(result);
  } catch (error) {
    console.error('Error fetching suppliers:', error);
    
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
// POST - Create Supplier
// ============================================================================

export async function POST(request: NextRequest) {
  try {
    const tenantId = await getApiTenantId();
    if (!tenantId) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const body = await request.json();
    const validated = createSupplierSchema.parse(body);

    const service = new SupplierService(tenantId);
    const supplier = await service.create(validated);

    return NextResponse.json(supplier, { status: 201 });
  } catch (error) {
    console.error('Error creating supplier:', error);
    
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
    
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
