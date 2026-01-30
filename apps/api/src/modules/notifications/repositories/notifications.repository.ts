import { Injectable } from '@nestjs/common';
import { PrismaService } from '@glamo/database';
import { TenantContext } from '@/core/tenancy';
import {
  NotificationQueryDto,
  TemplateQueryDto,
  BulkNotificationQueryDto,
  DeviceTokenQueryDto,
} from '../dto';
import { v4 as uuid } from 'uuid';

@Injectable()
export class NotificationsRepository {
  constructor(
    private readonly prisma: PrismaService,
    private readonly tenantContext: TenantContext,
  ) {}

  private get tenantId(): string {
    return this.tenantContext.requireTenantId();
  }

  // ========================
  // NOTIFICATIONS
  // ========================

  async createNotification(data: any): Promise<any> {
    return this.prisma.notification.create({
      data: {
        id: uuid(),
        tenantId: this.tenantId,
        ...data,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    });
  }

  async createManyNotifications(data: any[]): Promise<number> {
    const result = await this.prisma.notification.createMany({
      data: data.map(item => ({
        id: uuid(),
        tenantId: this.tenantId,
        ...item,
        createdAt: new Date(),
        updatedAt: new Date(),
      })),
    });
    return result.count;
  }

  async findNotifications(query: NotificationQueryDto) {
    const where: any = { tenantId: this.tenantId };

    if (query.type) where.type = query.type;
    if (query.category) where.category = query.category;
    if (query.status) where.status = query.status;
    if (query.priority) where.priority = query.priority;
    if (query.recipientId) where.recipientId = query.recipientId;
    if (query.recipientType) where.recipientType = query.recipientType;
    if (query.startDate || query.endDate) {
      where.createdAt = {};
      if (query.startDate) where.createdAt.gte = new Date(query.startDate);
      if (query.endDate) where.createdAt.lte = new Date(query.endDate);
    }

    const [data, total] = await Promise.all([
      this.prisma.notification.findMany({
        where,
        skip: ((query.page || 1) - 1) * (query.limit || 20),
        take: query.limit || 20,
        orderBy: { createdAt: 'desc' },
        include: { template: true },
      }),
      this.prisma.notification.count({ where }),
    ]);

    return {
      data,
      total,
      page: query.page || 1,
      limit: query.limit || 20,
      totalPages: Math.ceil(total / (query.limit || 20)),
    };
  }

  async findNotificationById(id: string): Promise<any> {
    return this.prisma.notification.findFirst({
      where: { id, tenantId: this.tenantId },
      include: { template: true },
    });
  }

  async updateNotification(id: string, data: any): Promise<any> {
    return this.prisma.notification.update({
      where: { id },
      data: {
        ...data,
        updatedAt: new Date(),
      },
    });
  }

  async findPendingNotifications(limit: number = 100): Promise<any[]> {
    return this.prisma.notification.findMany({
      where: {
        tenantId: this.tenantId,
        status: 'pending',
        OR: [
          { scheduledAt: null },
          { scheduledAt: { lte: new Date() } },
        ],
      },
      orderBy: [
        { priority: 'desc' },
        { createdAt: 'asc' },
      ],
      take: limit,
    });
  }

  async findScheduledNotifications(until: Date): Promise<any[]> {
    return this.prisma.notification.findMany({
      where: {
        tenantId: this.tenantId,
        status: 'pending',
        scheduledAt: {
          lte: until,
        },
      },
      orderBy: { scheduledAt: 'asc' },
    });
  }

  // ========================
  // TEMPLATES
  // ========================

  async createTemplate(data: any): Promise<any> {
    return this.prisma.notificationTemplate.create({
      data: {
        id: uuid(),
        tenantId: this.tenantId,
        ...data,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    });
  }

  async findTemplates(query: TemplateQueryDto) {
    const where: any = { tenantId: this.tenantId };

    if (query.type) where.type = query.type;
    if (query.channel) where.channels = { has: query.channel };
    if (query.isActive !== undefined) where.isActive = query.isActive;
    if (query.isDefault !== undefined) where.isDefault = query.isDefault;
    if (query.search) {
      where.OR = [
        { name: { contains: query.search, mode: 'insensitive' } },
        { code: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    const [data, total] = await Promise.all([
      this.prisma.notificationTemplate.findMany({
        where,
        skip: ((query.page || 1) - 1) * (query.limit || 20),
        take: query.limit || 20,
        orderBy: { name: 'asc' },
      }),
      this.prisma.notificationTemplate.count({ where }),
    ]);

    return {
      data,
      total,
      page: query.page || 1,
      limit: query.limit || 20,
      totalPages: Math.ceil(total / (query.limit || 20)),
    };
  }

  async findTemplateById(id: string): Promise<any> {
    return this.prisma.notificationTemplate.findFirst({
      where: { id, tenantId: this.tenantId },
    });
  }

  async findTemplateByCode(code: string): Promise<any> {
    return this.prisma.notificationTemplate.findFirst({
      where: { code, tenantId: this.tenantId },
    });
  }

  async updateTemplate(id: string, data: any): Promise<any> {
    return this.prisma.notificationTemplate.update({
      where: { id },
      data: {
        ...data,
        updatedAt: new Date(),
      },
    });
  }

  async deleteTemplate(id: string): Promise<void> {
    await this.prisma.notificationTemplate.delete({ where: { id } });
  }

  // ========================
  // PREFERENCES
  // ========================

  async findPreferences(recipientId: string, recipientType: string): Promise<any> {
    return this.prisma.notificationPreference.findFirst({
      where: {
        tenantId: this.tenantId,
        recipientId,
        recipientType,
      },
    });
  }

  async upsertPreferences(
    recipientId: string,
    recipientType: string,
    data: any,
  ): Promise<any> {
    return this.prisma.notificationPreference.upsert({
      where: {
        tenantId_recipientId_recipientType: {
          tenantId: this.tenantId,
          recipientId,
          recipientType,
        },
      },
      create: {
        id: uuid(),
        tenantId: this.tenantId,
        recipientId,
        recipientType,
        ...data,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      update: {
        ...data,
        updatedAt: new Date(),
      },
    });
  }

  // ========================
  // DEVICE TOKENS
  // ========================

  async createDeviceToken(data: any): Promise<any> {
    return this.prisma.deviceToken.create({
      data: {
        id: uuid(),
        tenantId: this.tenantId,
        ...data,
        isActive: true,
        lastUsedAt: new Date(),
        createdAt: new Date(),
      },
    });
  }

  async findDeviceTokens(query: DeviceTokenQueryDto): Promise<any[]> {
    const where: any = { tenantId: this.tenantId };

    if (query.userId) where.userId = query.userId;
    if (query.userType) where.userType = query.userType;
    if (query.platform) where.platform = query.platform;
    if (query.isActive !== undefined) where.isActive = query.isActive;

    return this.prisma.deviceToken.findMany({
      where,
      orderBy: { lastUsedAt: 'desc' },
    });
  }

  async findDeviceTokensByUserId(userId: string): Promise<any[]> {
    return this.prisma.deviceToken.findMany({
      where: {
        tenantId: this.tenantId,
        userId,
        isActive: true,
      },
    });
  }

  async findDeviceTokenByToken(token: string): Promise<any> {
    return this.prisma.deviceToken.findFirst({
      where: {
        tenantId: this.tenantId,
        token,
      },
    });
  }

  async updateDeviceToken(id: string, data: any): Promise<any> {
    return this.prisma.deviceToken.update({
      where: { id },
      data,
    });
  }

  async deactivateDeviceToken(token: string): Promise<void> {
    await this.prisma.deviceToken.updateMany({
      where: {
        tenantId: this.tenantId,
        token,
      },
      data: { isActive: false },
    });
  }

  async deleteDeviceToken(token: string): Promise<void> {
    await this.prisma.deviceToken.deleteMany({
      where: {
        tenantId: this.tenantId,
        token,
      },
    });
  }

  // ========================
  // BULK NOTIFICATIONS
  // ========================

  async createBulkNotification(data: any): Promise<any> {
    return this.prisma.bulkNotification.create({
      data: {
        id: uuid(),
        tenantId: this.tenantId,
        ...data,
        sentCount: 0,
        deliveredCount: 0,
        failedCount: 0,
        status: 'draft',
        createdAt: new Date(),
      },
    });
  }

  async findBulkNotifications(query: BulkNotificationQueryDto) {
    const where: any = { tenantId: this.tenantId };

    if (query.status) where.status = query.status;
    if (query.startDate || query.endDate) {
      where.createdAt = {};
      if (query.startDate) where.createdAt.gte = new Date(query.startDate);
      if (query.endDate) where.createdAt.lte = new Date(query.endDate);
    }

    const [data, total] = await Promise.all([
      this.prisma.bulkNotification.findMany({
        where,
        skip: ((query.page || 1) - 1) * (query.limit || 20),
        take: query.limit || 20,
        orderBy: { createdAt: 'desc' },
        include: { template: true },
      }),
      this.prisma.bulkNotification.count({ where }),
    ]);

    return {
      data,
      total,
      page: query.page || 1,
      limit: query.limit || 20,
      totalPages: Math.ceil(total / (query.limit || 20)),
    };
  }

  async findBulkNotificationById(id: string): Promise<any> {
    return this.prisma.bulkNotification.findFirst({
      where: { id, tenantId: this.tenantId },
      include: { template: true },
    });
  }

  async updateBulkNotification(id: string, data: any): Promise<any> {
    return this.prisma.bulkNotification.update({
      where: { id },
      data,
    });
  }

  // ========================
  // STATISTICS
  // ========================

  async getNotificationStats(startDate?: Date, endDate?: Date): Promise<any> {
    const where: any = { tenantId: this.tenantId };
    if (startDate) where.createdAt = { gte: startDate };
    if (endDate) where.createdAt = { ...where.createdAt, lte: endDate };

    const [total, byStatus, byType, byCategory] = await Promise.all([
      this.prisma.notification.count({ where }),
      this.prisma.notification.groupBy({
        by: ['status'],
        where,
        _count: true,
      }),
      this.prisma.notification.groupBy({
        by: ['type'],
        where,
        _count: true,
      }),
      this.prisma.notification.groupBy({
        by: ['category'],
        where,
        _count: true,
      }),
    ]);

    const statusMap = byStatus.reduce((acc, item) => {
      acc[item.status] = item._count;
      return acc;
    }, {} as Record<string, number>);

    const sent = statusMap['sent'] || 0;
    const delivered = statusMap['delivered'] || 0;
    const failed = statusMap['failed'] || 0;

    return {
      totalSent: sent + delivered,
      totalDelivered: delivered,
      totalFailed: failed,
      deliveryRate: sent + delivered > 0 ? (delivered / (sent + delivered)) * 100 : 0,
      byChannel: byType.reduce((acc, item) => {
        acc[item.type] = {
          sent: item._count,
          delivered: 0,
          failed: 0,
          deliveryRate: 0,
        };
        return acc;
      }, {} as Record<string, any>),
      byCategory: byCategory.reduce((acc, item) => {
        acc[item.category] = item._count;
        return acc;
      }, {} as Record<string, number>),
      byStatus: statusMap,
    };
  }
}
