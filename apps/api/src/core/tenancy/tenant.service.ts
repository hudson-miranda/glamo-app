import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { TenantPlan, TenantStatus } from '@glamo/database';
import {
  PLAN_CONFIGS,
  TenantPlanConfig,
  TenantPlanFeatures,
  TenantPlanLimits,
  getPlanConfig,
  getPlanLimit,
  isPlanFeatureEnabled,
  isUnlimited,
} from './interfaces';

/**
 * DTO para criação de tenant
 */
export interface CreateTenantDto {
  name: string;
  slug?: string;
  email: string;
  phone?: string;
  document?: string;
  plan?: TenantPlan;
}

/**
 * DTO para atualização de tenant
 */
export interface UpdateTenantDto {
  name?: string;
  phone?: string;
  logo?: string;
  settings?: Record<string, any>;
}

/**
 * Serviço para gerenciamento de tenants
 */
@Injectable()
export class TenantService {
  private readonly logger = new Logger(TenantService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Busca tenant por ID
   */
  async findById(id: string) {
    const tenant = await this.prisma.tenant.findUnique({
      where: { id },
    });

    return tenant;
  }

  /**
   * Busca tenant por slug
   */
  async findBySlug(slug: string) {
    const tenant = await this.prisma.tenant.findUnique({
      where: { slug },
    });

    return tenant;
  }

  /**
   * Busca tenant por domínio customizado
   */
  async findByDomain(domain: string) {
    const tenant = await this.prisma.tenant.findFirst({
      where: {
        slug: domain.split('.')[0], // Tenta extrair slug do subdomínio
      },
    });

    return tenant;
  }

  /**
   * Valida se tenant existe e está ativo
   */
  async validateTenant(tenantId: string): Promise<{
    valid: boolean;
    tenant: any;
    reason?: string;
  }> {
    const tenant = await this.findById(tenantId);

    if (!tenant) {
      return { valid: false, tenant: null, reason: 'Tenant não encontrado' };
    }

    if (tenant.status === TenantStatus.SUSPENDED || tenant.status === TenantStatus.CANCELLED) {
      return { valid: false, tenant, reason: 'Tenant desativado' };
    }

    // Verifica se trial expirou
    if (tenant.status === TenantStatus.TRIAL && tenant.trialEndsAt) {
      if (new Date() > tenant.trialEndsAt) {
        return { valid: false, tenant, reason: 'Período de teste expirado' };
      }
    }

    return { valid: true, tenant };
  }

  /**
   * Obtém configuração do plano do tenant
   */
  async getTenantPlanConfig(tenantId: string): Promise<TenantPlanConfig> {
    const tenant = await this.findById(tenantId);

    if (!tenant) {
      throw new NotFoundException('Tenant não encontrado');
    }

    return getPlanConfig(tenant.plan);
  }

  /**
   * Verifica se feature está habilitada para o tenant
   */
  async hasFeature(tenantId: string, feature: keyof TenantPlanFeatures): Promise<boolean> {
    const tenant = await this.findById(tenantId);

    if (!tenant) {
      return false;
    }

    return isPlanFeatureEnabled(tenant.plan, feature);
  }

  /**
   * Obtém limite do plano do tenant
   */
  async getLimit(tenantId: string, limit: keyof TenantPlanLimits): Promise<number> {
    const tenant = await this.findById(tenantId);

    if (!tenant) {
      return 0;
    }

    return getPlanLimit(tenant.plan, limit);
  }

  /**
   * Verifica se tenant atingiu um limite
   */
  async checkLimit(
    tenantId: string,
    limitType: keyof TenantPlanLimits,
    currentCount: number,
  ): Promise<{ allowed: boolean; limit: number; current: number }> {
    const limit = await this.getLimit(tenantId, limitType);

    // -1 significa ilimitado
    if (isUnlimited(limit)) {
      return { allowed: true, limit: -1, current: currentCount };
    }

    return {
      allowed: currentCount < limit,
      limit,
      current: currentCount,
    };
  }

  /**
   * Valida e lança exceção se limite foi atingido
   */
  async enforceLimit(
    tenantId: string,
    limitType: keyof TenantPlanLimits,
    currentCount: number,
    resourceName: string,
  ): Promise<void> {
    const { allowed, limit, current } = await this.checkLimit(tenantId, limitType, currentCount);

    if (!allowed) {
      throw new ForbiddenException(
        `Limite de ${resourceName} atingido (${current}/${limit}). Faça upgrade do seu plano para continuar.`,
      );
    }
  }

  /**
   * Valida e lança exceção se feature não está disponível
   */
  async enforceFeature(tenantId: string, feature: keyof TenantPlanFeatures): Promise<void> {
    const hasFeature = await this.hasFeature(tenantId, feature);

    if (!hasFeature) {
      throw new ForbiddenException(
        `Esta funcionalidade não está disponível no seu plano atual. Faça upgrade para ter acesso.`,
      );
    }
  }

  /**
   * Atualiza configurações do tenant
   */
  async updateSettings(tenantId: string, settings: Record<string, any>) {
    const tenant = await this.findById(tenantId);

    if (!tenant) {
      throw new NotFoundException('Tenant não encontrado');
    }

    const currentSettings = (tenant.settings as Record<string, any>) || {};

    return this.prisma.tenant.update({
      where: { id: tenantId },
      data: {
        settings: {
          ...currentSettings,
          ...settings,
        },
      },
    });
  }

  /**
   * Obtém estatísticas de uso do tenant
   */
  async getUsageStats(tenantId: string) {
    const [
      usersCount,
      professionalsCount,
      clientsCount,
      appointmentsThisMonth,
      servicesCount,
      productsCount,
    ] = await Promise.all([
      this.prisma.user.count({ where: { tenantId } }),
      this.prisma.professional.count({ where: { tenantId } }),
      this.prisma.customer.count({ where: { tenantId } }),
      this.prisma.appointment.count({
        where: {
          tenantId,
          scheduledAt: {
            gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
          },
        },
      }),
      this.prisma.service.count({ where: { tenantId } }),
      this.prisma.product.count({ where: { tenantId } }),
    ]);

    const planConfig = await this.getTenantPlanConfig(tenantId);

    return {
      users: {
        current: usersCount,
        limit: planConfig.limits.maxUsers,
        percentage: this.calculatePercentage(usersCount, planConfig.limits.maxUsers),
      },
      professionals: {
        current: professionalsCount,
        limit: planConfig.limits.maxProfessionals,
        percentage: this.calculatePercentage(professionalsCount, planConfig.limits.maxProfessionals),
      },
      clients: {
        current: clientsCount,
        limit: planConfig.limits.maxClients,
        percentage: this.calculatePercentage(clientsCount, planConfig.limits.maxClients),
      },
      appointmentsThisMonth: {
        current: appointmentsThisMonth,
        limit: planConfig.limits.maxAppointmentsPerMonth,
        percentage: this.calculatePercentage(
          appointmentsThisMonth,
          planConfig.limits.maxAppointmentsPerMonth,
        ),
      },
      services: {
        current: servicesCount,
        limit: planConfig.limits.maxServicesPerCategory * planConfig.limits.maxCategories,
        percentage: this.calculatePercentage(
          servicesCount,
          planConfig.limits.maxServicesPerCategory * planConfig.limits.maxCategories,
        ),
      },
      products: {
        current: productsCount,
        limit: planConfig.limits.maxProducts,
        percentage: this.calculatePercentage(productsCount, planConfig.limits.maxProducts),
      },
    };
  }

  private calculatePercentage(current: number, limit: number): number {
    if (isUnlimited(limit)) return 0;
    return Math.round((current / limit) * 100);
  }

  /**
   * Gera slug único a partir do nome
   */
  async generateUniqueSlug(name: string): Promise<string> {
    const baseSlug = name
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');

    let slug = baseSlug;
    let counter = 1;

    while (await this.findBySlug(slug)) {
      slug = `${baseSlug}-${counter}`;
      counter++;
    }

    return slug;
  }
}
