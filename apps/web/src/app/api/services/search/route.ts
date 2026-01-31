/**
 * GLAMO - Services Search API
 * Lightweight search for autocomplete/select components
 * 
 * @version 1.0.0
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getApiTenantId } from '@/lib/auth';
import { ServiceService } from '@/lib/services/serviceService';

const searchQuerySchema = z.object({
  q: z.string().min(1, 'Termo de busca é obrigatório'),
  limit: z.coerce.number().int().positive().max(50).optional().default(10),
});

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
    const params = {
      q: searchParams.get('q') || '',
      limit: searchParams.get('limit') || '10',
    };
    
    const validatedParams = searchQuerySchema.parse(params);

    const serviceService = new ServiceService(tenantId);
    const services = await serviceService.search(validatedParams.q, validatedParams.limit);

    return NextResponse.json(services);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Parâmetros inválidos', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Error searching services:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
