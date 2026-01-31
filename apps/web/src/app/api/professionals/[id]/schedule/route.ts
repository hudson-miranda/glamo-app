/**
 * GLAMO - Professional Schedule API Route
 * PUT: Update professional work schedule
 */

import { NextRequest, NextResponse } from 'next/server';
import { getApiTenantId } from '@/lib/auth';
import { ProfessionalService } from '@/lib/services/professionalService';
import { z } from 'zod';

const dayScheduleSchema = z.object({
  isWorking: z.boolean(),
  startTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/).optional(),
  endTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/).optional(),
  breakStart: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/).optional(),
  breakEnd: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/).optional(),
}).refine(
  (data) => {
    if (data.isWorking) {
      return data.startTime && data.endTime;
    }
    return true;
  },
  { message: 'Horário de início e fim são obrigatórios para dias de trabalho' }
);

const scheduleSchema = z.object({
  monday: dayScheduleSchema.optional(),
  tuesday: dayScheduleSchema.optional(),
  wednesday: dayScheduleSchema.optional(),
  thursday: dayScheduleSchema.optional(),
  friday: dayScheduleSchema.optional(),
  saturday: dayScheduleSchema.optional(),
  sunday: dayScheduleSchema.optional(),
});

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const tenantId = await getApiTenantId();
    if (!tenantId) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const schedule = scheduleSchema.parse(body);

    const service = new ProfessionalService(tenantId);
    const professional = await service.updateWorkSchedule(id, schedule);

    return NextResponse.json(professional);
  } catch (error) {
    console.error('Error updating schedule:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Dados inválidos', details: error.errors },
        { status: 400 }
      );
    }
    
    if (error instanceof Error) {
      if (error.message === 'Profissional não encontrado') {
        return NextResponse.json({ error: error.message }, { status: 404 });
      }
    }
    
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const tenantId = await getApiTenantId();
    if (!tenantId) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const { id } = await params;

    const service = new ProfessionalService(tenantId);
    const professional = await service.getById(id);

    if (!professional) {
      return NextResponse.json({ error: 'Profissional não encontrado' }, { status: 404 });
    }

    return NextResponse.json({
      professionalId: id,
      schedule: professional.workSchedule || {
        monday: { isWorking: false },
        tuesday: { isWorking: false },
        wednesday: { isWorking: false },
        thursday: { isWorking: false },
        friday: { isWorking: false },
        saturday: { isWorking: false },
        sunday: { isWorking: false },
      },
    });
  } catch (error) {
    console.error('Error getting schedule:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}
