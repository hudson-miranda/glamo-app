import { Injectable, Logger } from '@nestjs/common';
import { Prisma, Appointment, AppointmentStatus } from '@glamo/database';
import { PrismaService } from '@core/database/prisma.service';
import { TenantContextService } from '@core/tenancy/tenant-context.service';
import { AppointmentQueryDto } from '../dto/appointment-query.dto';

/**
 * Resultado paginado de agendamentos
 */
export interface PaginatedAppointments {
  data: Appointment[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasNext: boolean;
    hasPrevious: boolean;
  };
}

/**
 * Repositório de agendamentos
 * Encapsula todas as operações de banco de dados relacionadas a agendamentos
 */
@Injectable()
export class AppointmentsRepository {
  private readonly logger = new Logger(AppointmentsRepository.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly tenantContext: TenantContextService,
  ) {}

  /**
   * Cria um novo agendamento
   */
  async create(
    data: Prisma.AppointmentUncheckedCreateInput,
  ): Promise<Appointment> {
    return this.prisma.appointment.create({
      data,
      include: this.getDefaultIncludes(),
    });
  }

  /**
   * Cria múltiplos agendamentos (para recorrência)
   */
  async createMany(
    appointments: Prisma.AppointmentUncheckedCreateInput[],
  ): Promise<Appointment[]> {
    const created: Appointment[] = [];

    // Usar transaction para garantir consistência
    await this.prisma.$transaction(async (tx) => {
      for (const data of appointments) {
        const appointment = await tx.appointment.create({
          data,
          include: this.getDefaultIncludes(),
        });
        created.push(appointment);
      }
    });

    return created;
  }

  /**
   * Busca agendamento por ID
   */
  async findById(id: string): Promise<Appointment | null> {
    const tenantId = this.tenantContext.getCurrentTenantId();

    return this.prisma.appointment.findFirst({
      where: {
        id,
        tenantId,
      },
      include: this.getDefaultIncludes(),
    });
  }

  /**
   * Busca agendamento por ID sem filtro de tenant (para uso interno)
   */
  async findByIdInternal(id: string): Promise<Appointment | null> {
    return this.prisma.appointment.findUnique({
      where: { id },
      include: this.getDefaultIncludes(),
    });
  }

  /**
   * Lista agendamentos com filtros e paginação
   */
  async findMany(query: AppointmentQueryDto): Promise<PaginatedAppointments> {
    const tenantId = this.tenantContext.getCurrentTenantId();
    const {
      professionalId,
      clientId,
      startDate,
      endDate,
      status,
      search,
      sortBy = 'scheduledAt',
      sortOrder = 'asc',
      page = 1,
      limit = 20,
    } = query;

    const where: Prisma.AppointmentWhereInput = {
      tenantId,
    };

    if (professionalId) {
      where.professionalId = professionalId;
    }

    if (clientId) {
      where.clientId = clientId;
    }

    if (startDate) {
      where.scheduledAt = {
        ...((where.scheduledAt as Prisma.DateTimeFilter) || {}),
        gte: new Date(startDate),
      };
    }

    if (endDate) {
      where.scheduledAt = {
        ...((where.scheduledAt as Prisma.DateTimeFilter) || {}),
        lte: new Date(endDate),
      };
    }

    if (status && status.length > 0) {
      where.status = { in: status };
    }

    if (search) {
      where.OR = [
        {
          client: {
            name: { contains: search, mode: 'insensitive' },
          },
        },
        {
          professional: {
            user: {
              name: { contains: search, mode: 'insensitive' },
            },
          },
        },
        {
          notes: { contains: search, mode: 'insensitive' },
        },
      ];
    }

    // Construir orderBy
    const orderBy: Prisma.AppointmentOrderByWithRelationInput = {};
    if (sortBy === 'clientName') {
      orderBy.client = { name: sortOrder };
    } else if (sortBy === 'professionalName') {
      orderBy.professional = { user: { name: sortOrder } };
    } else {
      orderBy[sortBy] = sortOrder;
    }

    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      this.prisma.appointment.findMany({
        where,
        include: this.getDefaultIncludes(),
        orderBy,
        skip,
        take: limit,
      }),
      this.prisma.appointment.count({ where }),
    ]);

    const totalPages = Math.ceil(total / limit);

    return {
      data,
      meta: {
        total,
        page,
        limit,
        totalPages,
        hasNext: page < totalPages,
        hasPrevious: page > 1,
      },
    };
  }

  /**
   * Busca agendamentos por período (para agenda/calendário)
   */
  async findByDateRange(
    startDate: Date,
    endDate: Date,
    professionalId?: string,
  ): Promise<Appointment[]> {
    const tenantId = this.tenantContext.getCurrentTenantId();

    return this.prisma.appointment.findMany({
      where: {
        tenantId,
        professionalId,
        scheduledAt: {
          gte: startDate,
          lte: endDate,
        },
        status: {
          notIn: [AppointmentStatus.CANCELLED],
        },
      },
      include: this.getDefaultIncludes(),
      orderBy: { scheduledAt: 'asc' },
    });
  }

  /**
   * Busca agendamentos de um grupo de recorrência
   */
  async findByRecurrenceGroup(recurrenceGroupId: string): Promise<Appointment[]> {
    const tenantId = this.tenantContext.getCurrentTenantId();

    return this.prisma.appointment.findMany({
      where: {
        tenantId,
        recurrenceGroupId,
      },
      include: this.getDefaultIncludes(),
      orderBy: { scheduledAt: 'asc' },
    });
  }

  /**
   * Atualiza um agendamento
   */
  async update(
    id: string,
    data: Prisma.AppointmentUncheckedUpdateInput,
  ): Promise<Appointment> {
    return this.prisma.appointment.update({
      where: { id },
      data,
      include: this.getDefaultIncludes(),
    });
  }

  /**
   * Atualiza status de um agendamento
   */
  async updateStatus(
    id: string,
    status: AppointmentStatus,
    additionalData?: Partial<Prisma.AppointmentUncheckedUpdateInput>,
  ): Promise<Appointment> {
    return this.prisma.appointment.update({
      where: { id },
      data: {
        status,
        ...additionalData,
      },
      include: this.getDefaultIncludes(),
    });
  }

  /**
   * Deleta um agendamento (soft delete via status)
   */
  async softDelete(id: string, reason?: string): Promise<Appointment> {
    return this.updateStatus(id, AppointmentStatus.CANCELLED, {
      cancellationReason: reason,
      cancelledAt: new Date(),
    });
  }

  /**
   * Conta agendamentos por status
   */
  async countByStatus(
    startDate?: Date,
    endDate?: Date,
  ): Promise<Record<AppointmentStatus, number>> {
    const tenantId = this.tenantContext.getCurrentTenantId();

    const where: Prisma.AppointmentWhereInput = { tenantId };

    if (startDate && endDate) {
      where.scheduledAt = {
        gte: startDate,
        lte: endDate,
      };
    }

    const counts = await this.prisma.appointment.groupBy({
      by: ['status'],
      where,
      _count: true,
    });

    const result: Record<string, number> = {};
    for (const status of Object.values(AppointmentStatus)) {
      const found = counts.find((c) => c.status === status);
      result[status] = found?._count ?? 0;
    }

    return result as Record<AppointmentStatus, number>;
  }

  /**
   * Conta agendamentos do mês atual (para limites de plano)
   */
  async countCurrentMonth(): Promise<number> {
    const tenantId = this.tenantContext.getCurrentTenantId();
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

    return this.prisma.appointment.count({
      where: {
        tenantId,
        createdAt: {
          gte: startOfMonth,
          lte: endOfMonth,
        },
        status: {
          notIn: [AppointmentStatus.CANCELLED],
        },
      },
    });
  }

  /**
   * Busca próximos agendamentos do cliente
   */
  async findUpcomingByClient(
    clientId: string,
    limit: number = 5,
  ): Promise<Appointment[]> {
    const tenantId = this.tenantContext.getCurrentTenantId();

    return this.prisma.appointment.findMany({
      where: {
        tenantId,
        clientId,
        scheduledAt: { gte: new Date() },
        status: {
          notIn: [AppointmentStatus.CANCELLED, AppointmentStatus.NO_SHOW],
        },
      },
      include: this.getDefaultIncludes(),
      orderBy: { scheduledAt: 'asc' },
      take: limit,
    });
  }

  /**
   * Busca histórico de agendamentos do cliente
   */
  async findHistoryByClient(
    clientId: string,
    page: number = 1,
    limit: number = 10,
  ): Promise<PaginatedAppointments> {
    const tenantId = this.tenantContext.getCurrentTenantId();
    const skip = (page - 1) * limit;

    const where: Prisma.AppointmentWhereInput = {
      tenantId,
      clientId,
      scheduledAt: { lt: new Date() },
    };

    const [data, total] = await Promise.all([
      this.prisma.appointment.findMany({
        where,
        include: this.getDefaultIncludes(),
        orderBy: { scheduledAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.appointment.count({ where }),
    ]);

    const totalPages = Math.ceil(total / limit);

    return {
      data,
      meta: {
        total,
        page,
        limit,
        totalPages,
        hasNext: page < totalPages,
        hasPrevious: page > 1,
      },
    };
  }

  /**
   * Includes padrão para queries
   */
  private getDefaultIncludes(): Prisma.AppointmentInclude {
    return {
      client: {
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
        },
      },
      professional: {
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      },
      services: {
        include: {
          service: {
            select: {
              id: true,
              name: true,
              duration: true,
              price: true,
            },
          },
        },
      },
    };
  }
}
