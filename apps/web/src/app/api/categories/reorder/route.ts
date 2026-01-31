/**
 * GLAMO - Categories Reorder API Route
 * POST: Reorder categories
 */

import { NextRequest, NextResponse } from 'next/server';
import { getApiTenantId } from '@/lib/auth';
import { CategoryService } from '@/lib/services/categoryService';
import { z } from 'zod';

const reorderSchema = z.object({
  categoryIds: z.array(z.string().uuid()).min(1),
});

export async function POST(request: NextRequest) {
  try {
    const tenantId = await getApiTenantId();
    if (!tenantId) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const body = await request.json();
    const { categoryIds } = reorderSchema.parse(body);

    const service = new CategoryService(tenantId);
    await service.reorder(categoryIds);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error reordering categories:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Dados inválidos', details: error.errors },
        { status: 400 }
      );
    }
    
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}
