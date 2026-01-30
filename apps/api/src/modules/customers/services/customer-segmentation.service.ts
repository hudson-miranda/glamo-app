import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '@/core/database/prisma.service';
import { TenantContext } from '@/core/tenancy/tenant-context';
import { EventEmitter2 } from '@nestjs/event-emitter';
import {
  CustomerSegment,
  SegmentRule,
  SegmentRuleGroup,
  SegmentType,
  SegmentOperator,
  SYSTEM_SEGMENTS,
  SegmentEvaluationResult,
  RelativeDateValue,
} from '../interfaces';
import { CreateSegmentDto, UpdateSegmentDto } from '../dto';
import { CustomerSegmentsChangedEvent } from '../events';
import { differenceInDays, subDays, startOfMonth, subMonths } from 'date-fns';

/**
 * Serviço de segmentação de clientes
 */
@Injectable()
export class CustomerSegmentationService {
  private readonly logger = new Logger(CustomerSegmentationService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly tenantContext: TenantContext,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  /**
   * Lista todos os segmentos do tenant
   */
  async listSegments(): Promise<CustomerSegment[]> {
    const tenantId = this.tenantContext.getTenantId();

    const segments = await this.prisma.customerSegment.findMany({
      where: { tenantId },
      orderBy: [{ isSystem: 'desc' }, { name: 'asc' }],
    });

    // Contar clientes em cada segmento
    const segmentsWithCount = await Promise.all(
      segments.map(async (segment) => {
        const count = await this.prisma.customerSegmentMember.count({
          where: { segmentId: segment.id },
        });

        return {
          ...segment,
          customerCount: count,
          rules: segment.rules as unknown as SegmentRuleGroup,
        } as CustomerSegment;
      }),
    );

    return segmentsWithCount;
  }

  /**
   * Cria um novo segmento
   */
  async createSegment(dto: CreateSegmentDto): Promise<CustomerSegment> {
    const tenantId = this.tenantContext.getTenantId();

    // Gerar slug a partir do nome
    const slug = this.generateSlug(dto.name);

    // Verificar se já existe
    const existing = await this.prisma.customerSegment.findFirst({
      where: { tenantId, slug },
    });

    if (existing) {
      throw new Error(`Segmento com slug "${slug}" já existe`);
    }

    const segment = await this.prisma.customerSegment.create({
      data: {
        tenantId,
        name: dto.name,
        slug,
        description: dto.description,
        type: dto.type || SegmentType.SMART,
        color: dto.color,
        icon: dto.icon,
        rules: dto.rules as any,
        isSystem: false,
      },
    });

    // Se for segmento smart, avaliar clientes existentes
    if (dto.type === SegmentType.SMART && dto.rules) {
      await this.evaluateSegmentForAllCustomers(segment.id);
    }

    return {
      ...segment,
      customerCount: 0,
      rules: segment.rules as unknown as SegmentRuleGroup,
    } as CustomerSegment;
  }

  /**
   * Atualiza um segmento
   */
  async updateSegment(segmentId: string, dto: UpdateSegmentDto): Promise<CustomerSegment> {
    const segment = await this.prisma.customerSegment.findUnique({
      where: { id: segmentId },
    });

    if (!segment) {
      throw new Error('Segmento não encontrado');
    }

    if (segment.isSystem) {
      throw new Error('Segmentos do sistema não podem ser editados');
    }

    const updated = await this.prisma.customerSegment.update({
      where: { id: segmentId },
      data: {
        name: dto.name,
        description: dto.description,
        color: dto.color,
        icon: dto.icon,
        rules: dto.rules as any,
      },
    });

    // Re-avaliar se as regras mudaram
    if (dto.rules) {
      await this.evaluateSegmentForAllCustomers(segmentId);
    }

    const count = await this.prisma.customerSegmentMember.count({
      where: { segmentId },
    });

    return {
      ...updated,
      customerCount: count,
      rules: updated.rules as unknown as SegmentRuleGroup,
    } as CustomerSegment;
  }

  /**
   * Deleta um segmento
   */
  async deleteSegment(segmentId: string): Promise<void> {
    const segment = await this.prisma.customerSegment.findUnique({
      where: { id: segmentId },
    });

    if (!segment) {
      throw new Error('Segmento não encontrado');
    }

    if (segment.isSystem) {
      throw new Error('Segmentos do sistema não podem ser deletados');
    }

    // Remover membros primeiro
    await this.prisma.customerSegmentMember.deleteMany({
      where: { segmentId },
    });

    await this.prisma.customerSegment.delete({
      where: { id: segmentId },
    });
  }

  /**
   * Adiciona clientes a um segmento manual
   */
  async addToSegment(segmentId: string, customerIds: string[]): Promise<void> {
    const segment = await this.prisma.customerSegment.findUnique({
      where: { id: segmentId },
    });

    if (!segment || segment.type !== SegmentType.MANUAL) {
      throw new Error('Operação válida apenas para segmentos manuais');
    }

    for (const customerId of customerIds) {
      await this.prisma.customerSegmentMember.upsert({
        where: {
          customerId_segmentId: { customerId, segmentId },
        },
        create: { customerId, segmentId },
        update: {},
      });
    }
  }

  /**
   * Remove clientes de um segmento manual
   */
  async removeFromSegment(segmentId: string, customerIds: string[]): Promise<void> {
    const segment = await this.prisma.customerSegment.findUnique({
      where: { id: segmentId },
    });

    if (!segment || segment.type !== SegmentType.MANUAL) {
      throw new Error('Operação válida apenas para segmentos manuais');
    }

    await this.prisma.customerSegmentMember.deleteMany({
      where: {
        segmentId,
        customerId: { in: customerIds },
      },
    });
  }

  /**
   * Avalia todos os segmentos para um cliente específico
   */
  async evaluateCustomerSegments(customerId: string): Promise<string[]> {
    const tenantId = this.tenantContext.getTenantId();

    // Buscar cliente com dados necessários
    const customer = await this.prisma.customer.findUnique({
      where: { id: customerId },
    });

    if (!customer) return [];

    // Buscar segmentos smart e automáticos
    const segments = await this.prisma.customerSegment.findMany({
      where: {
        tenantId,
        type: { in: [SegmentType.SMART, SegmentType.AUTOMATIC] },
      },
    });

    // Segmentos anteriores
    const previousMemberships = await this.prisma.customerSegmentMember.findMany({
      where: { customerId },
      include: { segment: true },
    });
    const previousSegments = previousMemberships.map((m) => m.segment.slug);

    const matchedSegments: string[] = [];

    for (const segment of segments) {
      const rules = segment.rules as unknown as SegmentRuleGroup;
      if (!rules) continue;

      const matches = this.evaluateRules(customer, rules);

      if (matches) {
        matchedSegments.push(segment.slug);

        // Adicionar membro se não existir
        await this.prisma.customerSegmentMember.upsert({
          where: {
            customerId_segmentId: { customerId, segmentId: segment.id },
          },
          create: { customerId, segmentId: segment.id },
          update: {},
        });
      } else {
        // Remover se não corresponder mais
        await this.prisma.customerSegmentMember.deleteMany({
          where: { customerId, segmentId: segment.id },
        });
      }
    }

    // Verificar se houve mudança
    const currentSegments = [...matchedSegments];
    const addedSegments = currentSegments.filter((s) => !previousSegments.includes(s));
    const removedSegments = previousSegments.filter((s) => !currentSegments.includes(s));

    if (addedSegments.length > 0 || removedSegments.length > 0) {
      this.eventEmitter.emit(
        'customer.segments_changed',
        new CustomerSegmentsChangedEvent(
          {
            id: customer.id,
            tenantId: customer.tenantId,
            name: customer.name,
            email: customer.email || undefined,
            phone: customer.phone,
            tags: customer.tags as string[],
          },
          previousSegments,
          currentSegments,
        ),
      );
    }

    // Adicionar segmentos manuais que o cliente pode estar
    const manualMemberships = await this.prisma.customerSegmentMember.findMany({
      where: {
        customerId,
        segment: { type: SegmentType.MANUAL },
      },
      include: { segment: true },
    });

    return [...matchedSegments, ...manualMemberships.map((m) => m.segment.slug)];
  }

  /**
   * Avalia um segmento para todos os clientes do tenant
   */
  async evaluateSegmentForAllCustomers(segmentId: string): Promise<number> {
    const tenantId = this.tenantContext.getTenantId();

    const segment = await this.prisma.customerSegment.findUnique({
      where: { id: segmentId },
    });

    if (!segment || segment.type === SegmentType.MANUAL) {
      return 0;
    }

    const rules = segment.rules as unknown as SegmentRuleGroup;
    if (!rules) return 0;

    const customers = await this.prisma.customer.findMany({
      where: { tenantId, deletedAt: null },
    });

    let matchCount = 0;

    for (const customer of customers) {
      const matches = this.evaluateRules(customer, rules);

      if (matches) {
        matchCount++;
        await this.prisma.customerSegmentMember.upsert({
          where: {
            customerId_segmentId: { customerId: customer.id, segmentId },
          },
          create: { customerId: customer.id, segmentId },
          update: {},
        });
      } else {
        await this.prisma.customerSegmentMember.deleteMany({
          where: { customerId: customer.id, segmentId },
        });
      }
    }

    return matchCount;
  }

  /**
   * Inicializa segmentos do sistema para um tenant
   */
  async initializeSystemSegments(): Promise<void> {
    const tenantId = this.tenantContext.getTenantId();

    for (const segmentDef of SYSTEM_SEGMENTS) {
      const existing = await this.prisma.customerSegment.findFirst({
        where: { tenantId, slug: segmentDef.slug },
      });

      if (!existing) {
        await this.prisma.customerSegment.create({
          data: {
            tenantId,
            ...segmentDef,
            rules: segmentDef.rules as any,
          },
        });
      }
    }
  }

  /**
   * Avalia regras contra um cliente
   */
  private evaluateRules(customer: any, ruleGroup: SegmentRuleGroup): boolean {
    const results = ruleGroup.rules.map((rule) => {
      if ('operator' in rule && ('rules' in rule)) {
        // É um grupo aninhado
        return this.evaluateRules(customer, rule as SegmentRuleGroup);
      } else {
        // É uma regra individual
        return this.evaluateRule(customer, rule as SegmentRule);
      }
    });

    if (ruleGroup.operator === 'AND') {
      return results.every((r) => r);
    } else {
      return results.some((r) => r);
    }
  }

  /**
   * Avalia uma regra individual
   */
  private evaluateRule(customer: any, rule: SegmentRule): boolean {
    const value = this.getNestedValue(customer, rule.field);
    let targetValue = rule.value;

    // Resolver valores relativos de data
    if (typeof targetValue === 'string' && this.isRelativeDateValue(targetValue)) {
      targetValue = this.resolveRelativeDate(targetValue);
    }

    switch (rule.operator) {
      case 'eq':
        return value === targetValue;

      case 'neq':
        return value !== targetValue;

      case 'gt':
        return typeof value === 'number' && value > targetValue;

      case 'gte':
        if (value instanceof Date || typeof value === 'number') {
          return value >= targetValue;
        }
        return false;

      case 'lt':
        return typeof value === 'number' && value < targetValue;

      case 'lte':
        if (value instanceof Date || typeof value === 'number') {
          return value <= targetValue;
        }
        return false;

      case 'in':
        return Array.isArray(targetValue) && targetValue.includes(value);

      case 'nin':
        return Array.isArray(targetValue) && !targetValue.includes(value);

      case 'contains':
        if (typeof value === 'string') {
          return value.toLowerCase().includes(String(targetValue).toLowerCase());
        }
        if (Array.isArray(value)) {
          return value.includes(targetValue);
        }
        return false;

      case 'startsWith':
        return typeof value === 'string' && value.startsWith(String(targetValue));

      case 'endsWith':
        return typeof value === 'string' && value.endsWith(String(targetValue));

      case 'between':
        if (Array.isArray(targetValue) && targetValue.length === 2) {
          return value >= targetValue[0] && value <= targetValue[1];
        }
        return false;

      case 'isNull':
        return value === null || value === undefined;

      case 'isNotNull':
        return value !== null && value !== undefined;

      default:
        return false;
    }
  }

  /**
   * Obtém valor aninhado de um objeto
   */
  private getNestedValue(obj: any, path: string): any {
    // Tratar campos especiais
    if (path === 'birthMonth') {
      const birthDate = obj.birthDate;
      if (birthDate instanceof Date) {
        return birthDate.getMonth() + 1;
      }
      return null;
    }

    if (path === 'metrics.lastVisitDaysAgo') {
      const lastVisit = obj.lastVisitAt;
      if (lastVisit instanceof Date) {
        return differenceInDays(new Date(), lastVisit);
      }
      return obj.lastVisitDaysAgo || 999;
    }

    // Caminho padrão
    return path.split('.').reduce((current, key) => {
      return current?.[key];
    }, obj);
  }

  /**
   * Verifica se é um valor de data relativa
   */
  private isRelativeDateValue(value: string): value is RelativeDateValue {
    const relativeDates: RelativeDateValue[] = [
      'today',
      'yesterday',
      'last7days',
      'last30days',
      'last60days',
      'last90days',
      'last120days',
      'thisMonth',
      'lastMonth',
      'thisYear',
      'currentMonth',
    ] as any;
    return relativeDates.includes(value as RelativeDateValue);
  }

  /**
   * Resolve data relativa para data absoluta
   */
  private resolveRelativeDate(value: string): Date | number {
    const now = new Date();

    switch (value) {
      case 'today':
        return now;
      case 'yesterday':
        return subDays(now, 1);
      case 'last7days':
        return subDays(now, 7);
      case 'last30days':
        return subDays(now, 30);
      case 'last60days':
        return subDays(now, 60);
      case 'last90days':
        return subDays(now, 90);
      case 'last120days':
        return subDays(now, 120);
      case 'thisMonth':
        return startOfMonth(now);
      case 'lastMonth':
        return startOfMonth(subMonths(now, 1));
      case 'currentMonth':
        return now.getMonth() + 1; // Para comparação com birthMonth
      default:
        return now;
    }
  }

  /**
   * Gera slug a partir do nome
   */
  private generateSlug(name: string): string {
    return name
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
  }
}
