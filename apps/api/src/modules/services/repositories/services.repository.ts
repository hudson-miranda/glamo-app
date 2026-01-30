import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '@/core/database/prisma.service';
import { TenantContext } from '@/core/tenancy/tenant-context';
import { Prisma } from '@prisma/client';
import { ServiceQueryDto, ServiceSortBy, SortDirection, CategoryQueryDto } from '../dto';

export interface PaginatedServices {
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
export class ServicesRepository {
  private readonly logger = new Logger(ServicesRepository.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly tenantContext: TenantContext,
  ) {}

  private get tenantId(): string {
    return this.tenantContext.getTenantId();
  }

  // ========================
  // CATEGORIES
  // ========================

  async createCategory(data: Prisma.ServiceCategoryCreateInput): Promise<any> {
    return this.prisma.serviceCategory.create({
      data: {
        ...data,
        tenantId: this.tenantId,
      },
    });
  }

  async findCategoryById(id: string): Promise<any | null> {
    return this.prisma.serviceCategory.findFirst({
      where: {
        id,
        tenantId: this.tenantId,
      },
      include: {
        children: true,
        _count: { select: { services: true } },
      },
    });
  }

  async findCategoryBySlug(slug: string): Promise<any | null> {
    return this.prisma.serviceCategory.findFirst({
      where: {
        slug,
        tenantId: this.tenantId,
      },
    });
  }

  async findCategories(query: CategoryQueryDto): Promise<any[]> {
    const where: Prisma.ServiceCategoryWhereInput = {
      tenantId: this.tenantId,
    };

    if (query.activeOnly) {
      where.isActive = true;
    }

    if (query.parentId) {
      where.parentId = query.parentId;
    } else if (query.includeChildren) {
      where.parentId = null; // Root categories only
    }

    const categories = await this.prisma.serviceCategory.findMany({
      where,
      include: {
        children: query.includeChildren
          ? {
              where: query.activeOnly ? { isActive: true } : undefined,
              orderBy: { displayOrder: 'asc' },
            }
          : false,
        _count: query.includeServicesCount
          ? { select: { services: true } }
          : false,
      },
      orderBy: { displayOrder: 'asc' },
    });

    return categories.map((cat) => ({
      ...cat,
      servicesCount: cat._count?.services || 0,
    }));
  }

  async updateCategory(id: string, data: Prisma.ServiceCategoryUpdateInput): Promise<any> {
    return this.prisma.serviceCategory.update({
      where: { id },
      data,
    });
  }

  async deleteCategory(id: string): Promise<void> {
    await this.prisma.serviceCategory.delete({
      where: { id },
    });
  }

  async reorderCategories(categoryIds: string[]): Promise<void> {
    const updates = categoryIds.map((id, index) =>
      this.prisma.serviceCategory.update({
        where: { id },
        data: { displayOrder: index },
      }),
    );
    await this.prisma.$transaction(updates);
  }

  // ========================
  // SERVICES
  // ========================

  async create(data: any): Promise<any> {
    const slug = await this.generateSlug(data.name);
    
    return this.prisma.service.create({
      data: {
        ...data,
        slug,
        tenantId: this.tenantId,
      },
      include: {
        category: true,
        professionals: true,
      },
    });
  }

  async findById(id: string): Promise<any | null> {
    return this.prisma.service.findFirst({
      where: {
        id,
        tenantId: this.tenantId,
        deletedAt: null,
      },
      include: {
        category: true,
        professionals: true,
      },
    });
  }

  async findBySlug(slug: string): Promise<any | null> {
    return this.prisma.service.findFirst({
      where: {
        slug,
        tenantId: this.tenantId,
        deletedAt: null,
      },
      include: {
        category: true,
        professionals: true,
      },
    });
  }

  async findMany(query: ServiceQueryDto): Promise<PaginatedServices> {
    const {
      page = 1,
      limit = 20,
      search,
      categoryId,
      categoryIds,
      professionalId,
      type,
      status,
      pricingType,
      priceMin,
      priceMax,
      durationMin,
      durationMax,
      tags,
      isPopular,
      isFeatured,
      isOnlineBookingEnabled,
      sortBy = ServiceSortBy.DISPLAY_ORDER,
      sortDirection = SortDirection.ASC,
      includeDeleted = false,
    } = query;

    const where: Prisma.ServiceWhereInput = {
      tenantId: this.tenantId,
    };

    if (!includeDeleted) {
      where.deletedAt = null;
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { tags: { hasSome: [search] } },
      ];
    }

    if (categoryId) {
      where.categoryId = categoryId;
    }

    if (categoryIds?.length) {
      where.categoryId = { in: categoryIds };
    }

    if (professionalId) {
      where.professionals = {
        some: { id: professionalId },
      };
    }

    if (type) {
      where.type = type;
    }

    if (status) {
      where.status = status;
    }

    if (pricingType) {
      where.pricingType = pricingType;
    }

    if (priceMin !== undefined || priceMax !== undefined) {
      where.price = {};
      if (priceMin !== undefined) where.price.gte = priceMin;
      if (priceMax !== undefined) where.price.lte = priceMax;
    }

    if (durationMin !== undefined || durationMax !== undefined) {
      where.duration = {};
      if (durationMin !== undefined) where.duration.gte = durationMin;
      if (durationMax !== undefined) where.duration.lte = durationMax;
    }

    if (tags?.length) {
      where.tags = { hasSome: tags };
    }

    if (isPopular !== undefined) {
      where.isPopular = isPopular;
    }

    if (isFeatured !== undefined) {
      where.isFeatured = isFeatured;
    }

    if (isOnlineBookingEnabled !== undefined) {
      where.isOnlineBookingEnabled = isOnlineBookingEnabled;
    }

    const [data, total] = await Promise.all([
      this.prisma.service.findMany({
        where,
        include: {
          category: true,
          professionals: {
            select: { id: true, name: true },
          },
        },
        orderBy: { [sortBy]: sortDirection },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.service.count({ where }),
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

  async findByCategory(categoryId: string): Promise<any[]> {
    return this.prisma.service.findMany({
      where: {
        tenantId: this.tenantId,
        categoryId,
        deletedAt: null,
        status: 'ACTIVE',
      },
      include: {
        professionals: {
          select: { id: true, name: true },
        },
      },
      orderBy: { displayOrder: 'asc' },
    });
  }

  async findByProfessional(professionalId: string): Promise<any[]> {
    return this.prisma.service.findMany({
      where: {
        tenantId: this.tenantId,
        professionals: {
          some: { id: professionalId },
        },
        deletedAt: null,
        status: 'ACTIVE',
      },
      include: {
        category: true,
      },
      orderBy: { displayOrder: 'asc' },
    });
  }

  async update(id: string, data: any): Promise<any> {
    // Se mudou nome, atualizar slug
    if (data.name) {
      data.slug = await this.generateSlug(data.name, id);
    }

    return this.prisma.service.update({
      where: { id },
      data,
      include: {
        category: true,
        professionals: true,
      },
    });
  }

  async softDelete(id: string): Promise<void> {
    await this.prisma.service.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  async restore(id: string): Promise<any> {
    return this.prisma.service.update({
      where: { id },
      data: { deletedAt: null },
    });
  }

  async reorderServices(serviceIds: string[], categoryId?: string): Promise<void> {
    const updates = serviceIds.map((id, index) =>
      this.prisma.service.update({
        where: { id },
        data: { displayOrder: index },
      }),
    );
    await this.prisma.$transaction(updates);
  }

  async addProfessional(serviceId: string, professionalId: string): Promise<void> {
    await this.prisma.service.update({
      where: { id: serviceId },
      data: {
        professionals: {
          connect: { id: professionalId },
        },
      },
    });
  }

  async removeProfessional(serviceId: string, professionalId: string): Promise<void> {
    await this.prisma.service.update({
      where: { id: serviceId },
      data: {
        professionals: {
          disconnect: { id: professionalId },
        },
      },
    });
  }

  async updateMetrics(id: string, metrics: {
    totalBookings?: number;
    averageRating?: number;
    totalReviews?: number;
  }): Promise<void> {
    await this.prisma.service.update({
      where: { id },
      data: metrics,
    });
  }

  async getPopularServices(limit: number = 10): Promise<any[]> {
    return this.prisma.service.findMany({
      where: {
        tenantId: this.tenantId,
        deletedAt: null,
        status: 'ACTIVE',
      },
      orderBy: { totalBookings: 'desc' },
      take: limit,
      include: {
        category: true,
      },
    });
  }

  async getFeaturedServices(): Promise<any[]> {
    return this.prisma.service.findMany({
      where: {
        tenantId: this.tenantId,
        deletedAt: null,
        status: 'ACTIVE',
        isFeatured: true,
      },
      orderBy: { displayOrder: 'asc' },
      include: {
        category: true,
      },
    });
  }

  async getStats(): Promise<{
    total: number;
    active: number;
    inactive: number;
    combos: number;
    packages: number;
    avgPrice: number;
    avgDuration: number;
  }> {
    const [total, active, combos, packages, aggregates] = await Promise.all([
      this.prisma.service.count({
        where: { tenantId: this.tenantId, deletedAt: null },
      }),
      this.prisma.service.count({
        where: { tenantId: this.tenantId, deletedAt: null, status: 'ACTIVE' },
      }),
      this.prisma.service.count({
        where: { tenantId: this.tenantId, deletedAt: null, type: 'COMBO' },
      }),
      this.prisma.service.count({
        where: { tenantId: this.tenantId, deletedAt: null, type: 'PACKAGE' },
      }),
      this.prisma.service.aggregate({
        where: { tenantId: this.tenantId, deletedAt: null },
        _avg: { price: true, duration: true },
      }),
    ]);

    return {
      total,
      active,
      inactive: total - active,
      combos,
      packages,
      avgPrice: aggregates._avg.price || 0,
      avgDuration: aggregates._avg.duration || 0,
    };
  }

  private async generateSlug(name: string, excludeId?: string): Promise<string> {
    const baseSlug = name
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');

    let slug = baseSlug;
    let counter = 1;

    while (true) {
      const existing = await this.prisma.service.findFirst({
        where: {
          tenantId: this.tenantId,
          slug,
          id: excludeId ? { not: excludeId } : undefined,
        },
      });

      if (!existing) break;
      slug = `${baseSlug}-${counter}`;
      counter++;
    }

    return slug;
  }
}
