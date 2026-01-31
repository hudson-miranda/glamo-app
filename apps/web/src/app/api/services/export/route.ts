/**
 * GLAMO - Services Export API
 * Export services to CSV
 * 
 * @version 1.0.0
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getApiTenantId } from '@/lib/auth';
import { ServiceService } from '@/lib/services/serviceService';

const exportQuerySchema = z.object({
  categoryId: z.string().uuid().optional(),
  status: z.enum(['ACTIVE', 'INACTIVE']).optional(),
  segment: z.enum(['BELEZA', 'ESTETICA', 'SAUDE', 'BEM_ESTAR', 'TATUAGEM_PIERCING', 'PET', 'SERVICOS_GERAIS']).optional(),
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
    const params = Object.fromEntries(searchParams.entries());
    
    const validatedParams = exportQuerySchema.parse(params);

    const serviceService = new ServiceService(tenantId);
    const csvContent = await serviceService.exportToCSV(validatedParams);

    const headers = new Headers();
    headers.set('Content-Type', 'text/csv; charset=utf-8');
    headers.set('Content-Disposition', `attachment; filename="servicos-${new Date().toISOString().split('T')[0]}.csv"`);

    // Add BOM for Excel compatibility with UTF-8
    const bom = '\ufeff';
    return new NextResponse(bom + csvContent, { headers });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Parâmetros inválidos', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Error exporting services:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
