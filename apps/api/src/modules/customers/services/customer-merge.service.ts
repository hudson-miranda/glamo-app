import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { PrismaService } from '@/core/database/prisma.service';
import { TenantContext } from '@/core/tenancy/tenant-context';
import { EventEmitter2 } from '@nestjs/event-emitter';
import {
  MergeCustomersDto,
  FindDuplicatesDto,
  DuplicateGroupDto,
  FindDuplicatesResultDto,
  MergeResultDto,
} from '../dto';
import { CustomersMergedEvent } from '../events';

/**
 * Serviço para merge de clientes duplicados
 */
@Injectable()
export class CustomerMergeService {
  private readonly logger = new Logger(CustomerMergeService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly tenantContext: TenantContext,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  /**
   * Busca clientes duplicados
   */
  async findDuplicates(dto: FindDuplicatesDto): Promise<FindDuplicatesResultDto> {
    const tenantId = this.tenantContext.getTenantId();
    const groups: DuplicateGroupDto[] = [];

    for (const field of dto.fields || ['phone', 'email', 'cpf']) {
      const duplicates = await this.findDuplicatesByField(field);

      for (const dup of duplicates) {
        if (!dup.value) continue;

        const customers = await this.prisma.customer.findMany({
          where: {
            tenantId,
            [field]: dup.value,
            deletedAt: null,
          },
          orderBy: [{ totalAppointments: 'desc' }, { createdAt: 'asc' }],
        });

        if (customers.length > 1) {
          // O cliente com mais agendamentos é sugerido como principal
          const suggestedPrimary = customers[0];

          groups.push({
            matchField: field,
            matchValue: dup.value,
            customerIds: customers.map((c) => c.id),
            customers: customers.map((c) => ({
              id: c.id,
              name: c.name,
              phone: c.phone,
              email: c.email || undefined,
              totalAppointments: c.totalAppointments || 0,
              lastVisitAt: c.lastVisitAt || undefined,
              createdAt: c.createdAt,
            })),
            suggestedPrimaryId: suggestedPrimary.id,
          });
        }
      }
    }

    // Se habilitado, buscar por similaridade de nome
    if (dto.includeNameSimilarity) {
      const nameDuplicates = await this.findNameSimilarities(dto.similarityThreshold || 0.8);
      groups.push(...nameDuplicates);
    }

    // Remover grupos duplicados (mesmo conjunto de clientes)
    const uniqueGroups = this.removeDuplicateGroups(groups);

    return {
      totalGroups: uniqueGroups.length,
      totalDuplicates: uniqueGroups.reduce((sum, g) => sum + g.customerIds.length, 0),
      groups: uniqueGroups,
    };
  }

  /**
   * Busca duplicados por campo específico
   */
  private async findDuplicatesByField(
    field: string,
  ): Promise<Array<{ value: string; count: number }>> {
    const tenantId = this.tenantContext.getTenantId();

    const result = await this.prisma.$queryRawUnsafe<Array<{ value: string; count: bigint }>>(
      `
      SELECT "${field}" as value, COUNT(*) as count
      FROM "Customer"
      WHERE "tenantId" = $1
        AND "deletedAt" IS NULL
        AND "${field}" IS NOT NULL
        AND "${field}" != ''
      GROUP BY "${field}"
      HAVING COUNT(*) > 1
      ORDER BY count DESC
      LIMIT 100
    `,
      tenantId,
    );

    return result.map((r) => ({
      value: r.value,
      count: Number(r.count),
    }));
  }

  /**
   * Busca similaridades por nome
   */
  private async findNameSimilarities(threshold: number): Promise<DuplicateGroupDto[]> {
    const tenantId = this.tenantContext.getTenantId();
    const groups: DuplicateGroupDto[] = [];

    const customers = await this.prisma.customer.findMany({
      where: { tenantId, deletedAt: null },
      select: {
        id: true,
        name: true,
        phone: true,
        email: true,
        totalAppointments: true,
        lastVisitAt: true,
        createdAt: true,
      },
      orderBy: { name: 'asc' },
    });

    const processed = new Set<string>();

    for (let i = 0; i < customers.length; i++) {
      if (processed.has(customers[i].id)) continue;

      const similar = [customers[i]];

      for (let j = i + 1; j < customers.length; j++) {
        if (processed.has(customers[j].id)) continue;

        const similarity = this.calculateNameSimilarity(
          customers[i].name,
          customers[j].name,
        );

        if (similarity >= threshold) {
          similar.push(customers[j]);
          processed.add(customers[j].id);
        }
      }

      if (similar.length > 1) {
        processed.add(customers[i].id);

        // Ordenar por mais agendamentos
        similar.sort((a, b) => (b.totalAppointments || 0) - (a.totalAppointments || 0));

        groups.push({
          matchField: 'name',
          matchValue: customers[i].name,
          customerIds: similar.map((c) => c.id),
          customers: similar.map((c) => ({
            id: c.id,
            name: c.name,
            phone: c.phone,
            email: c.email || undefined,
            totalAppointments: c.totalAppointments || 0,
            lastVisitAt: c.lastVisitAt || undefined,
            createdAt: c.createdAt,
          })),
          suggestedPrimaryId: similar[0].id,
        });
      }
    }

    return groups;
  }

  /**
   * Calcula similaridade entre dois nomes (algoritmo simplificado)
   */
  private calculateNameSimilarity(name1: string, name2: string): number {
    const n1 = name1.toLowerCase().trim();
    const n2 = name2.toLowerCase().trim();

    if (n1 === n2) return 1;

    // Levenshtein distance simplificado
    const longer = n1.length > n2.length ? n1 : n2;
    const shorter = n1.length > n2.length ? n2 : n1;

    if (longer.length === 0) return 1;

    const editDistance = this.levenshteinDistance(longer, shorter);
    return (longer.length - editDistance) / longer.length;
  }

  /**
   * Calcula distância de Levenshtein
   */
  private levenshteinDistance(s1: string, s2: string): number {
    const costs: number[] = [];

    for (let i = 0; i <= s1.length; i++) {
      let lastValue = i;

      for (let j = 0; j <= s2.length; j++) {
        if (i === 0) {
          costs[j] = j;
        } else if (j > 0) {
          let newValue = costs[j - 1];

          if (s1.charAt(i - 1) !== s2.charAt(j - 1)) {
            newValue = Math.min(Math.min(newValue, lastValue), costs[j]) + 1;
          }

          costs[j - 1] = lastValue;
          lastValue = newValue;
        }
      }

      if (i > 0) costs[s2.length] = lastValue;
    }

    return costs[s2.length];
  }

  /**
   * Remove grupos duplicados
   */
  private removeDuplicateGroups(groups: DuplicateGroupDto[]): DuplicateGroupDto[] {
    const seen = new Set<string>();
    const unique: DuplicateGroupDto[] = [];

    for (const group of groups) {
      const key = [...group.customerIds].sort().join(',');

      if (!seen.has(key)) {
        seen.add(key);
        unique.push(group);
      }
    }

    return unique;
  }

  /**
   * Mescla clientes duplicados
   */
  async mergeCustomers(dto: MergeCustomersDto): Promise<MergeResultDto> {
    const tenantId = this.tenantContext.getTenantId();
    const warnings: string[] = [];

    // Validar que todos os clientes existem e pertencem ao tenant
    const primaryCustomer = await this.prisma.customer.findFirst({
      where: { id: dto.primaryCustomerId, tenantId, deletedAt: null },
    });

    if (!primaryCustomer) {
      throw new BadRequestException('Cliente principal não encontrado');
    }

    const mergeCustomers = await this.prisma.customer.findMany({
      where: {
        id: { in: dto.mergeCustomerIds },
        tenantId,
        deletedAt: null,
      },
    });

    if (mergeCustomers.length !== dto.mergeCustomerIds.length) {
      throw new BadRequestException('Um ou mais clientes a serem mesclados não foram encontrados');
    }

    // Não permitir mesclar o cliente principal consigo mesmo
    if (dto.mergeCustomerIds.includes(dto.primaryCustomerId)) {
      throw new BadRequestException('O cliente principal não pode estar na lista de mesclados');
    }

    // Iniciar transação
    const result = await this.prisma.$transaction(async (tx) => {
      let appointmentsTransferred = 0;
      let totalLoyaltyPoints = primaryCustomer.loyaltyPoints || 0;

      // 1. Transferir agendamentos
      if (dto.keepAppointmentHistory !== false) {
        for (const customer of mergeCustomers) {
          const updateResult = await tx.appointment.updateMany({
            where: { customerId: customer.id },
            data: { customerId: dto.primaryCustomerId },
          });
          appointmentsTransferred += updateResult.count;
        }
      }

      // 2. Consolidar pontos de fidelidade
      if (dto.sumLoyaltyPoints !== false) {
        for (const customer of mergeCustomers) {
          totalLoyaltyPoints += customer.loyaltyPoints || 0;
        }

        await tx.customer.update({
          where: { id: dto.primaryCustomerId },
          data: { loyaltyPoints: totalLoyaltyPoints },
        });
      }

      // 3. Transferir transações de fidelidade
      for (const customer of mergeCustomers) {
        await tx.loyaltyTransaction.updateMany({
          where: { customerId: customer.id },
          data: { customerId: dto.primaryCustomerId },
        });
      }

      // 4. Transferir notas
      for (const customer of mergeCustomers) {
        await tx.customerNote.updateMany({
          where: { customerId: customer.id },
          data: { customerId: dto.primaryCustomerId },
        });
      }

      // 5. Transferir reviews
      for (const customer of mergeCustomers) {
        await tx.review.updateMany({
          where: { customerId: customer.id },
          data: { customerId: dto.primaryCustomerId },
        });
      }

      // 6. Mesclar tags
      const allTags = new Set<string>(primaryCustomer.tags as string[]);
      for (const customer of mergeCustomers) {
        (customer.tags as string[]).forEach((tag) => allTags.add(tag));
      }

      // 7. Atualizar métricas do cliente principal
      const metricsSum = {
        totalAppointments: primaryCustomer.totalAppointments || 0,
        completedAppointments: primaryCustomer.completedAppointments || 0,
        cancelledAppointments: primaryCustomer.cancelledAppointments || 0,
        noShowCount: primaryCustomer.noShowCount || 0,
        totalSpent: Number(primaryCustomer.totalSpent) || 0,
      };

      for (const customer of mergeCustomers) {
        metricsSum.totalAppointments += customer.totalAppointments || 0;
        metricsSum.completedAppointments += customer.completedAppointments || 0;
        metricsSum.cancelledAppointments += customer.cancelledAppointments || 0;
        metricsSum.noShowCount += customer.noShowCount || 0;
        metricsSum.totalSpent += Number(customer.totalSpent) || 0;
      }

      // 8. Preencher campos vazios com dados dos mesclados
      const updatedData: any = {
        tags: Array.from(allTags),
        ...metricsSum,
      };

      // Estratégia de merge para campos conflitantes
      if (dto.conflictStrategy === 'merge') {
        for (const customer of mergeCustomers) {
          if (!primaryCustomer.email && customer.email) {
            updatedData.email = customer.email;
          }
          if (!primaryCustomer.cpf && customer.cpf) {
            updatedData.cpf = customer.cpf;
          }
          if (!primaryCustomer.birthDate && customer.birthDate) {
            updatedData.birthDate = customer.birthDate;
          }
          if (!primaryCustomer.address && customer.address) {
            updatedData.address = customer.address;
          }
        }
      }

      await tx.customer.update({
        where: { id: dto.primaryCustomerId },
        data: updatedData,
      });

      // 9. Soft delete dos clientes mesclados
      await tx.customer.updateMany({
        where: { id: { in: dto.mergeCustomerIds } },
        data: {
          deletedAt: new Date(),
          mergedInto: dto.primaryCustomerId,
        },
      });

      // 10. Registrar o merge
      await tx.customerMergeLog.create({
        data: {
          tenantId,
          primaryCustomerId: dto.primaryCustomerId,
          mergedCustomerIds: dto.mergeCustomerIds,
          appointmentsTransferred,
          loyaltyPointsConsolidated: totalLoyaltyPoints,
          createdAt: new Date(),
        },
      });

      return {
        appointmentsTransferred,
        totalLoyaltyPoints,
      };
    });

    // Emitir evento
    this.eventEmitter.emit(
      'customer.merged',
      new CustomersMergedEvent(
        {
          id: primaryCustomer.id,
          tenantId: primaryCustomer.tenantId,
          name: primaryCustomer.name,
          email: primaryCustomer.email || undefined,
          phone: primaryCustomer.phone,
          tags: primaryCustomer.tags as string[],
        },
        dto.mergeCustomerIds,
        result.appointmentsTransferred,
        result.totalLoyaltyPoints,
      ),
    );

    return {
      success: true,
      customerId: dto.primaryCustomerId,
      mergedCount: dto.mergeCustomerIds.length,
      appointmentsTransferred: result.appointmentsTransferred,
      totalLoyaltyPoints: result.totalLoyaltyPoints,
      warnings: warnings.length > 0 ? warnings : undefined,
    };
  }
}
