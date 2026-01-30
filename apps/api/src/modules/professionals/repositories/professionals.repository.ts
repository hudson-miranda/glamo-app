import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '@/core/database/prisma.service';
import { TenantContext } from '@/core/tenancy/tenant-context';
import { Prisma } from '@prisma/client';
import { ProfessionalQueryDto, ProfessionalSortBy, SortDirection } from '../dto';

export interface PaginatedProfessionals {
  data: any[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

@Injectable()
export class ProfessionalsRepository {
  private readonly logger = new Logger(ProfessionalsRepository.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly tenantContext: TenantContext,
  ) {}

  private get tenantId(): string {
    return this.tenantContext.getTenantId();
  }

  async create(data: any): Promise<any> {
    return this.prisma.professional.create({
      data: {
        ...data,
        tenantId: this.tenantId,
      },
      include: {
        services: true,
        user: {
          select: { id: true, email: true, name: true },
        },
      },
    });
  }

  async findById(id: string): Promise<any | null> {
    return this.prisma.professional.findFirst({
      where: {
        id,
        tenantId: this.tenantId,
        deletedAt: null,
      },
      include: {
        services: true,
        user: {
          select: { id: true, email: true, name: true },
        },
        scheduleBlocks: {
          where: {
            endDate: { gte: new Date() },
          },
          orderBy: { startDate: 'asc' },
        },
      },
    });
  }

  async findByEmail(email: string): Promise<any | null> {
    return this.prisma.professional.findFirst({
      where: {
        email,
        tenantId: this.tenantId,
        deletedAt: null,
      },
    });
  }

  async findByUserId(userId: string): Promise<any | null> {
    return this.prisma.professional.findFirst({
      where: {
        userId,
        tenantId: this.tenantId,
        deletedAt: null,
      },
    });
  }

  async findMany(query: ProfessionalQueryDto): Promise<PaginatedProfessionals> {
    const {
      page = 1,
      limit = 20,
      search,
      status,
      contractType,
      serviceId,
      specialty,
      isOnlineBookingEnabled,
      acceptsNewCustomers,
      sortBy = ProfessionalSortBy.DISPLAY_ORDER,
      sortDirection = SortDirection.ASC,
      includeDeleted = false,
    } = query;

    const where: Prisma.ProfessionalWhereInput = {
      tenantId: this.tenantId,
    };

    if (!includeDeleted) {
      where.deletedAt = null;
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search } },
      ];
    }

    if (status) {
      where.status = status;
    }

    if (contractType) {
      where.contractType = contractType;
    }

    if (serviceId) {
      where.services = {
        some: { id: serviceId },
      };
    }

    if (specialty) {
      where.specialties = {
        path: ['$[*].name'],
        string_contains: specialty,
      };
    }

    if (isOnlineBookingEnabled !== undefined) {
      where.isOnlineBookingEnabled = isOnlineBookingEnabled;
    }

    if (acceptsNewCustomers !== undefined) {
      where.acceptsNewCustomers = acceptsNewCustomers;
    }

    const [data, total] = await Promise.all([
      this.prisma.professional.findMany({
        where,
        include: {
          services: {
            select: { id: true, name: true },
          },
          _count: {
            select: { appointments: true },
          },
        },
        orderBy: { [sortBy]: sortDirection },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.professional.count({ where }),
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
        hasPrev: page > 1,
      },
    };
  }

  async findActive(): Promise<any[]> {
    return this.prisma.professional.findMany({
      where: {
        tenantId: this.tenantId,
        deletedAt: null,
        status: 'ACTIVE',
      },
      orderBy: { displayOrder: 'asc' },
    });
  }

  async findByService(serviceId: string): Promise<any[]> {
    return this.prisma.professional.findMany({
      where: {
        tenantId: this.tenantId,
        deletedAt: null,
        status: 'ACTIVE',
        services: {
          some: { id: serviceId },
        },
      },
      orderBy: { displayOrder: 'asc' },
    });
  }

  async update(id: string, data: any): Promise<any> {
    return this.prisma.professional.update({
      where: { id },
      data,
      include: {
        services: true,
        user: {
          select: { id: true, email: true, name: true },
        },
      },
    });
  }

  async softDelete(id: string): Promise<void> {
    await this.prisma.professional.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  async restore(id: string): Promise<any> {
    return this.prisma.professional.update({
      where: { id },
      data: { deletedAt: null },
    });
  }

  async addServices(id: string, serviceIds: string[]): Promise<void> {
    await this.prisma.professional.update({
      where: { id },
      data: {
        services: {
          connect: serviceIds.map((sid) => ({ id: sid })),
        },
      },
    });
  }

  async removeServices(id: string, serviceIds: string[]): Promise<void> {
    await this.prisma.professional.update({
      where: { id },
      data: {
        services: {
          disconnect: serviceIds.map((sid) => ({ id: sid })),
        },
      },
    });
  }

  async reorder(professionalIds: string[]): Promise<void> {
    const updates = professionalIds.map((id, index) =>
      this.prisma.professional.update({
        where: { id },
        data: { displayOrder: index },
      }),
    );
    await this.prisma.$transaction(updates);
  }

  // ========================
  // SCHEDULE BLOCKS
  // ========================

  async createScheduleBlock(professionalId: string, data: any): Promise<any> {
    return this.prisma.scheduleBlock.create({
      data: {
        ...data,
        professionalId,
        tenantId: this.tenantId,
      },
    });
  }

  async findScheduleBlocks(
    professionalId: string,
    startDate: Date,
    endDate: Date,
  ): Promise<any[]> {
    return this.prisma.scheduleBlock.findMany({
      where: {
        professionalId,
        tenantId: this.tenantId,
        OR: [
          {
            startDate: { lte: endDate },
            endDate: { gte: startDate },
          },
        ],
      },
      orderBy: { startDate: 'asc' },
    });
  }

  async findScheduleBlockById(id: string): Promise<any | null> {
    return this.prisma.scheduleBlock.findFirst({
      where: {
        id,
        tenantId: this.tenantId,
      },
    });
  }

  async updateScheduleBlock(id: string, data: any): Promise<any> {
    return this.prisma.scheduleBlock.update({
      where: { id },
      data,
    });
  }

  async deleteScheduleBlock(id: string): Promise<void> {
    await this.prisma.scheduleBlock.delete({
      where: { id },
    });
  }

  async approveScheduleBlock(id: string, approvedBy: string): Promise<any> {
    return this.prisma.scheduleBlock.update({
      where: { id },
      data: {
        status: 'APPROVED',
        approvedBy,
        approvedAt: new Date(),
      },
    });
  }

  async rejectScheduleBlock(id: string, rejectedBy: string): Promise<any> {
    return this.prisma.scheduleBlock.update({
      where: { id },
      data: {
        status: 'REJECTED',
        approvedBy: rejectedBy,
        approvedAt: new Date(),
      },
    });
  }

  // ========================
  // METRICS
  // ========================

  async updateMetrics(id: string, metrics: any): Promise<void> {
    await this.prisma.professional.update({
      where: { id },
      data: { metrics },
    });
  }

  async getStats(): Promise<{
    total: number;
    active: number;
    onVacation: number;
    onLeave: number;
    avgRating: number;
  }> {
    const [total, active, onVacation, onLeave, avgRating] = await Promise.all([
      this.prisma.professional.count({
        where: { tenantId: this.tenantId, deletedAt: null },
      }),
      this.prisma.professional.count({
        where: { tenantId: this.tenantId, deletedAt: null, status: 'ACTIVE' },
      }),
      this.prisma.professional.count({
        where: { tenantId: this.tenantId, deletedAt: null, status: 'ON_VACATION' },
      }),
      this.prisma.professional.count({
        where: { tenantId: this.tenantId, deletedAt: null, status: 'ON_LEAVE' },
      }),
      this.prisma.professional.aggregate({
        where: { tenantId: this.tenantId, deletedAt: null },
        _avg: { averageRating: true },
      }),
    ]);

    return {
      total,
      active,
      onVacation,
      onLeave,
      avgRating: avgRating._avg.averageRating || 0,
    };
  }
}
