import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/core/database/prisma.service';
import { TenantContext } from '@/core/tenancy/tenant-context';
import { CustomerQueryDto, SortDirection, CustomerSortBy } from '../dto';
import { Prisma } from '@prisma/client';

/**
 * Interface para resultado paginado
 */
export interface PaginatedCustomers<T> {
  data: T[];
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
 * Repository para operações de clientes
 */
@Injectable()
export class CustomersRepository {
  constructor(
    private readonly prisma: PrismaService,
    private readonly tenantContext: TenantContext,
  ) {}

  /**
   * Cria um novo cliente
   */
  async create(data: Prisma.CustomerCreateInput) {
    const tenantId = this.tenantContext.getTenantId();

    return this.prisma.customer.create({
      data: {
        ...data,
        tenantId,
      },
    });
  }

  /**
   * Busca cliente por ID
   */
  async findById(id: string, includeDeleted = false) {
    const tenantId = this.tenantContext.getTenantId();

    return this.prisma.customer.findFirst({
      where: {
        id,
        tenantId,
        ...(includeDeleted ? {} : { deletedAt: null }),
      },
    });
  }

  /**
   * Busca cliente por email
   */
  async findByEmail(email: string) {
    const tenantId = this.tenantContext.getTenantId();

    return this.prisma.customer.findFirst({
      where: {
        email,
        tenantId,
        deletedAt: null,
      },
    });
  }

  /**
   * Busca cliente por telefone
   */
  async findByPhone(phone: string) {
    const tenantId = this.tenantContext.getTenantId();

    // Normalizar telefone removendo caracteres especiais
    const normalizedPhone = phone.replace(/\D/g, '');

    return this.prisma.customer.findFirst({
      where: {
        phone: {
          contains: normalizedPhone,
        },
        tenantId,
        deletedAt: null,
      },
    });
  }

  /**
   * Busca cliente por CPF
   */
  async findByCpf(cpf: string) {
    const tenantId = this.tenantContext.getTenantId();

    // Normalizar CPF removendo pontos e traços
    const normalizedCpf = cpf.replace(/\D/g, '');

    return this.prisma.customer.findFirst({
      where: {
        cpf: normalizedCpf,
        tenantId,
        deletedAt: null,
      },
    });
  }

  /**
   * Busca clientes com filtros e paginação
   */
  async findMany(query: CustomerQueryDto): Promise<PaginatedCustomers<any>> {
    const tenantId = this.tenantContext.getTenantId();
    const {
      page = 1,
      limit = 20,
      search,
      gender,
      tags,
      loyaltyTier,
      createdFrom,
      createdTo,
      lastVisitFrom,
      lastVisitTo,
      minTotalSpent,
      maxTotalSpent,
      minAppointments,
      maxAppointments,
      acceptsMarketing,
      hasEmail,
      birthdayThisMonth,
      sortBy = CustomerSortBy.NAME,
      sortDirection = SortDirection.ASC,
    } = query;

    // Construir filtro where
    const where: Prisma.CustomerWhereInput = {
      tenantId,
      deletedAt: null,
    };

    // Busca textual
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search.replace(/\D/g, '') } },
      ];
    }

    // Filtros básicos
    if (gender) where.gender = gender;
    if (loyaltyTier) where.loyaltyTier = loyaltyTier;
    if (acceptsMarketing !== undefined) where.acceptsMarketing = acceptsMarketing;
    if (hasEmail !== undefined) {
      where.email = hasEmail ? { not: null } : null;
    }

    // Tags (precisa conter todas as tags especificadas)
    if (tags && tags.length > 0) {
      where.tags = { hasEvery: tags };
    }

    // Filtros de data
    if (createdFrom || createdTo) {
      where.createdAt = {};
      if (createdFrom) where.createdAt.gte = new Date(createdFrom);
      if (createdTo) where.createdAt.lte = new Date(createdTo);
    }

    if (lastVisitFrom || lastVisitTo) {
      where.lastVisitAt = {};
      if (lastVisitFrom) where.lastVisitAt.gte = new Date(lastVisitFrom);
      if (lastVisitTo) where.lastVisitAt.lte = new Date(lastVisitTo);
    }

    // Aniversariantes do mês
    if (birthdayThisMonth) {
      const currentMonth = new Date().getMonth() + 1;
      // Isso requer uma função SQL ou campo calculado
      // Por simplicidade, vamos usar raw query ou campo birthMonth
      where.birthMonth = currentMonth;
    }

    // Filtros de métricas (requer campos calculados ou joins)
    // Serão tratados em uma query mais complexa se necessário

    // Ordenação
    const orderBy: Prisma.CustomerOrderByWithRelationInput = {};
    switch (sortBy) {
      case CustomerSortBy.NAME:
        orderBy.name = sortDirection;
        break;
      case CustomerSortBy.CREATED_AT:
        orderBy.createdAt = sortDirection;
        break;
      case CustomerSortBy.LAST_VISIT:
        orderBy.lastVisitAt = sortDirection;
        break;
      case CustomerSortBy.TOTAL_SPENT:
        orderBy.totalSpent = sortDirection;
        break;
      case CustomerSortBy.TOTAL_APPOINTMENTS:
        orderBy.totalAppointments = sortDirection;
        break;
    }

    // Buscar total
    const total = await this.prisma.customer.count({ where });

    // Buscar dados paginados
    const data = await this.prisma.customer.findMany({
      where,
      orderBy,
      skip: (page - 1) * limit,
      take: limit,
    });

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
   * Atualiza cliente
   */
  async update(id: string, data: Prisma.CustomerUpdateInput) {
    const tenantId = this.tenantContext.getTenantId();

    return this.prisma.customer.updateMany({
      where: {
        id,
        tenantId,
      },
      data,
    });
  }

  /**
   * Atualiza cliente e retorna o resultado
   */
  async updateAndReturn(id: string, data: Prisma.CustomerUpdateInput) {
    const tenantId = this.tenantContext.getTenantId();

    // Primeiro verifica se pertence ao tenant
    const existing = await this.findById(id);
    if (!existing) return null;

    return this.prisma.customer.update({
      where: { id },
      data,
    });
  }

  /**
   * Soft delete
   */
  async softDelete(id: string) {
    return this.update(id, {
      deletedAt: new Date(),
    });
  }

  /**
   * Restaurar cliente deletado
   */
  async restore(id: string) {
    return this.update(id, {
      deletedAt: null,
    });
  }

  /**
   * Busca clientes por IDs
   */
  async findByIds(ids: string[]) {
    const tenantId = this.tenantContext.getTenantId();

    return this.prisma.customer.findMany({
      where: {
        id: { in: ids },
        tenantId,
        deletedAt: null,
      },
    });
  }

  /**
   * Busca duplicados potenciais
   */
  async findDuplicates(field: 'phone' | 'email' | 'cpf') {
    const tenantId = this.tenantContext.getTenantId();

    // Query para encontrar valores duplicados
    const duplicates = await this.prisma.$queryRaw<Array<{ value: string; count: number }>>`
      SELECT ${Prisma.raw(field)} as value, COUNT(*) as count
      FROM "Customer"
      WHERE "tenantId" = ${tenantId}
        AND "deletedAt" IS NULL
        AND ${Prisma.raw(field)} IS NOT NULL
      GROUP BY ${Prisma.raw(field)}
      HAVING COUNT(*) > 1
    `;

    return duplicates;
  }

  /**
   * Busca clientes por campo
   */
  async findByField(field: string, value: string) {
    const tenantId = this.tenantContext.getTenantId();

    return this.prisma.customer.findMany({
      where: {
        [field]: value,
        tenantId,
        deletedAt: null,
      },
    });
  }

  /**
   * Conta clientes por segmento
   */
  async countBySegment(segmentId: string): Promise<number> {
    const tenantId = this.tenantContext.getTenantId();

    return this.prisma.customerSegmentMember.count({
      where: {
        segmentId,
        customer: {
          tenantId,
          deletedAt: null,
        },
      },
    });
  }

  /**
   * Busca clientes de um segmento
   */
  async findBySegment(segmentId: string, page = 1, limit = 20) {
    const tenantId = this.tenantContext.getTenantId();

    const members = await this.prisma.customerSegmentMember.findMany({
      where: {
        segmentId,
        customer: {
          tenantId,
          deletedAt: null,
        },
      },
      include: {
        customer: true,
      },
      skip: (page - 1) * limit,
      take: limit,
    });

    return members.map((m) => m.customer);
  }

  /**
   * Atualiza métricas do cliente
   */
  async updateMetrics(
    id: string,
    metrics: {
      totalAppointments?: number;
      completedAppointments?: number;
      cancelledAppointments?: number;
      noShowCount?: number;
      totalSpent?: number;
    },
  ) {
    return this.prisma.customer.update({
      where: { id },
      data: {
        ...metrics,
        updatedAt: new Date(),
      },
    });
  }

  /**
   * Incrementa pontos de fidelidade
   */
  async addLoyaltyPoints(id: string, points: number) {
    return this.prisma.customer.update({
      where: { id },
      data: {
        loyaltyPoints: {
          increment: points,
        },
      },
    });
  }

  /**
   * Atualiza tier de fidelidade
   */
  async updateLoyaltyTier(id: string, tier: string) {
    return this.prisma.customer.update({
      where: { id },
      data: {
        loyaltyTier: tier,
      },
    });
  }

  /**
   * Atualiza última visita
   */
  async updateLastVisit(id: string, visitDate: Date = new Date()) {
    return this.prisma.customer.update({
      where: { id },
      data: {
        lastVisitAt: visitDate,
      },
    });
  }

  /**
   * Adiciona tags ao cliente
   */
  async addTags(id: string, tags: string[]) {
    const customer = await this.findById(id);
    if (!customer) return null;

    const currentTags = customer.tags as string[];
    const newTags = [...new Set([...currentTags, ...tags])];

    return this.prisma.customer.update({
      where: { id },
      data: { tags: newTags },
    });
  }

  /**
   * Remove tags do cliente
   */
  async removeTags(id: string, tags: string[]) {
    const customer = await this.findById(id);
    if (!customer) return null;

    const currentTags = customer.tags as string[];
    const newTags = currentTags.filter((t) => !tags.includes(t));

    return this.prisma.customer.update({
      where: { id },
      data: { tags: newTags },
    });
  }

  /**
   * Busca aniversariantes
   */
  async findBirthdays(month: number, day?: number) {
    const tenantId = this.tenantContext.getTenantId();

    const where: Prisma.CustomerWhereInput = {
      tenantId,
      deletedAt: null,
      birthMonth: month,
    };

    if (day) {
      where.birthDay = day;
    }

    return this.prisma.customer.findMany({
      where,
      orderBy: { birthDay: 'asc' },
    });
  }

  /**
   * Busca clientes inativos
   */
  async findInactive(daysInactive: number) {
    const tenantId = this.tenantContext.getTenantId();
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysInactive);

    return this.prisma.customer.findMany({
      where: {
        tenantId,
        deletedAt: null,
        lastVisitAt: {
          lt: cutoffDate,
        },
        totalAppointments: {
          gte: 1, // Pelo menos uma visita anterior
        },
      },
    });
  }

  /**
   * Estatísticas gerais de clientes
   */
  async getStats() {
    const tenantId = this.tenantContext.getTenantId();

    const [total, active, newThisMonth, churnedCount] = await Promise.all([
      this.prisma.customer.count({
        where: { tenantId, deletedAt: null },
      }),
      this.prisma.customer.count({
        where: {
          tenantId,
          deletedAt: null,
          lastVisitAt: {
            gte: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000),
          },
        },
      }),
      this.prisma.customer.count({
        where: {
          tenantId,
          deletedAt: null,
          createdAt: {
            gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
          },
        },
      }),
      this.prisma.customer.count({
        where: {
          tenantId,
          deletedAt: null,
          lastVisitAt: {
            lt: new Date(Date.now() - 120 * 24 * 60 * 60 * 1000),
          },
        },
      }),
    ]);

    return {
      total,
      active,
      newThisMonth,
      churned: churnedCount,
      retentionRate: total > 0 ? ((total - churnedCount) / total) * 100 : 0,
    };
  }
}
