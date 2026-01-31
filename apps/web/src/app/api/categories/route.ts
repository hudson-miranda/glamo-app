/**
 * GLAMO - Service Categories API Route
 * GET: List categories / POST: Create category
 * 
 * @version 2.0.0
 * @description Aligned with Prisma ServiceCategory model
 */

import { NextRequest, NextResponse } from 'next/server';
import { getApiTenantId } from '@/lib/auth';
import { ServiceCategoryService } from '@/lib/services/categoryService';
import { z } from 'zod';

// ============================================================================
// SCHEMAS - Aligned with Prisma
// ============================================================================

const listQuerySchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(50),
  search: z.string().optional(),
  isActive: z.coerce.boolean().optional(),
  includeServices: z.coerce.boolean().default(false),
  sortBy: z.string().default('sortOrder'),
  sortOrder: z.enum(['asc', 'desc']).default('asc'),
});

const createCategorySchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório').max(50),
  description: z.string().max(200).optional().nullable(),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Cor deve ser hexadecimal válida'),
  icon: z.string().max(50).optional().nullable(),
  sortOrder: z.number().int().min(0).optional(),
  isActive: z.boolean().default(true),
});

// ============================================================================
// GET - List categories
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
    const service = new ServiceCategoryService(tenantId);

    const result = await service.list(validated);
    return NextResponse.json(result);
  } catch (error) {
    console.error('Error fetching categories:', error);
    
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
// POST - Create category
// ============================================================================

export async function POST(request: NextRequest) {
  try {
    const tenantId = await getApiTenantId();
    if (!tenantId) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const body = await request.json();
    const validated = createCategorySchema.parse(body);

    const service = new ServiceCategoryService(tenantId);
    const category = await service.create(validated);

    return NextResponse.json(category, { status: 201 });
  } catch (error) {
    console.error('Error creating category:', error);
    
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
