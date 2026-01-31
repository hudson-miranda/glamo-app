/**
 * GLAMO - Products API Routes
 * GET: List products / POST: Create product
 * 
 * @version 2.0.0
 * @description Aligned with Prisma Product model
 */

import { NextRequest, NextResponse } from 'next/server';
import { getApiTenantId } from '@/lib/auth';
import { ProductService } from '@/lib/services/productService';
import { z } from 'zod';

// ============================================================================
// SCHEMAS - Aligned with Prisma
// ============================================================================

const listQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  search: z.string().optional(),
  categoryId: z.string().uuid().optional(),
  supplierId: z.string().uuid().optional(),
  isActive: z.coerce.boolean().optional(),
  lowStock: z.coerce.boolean().optional(),
  sortBy: z.string().default('name'),
  sortOrder: z.enum(['asc', 'desc']).default('asc'),
});

const createProductSchema = z.object({
  name: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres').max(100),
  description: z.string().max(500).optional().nullable(),
  sku: z.string().max(50).optional().nullable(),
  barcode: z.string().max(50).optional().nullable(),
  brand: z.string().max(50).optional().nullable(),
  unit: z.string().max(10).default('un'),
  costPrice: z.number().nonnegative('Preço de custo não pode ser negativo'),
  salePrice: z.number().nonnegative('Preço de venda não pode ser negativo'),
  categoryId: z.string().uuid().optional().nullable(),
  supplierId: z.string().uuid().optional().nullable(),
  commissionRate: z.number().min(0).max(100).optional().nullable(),
  stockQuantity: z.number().int().nonnegative().default(0),
  minStock: z.number().int().nonnegative().default(0),
  maxStock: z.number().int().positive().optional().nullable(),
  imageUrl: z.string().url().max(500).optional().nullable(),
  sortOrder: z.number().int().nonnegative().default(0),
  isActive: z.boolean().default(true),
  sellOnline: z.boolean().default(false),
});

// ============================================================================
// GET - List Products
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
    const service = new ProductService(tenantId);

    const result = await service.list(validated);
    return NextResponse.json(result);
  } catch (error) {
    console.error('Error fetching products:', error);
    
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
// POST - Create Product
// ============================================================================

export async function POST(request: NextRequest) {
  try {
    const tenantId = await getApiTenantId();
    if (!tenantId) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const body = await request.json();
    const validated = createProductSchema.parse(body);

    const service = new ProductService(tenantId);
    const product = await service.create(validated);

    return NextResponse.json(product, { status: 201 });
  } catch (error) {
    console.error('Error creating product:', error);
    
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
