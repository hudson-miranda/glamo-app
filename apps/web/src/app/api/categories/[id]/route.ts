/**
 * GLAMO - Category [id] API Route
 * GET: Get single / PUT: Update / DELETE: Soft delete / PATCH: Actions
 */

import { NextRequest, NextResponse } from 'next/server';
import { getApiTenantId } from '@/lib/auth';
import { CategoryService } from '@/lib/services/categoryService';
import { z } from 'zod';

// ============================================================================
// SCHEMAS
// ============================================================================

const updateCategorySchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().max(500).optional().nullable(),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional().nullable(),
  icon: z.string().max(50).optional().nullable(),
  parentId: z.string().uuid().optional().nullable(),
  segment: z.enum(['BELEZA', 'ESTETICA', 'SAUDE', 'BEM_ESTAR', 'TATUAGEM_PIERCING', 'PET', 'SERVICOS_GERAIS']).optional(),
  order: z.number().int().min(0).optional(),
  status: z.enum(['ACTIVE', 'INACTIVE']).optional(),
});

const patchActionSchema = z.object({
  action: z.enum(['activate', 'deactivate', 'restore']),
});

interface RouteParams {
  params: Promise<{ id: string }>;
}

// ============================================================================
// GET - Get single category
// ============================================================================

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const tenantId = await getApiTenantId();
    if (!tenantId) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const includeServices = searchParams.get('includeServices') === 'true';
    const includeChildren = searchParams.get('includeChildren') === 'true';

    const service = new CategoryService(tenantId);
    const category = await service.getById(id, { includeServices, includeChildren });

    if (!category) {
      return NextResponse.json({ error: 'Categoria não encontrada' }, { status: 404 });
    }

    return NextResponse.json(category);
  } catch (error) {
    console.error('Error fetching category:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}

// ============================================================================
// PUT - Update category
// ============================================================================

export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const tenantId = await getApiTenantId();
    if (!tenantId) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const validated = updateCategorySchema.parse(body);

    const service = new CategoryService(tenantId);
    const category = await service.update(id, validated);

    return NextResponse.json(category);
  } catch (error) {
    console.error('Error updating category:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Dados inválidos', details: error.errors },
        { status: 400 }
      );
    }
    
    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}

// ============================================================================
// DELETE - Soft delete category
// ============================================================================

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const tenantId = await getApiTenantId();
    if (!tenantId) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const { id } = await params;
    const service = new CategoryService(tenantId);
    
    await service.delete(id);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting category:', error);
    
    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}

// ============================================================================
// PATCH - Actions (activate, deactivate, restore)
// ============================================================================

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const tenantId = await getApiTenantId();
    if (!tenantId) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const { action } = patchActionSchema.parse(body);

    const service = new CategoryService(tenantId);

    switch (action) {
      case 'activate':
        await service.update(id, { status: 'ACTIVE' });
        break;
      case 'deactivate':
        await service.update(id, { status: 'INACTIVE' });
        break;
      case 'restore':
        await service.restore(id);
        break;
    }

    const category = await service.getById(id);
    return NextResponse.json(category);
  } catch (error) {
    console.error('Error patching category:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Ação inválida', details: error.errors },
        { status: 400 }
      );
    }
    
    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}
