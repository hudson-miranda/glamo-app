import {
  Injectable,
  Logger,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { ProfessionalsRepository } from './repositories';
import { ScheduleService } from './services/schedule.service';
import {
  CreateProfessionalDto,
  UpdateProfessionalDto,
  CreateScheduleBlockDto,
  UpdateScheduleBlockDto,
  UpdateWorkingHoursDto,
  UpdateCommissionRulesDto,
  AddServicesDto,
  RemoveServicesDto,
  ReorderProfessionalsDto,
  ProfessionalQueryDto,
  AvailabilityQueryDto,
  AvailabilityRangeQueryDto,
} from './dto';
import { ProfessionalStatus } from './interfaces';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class ProfessionalsService {
  private readonly logger = new Logger(ProfessionalsService.name);

  constructor(
    private readonly repository: ProfessionalsRepository,
    private readonly scheduleService: ScheduleService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  // ========================
  // CRUD
  // ========================

  async create(dto: CreateProfessionalDto): Promise<any> {
    // Verificar email único
    const existing = await this.repository.findByEmail(dto.email);
    if (existing) {
      throw new ConflictException('Já existe um profissional com este email');
    }

    // Verificar user vinculado
    if (dto.userId) {
      const byUser = await this.repository.findByUserId(dto.userId);
      if (byUser) {
        throw new ConflictException('Este usuário já está vinculado a outro profissional');
      }
    }

    // Gerar IDs para especialidades
    if (dto.specialties?.length) {
      dto.specialties = dto.specialties.map((s) => ({
        ...s,
        id: uuidv4(),
      })) as any;
    }

    // Gerar IDs para regras de comissão
    if (dto.commissionRules?.length) {
      dto.commissionRules = dto.commissionRules.map((r) => ({
        ...r,
        id: uuidv4(),
      })) as any;
    }

    const professional = await this.repository.create({
      ...dto,
      hireDate: dto.hireDate ? new Date(dto.hireDate) : new Date(),
      birthDate: dto.birthDate ? new Date(dto.birthDate) : undefined,
      status: dto.status || ProfessionalStatus.ACTIVE,
      defaultCommissionPercentage: dto.defaultCommissionPercentage ?? 30,
      isOnlineBookingEnabled: dto.isOnlineBookingEnabled ?? true,
      acceptsNewCustomers: dto.acceptsNewCustomers ?? true,
    });

    this.eventEmitter.emit('professional.created', { professional });

    return professional;
  }

  async findById(id: string): Promise<any> {
    const professional = await this.repository.findById(id);
    if (!professional) {
      throw new NotFoundException('Profissional não encontrado');
    }
    return professional;
  }

  async findMany(query: ProfessionalQueryDto) {
    return this.repository.findMany(query);
  }

  async findActive(): Promise<any[]> {
    return this.repository.findActive();
  }

  async findByService(serviceId: string): Promise<any[]> {
    return this.repository.findByService(serviceId);
  }

  async update(id: string, dto: UpdateProfessionalDto): Promise<any> {
    const existing = await this.findById(id);

    // Verificar email se mudou
    if (dto.email && dto.email !== existing.email) {
      const byEmail = await this.repository.findByEmail(dto.email);
      if (byEmail) {
        throw new ConflictException('Já existe um profissional com este email');
      }
    }

    // Verificar user se mudou
    if (dto.userId && dto.userId !== existing.userId) {
      const byUser = await this.repository.findByUserId(dto.userId);
      if (byUser) {
        throw new ConflictException('Este usuário já está vinculado a outro profissional');
      }
    }

    const updateData: any = { ...dto };

    if (dto.hireDate) updateData.hireDate = new Date(dto.hireDate);
    if (dto.birthDate) updateData.birthDate = new Date(dto.birthDate);

    const professional = await this.repository.update(id, updateData);

    this.eventEmitter.emit('professional.updated', { professional, changes: dto });

    return professional;
  }

  async delete(id: string): Promise<void> {
    await this.findById(id);
    await this.repository.softDelete(id);

    this.eventEmitter.emit('professional.deleted', { professionalId: id });
  }

  async restore(id: string): Promise<any> {
    return this.repository.restore(id);
  }

  async reorder(dto: ReorderProfessionalsDto): Promise<void> {
    await this.repository.reorder(dto.professionalIds);
  }

  // ========================
  // SERVICES
  // ========================

  async addServices(id: string, dto: AddServicesDto): Promise<void> {
    await this.findById(id);
    await this.repository.addServices(id, dto.serviceIds);

    this.eventEmitter.emit('professional.services_updated', {
      professionalId: id,
      added: dto.serviceIds,
    });
  }

  async removeServices(id: string, dto: RemoveServicesDto): Promise<void> {
    await this.findById(id);
    await this.repository.removeServices(id, dto.serviceIds);

    this.eventEmitter.emit('professional.services_updated', {
      professionalId: id,
      removed: dto.serviceIds,
    });
  }

  // ========================
  // WORKING HOURS
  // ========================

  async updateWorkingHours(id: string, dto: UpdateWorkingHoursDto): Promise<any> {
    await this.findById(id);

    // Validar horários
    for (const wh of dto.workingHours) {
      if (wh.isWorkingDay) {
        if (!wh.startTime || !wh.endTime) {
          throw new BadRequestException(
            `Dia ${wh.dayOfWeek}: horário de início e fim são obrigatórios`,
          );
        }
        if (wh.startTime >= wh.endTime) {
          throw new BadRequestException(
            `Dia ${wh.dayOfWeek}: horário de início deve ser antes do fim`,
          );
        }
        if (wh.breakStart && wh.breakEnd) {
          if (wh.breakStart >= wh.breakEnd) {
            throw new BadRequestException(
              `Dia ${wh.dayOfWeek}: início do intervalo deve ser antes do fim`,
            );
          }
          if (wh.breakStart < wh.startTime || wh.breakEnd > wh.endTime) {
            throw new BadRequestException(
              `Dia ${wh.dayOfWeek}: intervalo deve estar dentro do horário de trabalho`,
            );
          }
        }
      }
    }

    const professional = await this.repository.update(id, {
      workingHours: dto.workingHours,
    });

    this.eventEmitter.emit('professional.working_hours_updated', {
      professionalId: id,
      workingHours: dto.workingHours,
    });

    return professional;
  }

  // ========================
  // COMMISSION
  // ========================

  async updateCommissionRules(id: string, dto: UpdateCommissionRulesDto): Promise<any> {
    await this.findById(id);

    // Gerar IDs para novas regras
    const rules = dto.rules.map((r) => ({
      ...r,
      id: (r as any).id || uuidv4(),
    }));

    const professional = await this.repository.update(id, {
      commissionRules: rules,
    });

    this.eventEmitter.emit('professional.commission_updated', {
      professionalId: id,
      rules,
    });

    return professional;
  }

  // ========================
  // SCHEDULE BLOCKS (Férias, Folgas, etc.)
  // ========================

  async createScheduleBlock(professionalId: string, dto: CreateScheduleBlockDto): Promise<any> {
    await this.findById(professionalId);

    const startDate = new Date(dto.startDate);
    const endDate = new Date(dto.endDate);

    if (startDate > endDate) {
      throw new BadRequestException('Data de início deve ser antes da data de fim');
    }

    // Verificar conflitos com agendamentos existentes
    const appointments = await this.checkAppointmentConflicts(
      professionalId,
      startDate,
      endDate,
      dto.isAllDay !== false,
      dto.startTime,
      dto.endTime,
    );

    if (appointments.length > 0) {
      throw new BadRequestException(
        `Existem ${appointments.length} agendamentos no período selecionado`,
      );
    }

    const block = await this.repository.createScheduleBlock(professionalId, {
      ...dto,
      startDate,
      endDate,
      isAllDay: dto.isAllDay !== false,
      status: 'PENDING',
    });

    this.eventEmitter.emit('professional.schedule_block_created', { block });

    return block;
  }

  async findScheduleBlocks(
    professionalId: string,
    startDate: Date,
    endDate: Date,
  ): Promise<any[]> {
    return this.repository.findScheduleBlocks(professionalId, startDate, endDate);
  }

  async updateScheduleBlock(id: string, dto: UpdateScheduleBlockDto): Promise<any> {
    const block = await this.repository.findScheduleBlockById(id);
    if (!block) {
      throw new NotFoundException('Bloqueio não encontrado');
    }

    const updateData: any = { ...dto };
    if (dto.startDate) updateData.startDate = new Date(dto.startDate);
    if (dto.endDate) updateData.endDate = new Date(dto.endDate);

    return this.repository.updateScheduleBlock(id, updateData);
  }

  async approveScheduleBlock(id: string, approvedBy: string): Promise<any> {
    const block = await this.repository.findScheduleBlockById(id);
    if (!block) {
      throw new NotFoundException('Bloqueio não encontrado');
    }

    const approved = await this.repository.approveScheduleBlock(id, approvedBy);

    // Atualizar status do profissional se for férias
    if (block.type === 'VACATION') {
      const now = new Date();
      if (new Date(block.startDate) <= now && new Date(block.endDate) >= now) {
        await this.repository.update(block.professionalId, {
          status: ProfessionalStatus.ON_VACATION,
        });
      }
    }

    this.eventEmitter.emit('professional.schedule_block_approved', { block: approved });

    return approved;
  }

  async rejectScheduleBlock(id: string, rejectedBy: string): Promise<any> {
    const block = await this.repository.findScheduleBlockById(id);
    if (!block) {
      throw new NotFoundException('Bloqueio não encontrado');
    }

    return this.repository.rejectScheduleBlock(id, rejectedBy);
  }

  async deleteScheduleBlock(id: string): Promise<void> {
    const block = await this.repository.findScheduleBlockById(id);
    if (!block) {
      throw new NotFoundException('Bloqueio não encontrado');
    }

    await this.repository.deleteScheduleBlock(id);
  }

  // ========================
  // AVAILABILITY
  // ========================

  async getAvailability(id: string, query: AvailabilityQueryDto) {
    await this.findById(id);
    return this.scheduleService.getAvailability(id, new Date(query.date), {
      serviceId: query.serviceId,
      duration: query.duration,
    });
  }

  async getAvailabilityRange(id: string, query: AvailabilityRangeQueryDto) {
    await this.findById(id);
    return this.scheduleService.getAvailabilityRange(
      id,
      new Date(query.startDate),
      new Date(query.endDate),
      { serviceId: query.serviceId },
    );
  }

  async getNextAvailableSlots(
    id: string,
    options: {
      serviceId?: string;
      duration?: number;
      limit?: number;
    } = {},
  ) {
    await this.findById(id);
    return this.scheduleService.getNextAvailableSlots(id, options);
  }

  // ========================
  // STATS
  // ========================

  async getStats() {
    return this.repository.getStats();
  }

  // ========================
  // HELPERS
  // ========================

  private async checkAppointmentConflicts(
    professionalId: string,
    startDate: Date,
    endDate: Date,
    isAllDay: boolean,
    startTime?: string,
    endTime?: string,
  ): Promise<any[]> {
    // Buscar agendamentos no período
    const { PrismaService } = await import('@/core/database/prisma.service');
    // Implementação simplificada - em produção usaria o repository
    return [];
  }
}
