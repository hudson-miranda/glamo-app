import { Injectable, Logger } from '@nestjs/common';
import {
  CommissionType,
  CommissionTrigger,
  CommissionRule,
  ProfessionalCommissionConfig,
  TierConfig,
} from '../interfaces';

export interface CalculationInput {
  professionalId: string;
  trigger: CommissionTrigger;
  baseValue: number;
  serviceId?: string;
  productId?: string;
  customerId?: string;
  metadata?: Record<string, any>;
}

export interface CalculationResult {
  ruleId?: string;
  ruleName?: string;
  commissionType: CommissionType;
  percentage?: number;
  fixedAmount?: number;
  calculatedAmount: number;
  breakdown: {
    description: string;
    value: number;
  }[];
}

@Injectable()
export class CalculationService {
  private readonly logger = new Logger(CalculationService.name);

  calculateCommission(
    input: CalculationInput,
    rule: CommissionRule | null,
    config: ProfessionalCommissionConfig | null,
  ): CalculationResult {
    // Prioridade: Override do profissional > Regra específica > Config padrão do profissional

    // 1. Verificar override por serviço/produto
    if (config) {
      if (input.serviceId) {
        const serviceOverride = config.serviceOverrides?.find(
          (o) => o.serviceId === input.serviceId,
        );
        if (serviceOverride) {
          return this.applyOverride(input.baseValue, serviceOverride);
        }
      }

      if (input.productId) {
        const productOverride = config.productOverrides?.find(
          (o) => o.productId === input.productId,
        );
        if (productOverride) {
          return this.applyOverride(input.baseValue, productOverride);
        }
      }
    }

    // 2. Aplicar regra se existir
    if (rule) {
      return this.applyRule(input.baseValue, rule);
    }

    // 3. Usar percentual padrão do profissional
    if (config?.defaultPercentage) {
      return {
        commissionType: CommissionType.PERCENTAGE,
        percentage: config.defaultPercentage,
        calculatedAmount: input.baseValue * (config.defaultPercentage / 100),
        breakdown: [
          {
            description: `Percentual padrão: ${config.defaultPercentage}%`,
            value: input.baseValue * (config.defaultPercentage / 100),
          },
        ],
      };
    }

    // 4. Sem comissão configurada
    return {
      commissionType: CommissionType.PERCENTAGE,
      percentage: 0,
      calculatedAmount: 0,
      breakdown: [{ description: 'Nenhuma regra aplicável', value: 0 }],
    };
  }

  private applyOverride(
    baseValue: number,
    override: { type: CommissionType; percentage?: number; fixedAmount?: number },
  ): CalculationResult {
    const breakdown: { description: string; value: number }[] = [];
    let calculatedAmount = 0;

    switch (override.type) {
      case CommissionType.PERCENTAGE:
        calculatedAmount = baseValue * ((override.percentage || 0) / 100);
        breakdown.push({
          description: `Override: ${override.percentage}%`,
          value: calculatedAmount,
        });
        break;

      case CommissionType.FIXED:
        calculatedAmount = override.fixedAmount || 0;
        breakdown.push({
          description: `Valor fixo override`,
          value: calculatedAmount,
        });
        break;

      case CommissionType.MIXED:
        const fixedPart = override.fixedAmount || 0;
        const percentPart = baseValue * ((override.percentage || 0) / 100);
        calculatedAmount = fixedPart + percentPart;
        breakdown.push({ description: `Valor fixo`, value: fixedPart });
        breakdown.push({ description: `Percentual: ${override.percentage}%`, value: percentPart });
        break;
    }

    return {
      commissionType: override.type,
      percentage: override.percentage,
      fixedAmount: override.fixedAmount,
      calculatedAmount,
      breakdown,
    };
  }

  private applyRule(baseValue: number, rule: CommissionRule): CalculationResult {
    const breakdown: { description: string; value: number }[] = [];
    let calculatedAmount = 0;

    switch (rule.type) {
      case CommissionType.PERCENTAGE:
        calculatedAmount = baseValue * ((rule.percentage || 0) / 100);
        breakdown.push({
          description: `${rule.name}: ${rule.percentage}%`,
          value: calculatedAmount,
        });
        break;

      case CommissionType.FIXED:
        calculatedAmount = rule.fixedAmount || 0;
        breakdown.push({
          description: `${rule.name}: Valor fixo`,
          value: calculatedAmount,
        });
        break;

      case CommissionType.TIERED:
        calculatedAmount = this.calculateTieredCommission(baseValue, rule.tiers || []);
        breakdown.push({
          description: `${rule.name}: Comissão escalonada`,
          value: calculatedAmount,
        });
        break;

      case CommissionType.MIXED:
        const fixedPart = rule.fixedAmount || 0;
        const percentPart = baseValue * ((rule.percentage || 0) / 100);
        calculatedAmount = fixedPart + percentPart;
        breakdown.push({ description: `${rule.name}: Fixo`, value: fixedPart });
        breakdown.push({ description: `${rule.name}: ${rule.percentage}%`, value: percentPart });
        break;
    }

    return {
      ruleId: rule.id,
      ruleName: rule.name,
      commissionType: rule.type,
      percentage: rule.percentage,
      fixedAmount: rule.fixedAmount,
      calculatedAmount,
      breakdown,
    };
  }

  private calculateTieredCommission(baseValue: number, tiers: TierConfig[]): number {
    // Ordenar tiers por minValue
    const sortedTiers = [...tiers].sort((a, b) => a.minValue - b.minValue);

    let totalCommission = 0;
    let remainingValue = baseValue;

    for (const tier of sortedTiers) {
      if (remainingValue <= 0) break;

      const tierMin = tier.minValue;
      const tierMax = tier.maxValue || Infinity;

      if (baseValue < tierMin) continue;

      const valueInTier = Math.min(
        remainingValue,
        tierMax - tierMin,
      );

      if (tier.percentage) {
        totalCommission += valueInTier * (tier.percentage / 100);
      } else if (tier.fixedAmount) {
        totalCommission += tier.fixedAmount;
      }

      remainingValue -= valueInTier;
    }

    return totalCommission;
  }

  checkRuleConditions(
    rule: CommissionRule,
    input: CalculationInput,
  ): boolean {
    const conditions = rule.conditions;
    if (!conditions) return true;

    // Verificar serviços
    if (conditions.serviceIds?.length && input.serviceId) {
      if (!conditions.serviceIds.includes(input.serviceId)) {
        return false;
      }
    }

    // Verificar produtos
    if (conditions.productIds?.length && input.productId) {
      if (!conditions.productIds.includes(input.productId)) {
        return false;
      }
    }

    // Verificar profissionais
    if (conditions.professionalIds?.length) {
      if (!conditions.professionalIds.includes(input.professionalId)) {
        return false;
      }
    }

    // Verificar valor mínimo
    if (conditions.minTransactionValue && input.baseValue < conditions.minTransactionValue) {
      return false;
    }

    // Verificar valor máximo
    if (conditions.maxTransactionValue && input.baseValue > conditions.maxTransactionValue) {
      return false;
    }

    // Verificar dia da semana
    if (conditions.dayOfWeek?.length) {
      const today = new Date().getDay();
      if (!conditions.dayOfWeek.includes(today)) {
        return false;
      }
    }

    return true;
  }

  findApplicableRule(
    rules: CommissionRule[],
    input: CalculationInput,
  ): CommissionRule | null {
    // Filtrar regras ativas e válidas para o período
    const now = new Date();
    const validRules = rules.filter((rule) => {
      if (!rule.isActive) return false;
      if (rule.validFrom && new Date(rule.validFrom) > now) return false;
      if (rule.validTo && new Date(rule.validTo) < now) return false;
      if (rule.trigger !== input.trigger) return false;
      return this.checkRuleConditions(rule, input);
    });

    // Ordenar por prioridade (maior primeiro)
    validRules.sort((a, b) => b.priority - a.priority);

    return validRules[0] || null;
  }
}
