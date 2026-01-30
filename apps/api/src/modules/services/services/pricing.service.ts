import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { TenantContextService } from '@/core/tenancy/tenant-context.service';
import {
  PriceCalculation,
  DurationCalculation,
  DynamicPricingRule,
  ServiceOption,
  ProfessionalPrice,
  PricingType,
  DurationType,
} from '../interfaces';

/**
 * Serviço de cálculo de preços
 */
@Injectable()
export class PricingService {
  private readonly _logger = new Logger(PricingService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly _tenantContext: TenantContextService,
  ) {}

  /**
   * Calcula preço final do serviço
   */
  calculatePrice(
    service: any,
    options: {
      optionId?: string;
      professionalId?: string;
      date?: Date;
      time?: string;
    } = {},
  ): PriceCalculation {
    let basePrice = service.price;
    let optionAdjustment = 0;
    let professionalAdjustment = 0;
    let dynamicAdjustment = 0;
    let comboDiscount = 0;
    let packageDiscount = 0;
    const appliedRules: string[] = [];

    // 1. Ajuste por opção
    if (options.optionId && service.options?.length) {
      const selectedOption = service.options.find(
        (opt: ServiceOption) => opt.id === options.optionId,
      );
      if (selectedOption) {
        optionAdjustment = selectedOption.priceAdjustment;
        appliedRules.push(`Opção: ${selectedOption.name}`);
      }
    }

    // 2. Ajuste por profissional
    if (
      options.professionalId &&
      service.pricingType === PricingType.BY_PROFESSIONAL &&
      service.professionalPrices?.length
    ) {
      const profPrice = service.professionalPrices.find(
        (pp: ProfessionalPrice) => pp.professionalId === options.professionalId,
      );
      if (profPrice) {
        professionalAdjustment = profPrice.price - basePrice;
        appliedRules.push(`Profissional específico`);
      }
    }

    // 3. Preço dinâmico
    if (
      service.pricingType === PricingType.DYNAMIC &&
      service.dynamicPricingRules?.length &&
      options.date
    ) {
      const dynamicResult = this.applyDynamicPricing(
        basePrice + optionAdjustment + professionalAdjustment,
        service.dynamicPricingRules,
        options.date,
        options.time,
      );
      dynamicAdjustment = dynamicResult.adjustment;
      appliedRules.push(...dynamicResult.appliedRules);
    }

    // 4. Desconto de combo
    if (service.type === 'COMBO' && service.comboDiscount) {
      const subtotal = basePrice + optionAdjustment + professionalAdjustment + dynamicAdjustment;
      comboDiscount = -(subtotal * (service.comboDiscount / 100));
      appliedRules.push(`Desconto combo: ${service.comboDiscount}%`);
    }

    // 5. Desconto de pacote
    if (service.type === 'PACKAGE' && service.packageConfig?.discount) {
      const subtotal = basePrice + optionAdjustment + professionalAdjustment + dynamicAdjustment;
      packageDiscount = -(subtotal * (service.packageConfig.discount / 100));
      appliedRules.push(`Desconto pacote: ${service.packageConfig.discount}%`);
    }

    const finalPrice = Math.max(
      0,
      basePrice + optionAdjustment + professionalAdjustment + dynamicAdjustment + comboDiscount + packageDiscount,
    );

    return {
      basePrice,
      optionAdjustment,
      professionalAdjustment,
      dynamicAdjustment,
      comboDiscount,
      packageDiscount,
      finalPrice: Math.round(finalPrice * 100) / 100,
      appliedRules,
    };
  }

  /**
   * Calcula duração total do serviço
   */
  calculateDuration(
    service: any,
    options: {
      optionId?: string;
      professionalId?: string;
    } = {},
  ): DurationCalculation {
    let baseDuration = service.duration;
    let optionDuration = 0;

    // Duração por opção
    if (
      options.optionId &&
      service.durationType === DurationType.BY_OPTION &&
      service.options?.length
    ) {
      const selectedOption = service.options.find(
        (opt: ServiceOption) => opt.id === options.optionId,
      );
      if (selectedOption) {
        optionDuration = selectedOption.duration - baseDuration;
      }
    }

    // Override por profissional
    if (options.professionalId && service.professionalPrices?.length) {
      const profPrice = service.professionalPrices.find(
        (pp: ProfessionalPrice) => pp.professionalId === options.professionalId,
      );
      if (profPrice?.duration) {
        baseDuration = profPrice.duration;
        optionDuration = 0; // Ignora opção quando tem override de profissional
      }
    }

    const bufferBefore = service.bufferTimeBefore || 0;
    const bufferAfter = service.bufferTimeAfter || 0;
    const totalDuration = baseDuration + optionDuration;
    const blockDuration = bufferBefore + totalDuration + bufferAfter;

    return {
      baseDuration,
      optionDuration,
      bufferBefore,
      bufferAfter,
      totalDuration,
      blockDuration,
    };
  }

  /**
   * Aplica regras de preço dinâmico
   */
  private applyDynamicPricing(
    currentPrice: number,
    rules: DynamicPricingRule[],
    date: Date,
    time?: string,
  ): { adjustment: number; appliedRules: string[] } {
    const activeRules = rules
      .filter((rule) => rule.isActive)
      .sort((a, b) => a.priority - b.priority);

    let totalAdjustment = 0;
    const appliedRules: string[] = [];

    for (const rule of activeRules) {
      if (this.evaluateRule(rule, date, time)) {
        const adjustment =
          rule.adjustment.type === 'PERCENTAGE'
            ? currentPrice * (rule.adjustment.value / 100)
            : rule.adjustment.value;

        totalAdjustment += adjustment;
        appliedRules.push(
          `${rule.name}: ${rule.adjustment.value > 0 ? '+' : ''}${rule.adjustment.value}${rule.adjustment.type === 'PERCENTAGE' ? '%' : ''}`,
        );
      }
    }

    return { adjustment: totalAdjustment, appliedRules };
  }

  /**
   * Avalia se uma regra se aplica
   */
  private evaluateRule(rule: DynamicPricingRule, date: Date, time?: string): boolean {
    const dayOfWeek = date.getDay();
    const { conditions } = rule;

    // Dia da semana
    if (conditions.daysOfWeek?.length && !conditions.daysOfWeek.includes(dayOfWeek)) {
      return false;
    }

    // Horário
    if (time && conditions.startTime && conditions.endTime) {
      const [h, m] = time.split(':').map(Number);
      const timeMinutes = h * 60 + m;

      const [sh, sm] = conditions.startTime.split(':').map(Number);
      const startMinutes = sh * 60 + sm;

      const [eh, em] = conditions.endTime.split(':').map(Number);
      const endMinutes = eh * 60 + em;

      if (timeMinutes < startMinutes || timeMinutes > endMinutes) {
        return false;
      }
    }

    // Período/Sazonalidade
    if (conditions.startDate && date < new Date(conditions.startDate)) {
      return false;
    }
    if (conditions.endDate && date > new Date(conditions.endDate)) {
      return false;
    }

    // Demanda (ocupação) - precisaria de integração com agenda
    // Por enquanto, ignora essa condição se não temos dados de ocupação

    return true;
  }

  /**
   * Calcula preço de combo
   */
  async calculateComboPrice(
    comboItems: { serviceId: string; quantity: number; priceOverride?: number }[],
    comboDiscount: number = 0,
  ): Promise<{
    itemsTotal: number;
    discount: number;
    finalPrice: number;
    items: { serviceId: string; name: string; price: number; quantity: number }[];
  }> {
    const items: { serviceId: string; name: string; price: number; quantity: number }[] = [];
    let itemsTotal = 0;

    for (const item of comboItems) {
      const service = await this.prisma.service.findUnique({
        where: { id: item.serviceId },
        select: { name: true, price: true },
      });

      if (service) {
        const price = item.priceOverride ?? service.price;
        items.push({
          serviceId: item.serviceId,
          name: service.name,
          price,
          quantity: item.quantity,
        });
        itemsTotal += price * item.quantity;
      }
    }

    const discount = itemsTotal * (comboDiscount / 100);
    const finalPrice = itemsTotal - discount;

    return {
      itemsTotal,
      discount,
      finalPrice: Math.round(finalPrice * 100) / 100,
      items,
    };
  }

  /**
   * Calcula preço de pacote
   */
  calculatePackagePrice(
    sessionPrice: number,
    sessionsTotal: number,
    discount: number = 0,
  ): {
    regularPrice: number;
    discount: number;
    finalPrice: number;
    pricePerSession: number;
    savings: number;
  } {
    const regularPrice = sessionPrice * sessionsTotal;
    const discountAmount = regularPrice * (discount / 100);
    const finalPrice = regularPrice - discountAmount;
    const pricePerSession = finalPrice / sessionsTotal;
    const savings = regularPrice - finalPrice;

    return {
      regularPrice,
      discount: discountAmount,
      finalPrice: Math.round(finalPrice * 100) / 100,
      pricePerSession: Math.round(pricePerSession * 100) / 100,
      savings: Math.round(savings * 100) / 100,
    };
  }
}
