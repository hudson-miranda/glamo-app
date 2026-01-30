import { Injectable, Logger } from '@nestjs/common';
import { CommissionsRepository } from '../repositories';
import {
  GoalType,
  GoalProgress,
  Goal,
} from '../interfaces';
import { differenceInDays } from 'date-fns';

@Injectable()
export class GoalService {
  private readonly logger = new Logger(GoalService.name);

  constructor(private readonly repository: CommissionsRepository) {}

  async calculateGoalProgress(goal: Goal, professionalId?: string): Promise<GoalProgress> {
    const now = new Date();
    const startDate = new Date(goal.startDate);
    const endDate = new Date(goal.endDate);

    let current = 0;

    // Calcular progresso baseado no tipo
    switch (goal.type) {
      case GoalType.REVENUE:
        current = await this.calculateRevenueProgress(
          goal.professionalId || professionalId,
          startDate,
          endDate,
        );
        break;

      case GoalType.APPOINTMENTS:
        current = await this.calculateAppointmentsProgress(
          goal.professionalId || professionalId,
          startDate,
          endDate,
        );
        break;

      case GoalType.NEW_CUSTOMERS:
        current = await this.calculateNewCustomersProgress(
          goal.professionalId || professionalId,
          startDate,
          endDate,
        );
        break;

      case GoalType.PRODUCT_SALES:
        current = await this.calculateProductSalesProgress(
          goal.professionalId || professionalId,
          startDate,
          endDate,
        );
        break;

      case GoalType.SERVICE_COUNT:
        current = await this.calculateServiceCountProgress(
          goal.professionalId || professionalId,
          startDate,
          endDate,
        );
        break;

      default:
        current = 0;
    }

    const percentage = goal.target > 0 ? (current / goal.target) * 100 : 0;
    const isAchieved = current >= goal.target;
    const remainingDays = Math.max(0, differenceInDays(endDate, now));

    // Calcular projeção
    const daysElapsed = differenceInDays(now, startDate);
    const totalDays = differenceInDays(endDate, startDate);
    const projectedValue = daysElapsed > 0 && totalDays > 0
      ? (current / daysElapsed) * totalDays
      : current;

    // Determinar tendência
    const previousProgress = await this.getPreviousPeriodProgress(goal, professionalId);
    let trend: 'UP' | 'DOWN' | 'STABLE' = 'STABLE';
    if (previousProgress !== null) {
      if (current > previousProgress * 1.05) trend = 'UP';
      else if (current < previousProgress * 0.95) trend = 'DOWN';
    }

    return {
      goalId: goal.id,
      goalName: goal.name,
      type: goal.type,
      target: goal.target,
      current,
      percentage: Math.round(percentage * 100) / 100,
      isAchieved,
      remainingDays,
      projectedValue: Math.round(projectedValue * 100) / 100,
      trend,
    };
  }

  private async calculateRevenueProgress(
    professionalId: string | undefined,
    startDate: Date,
    endDate: Date,
  ): Promise<number> {
    const stats = await this.repository.getEntriesStats(
      professionalId || '',
      startDate,
      endDate,
    );

    return stats.reduce((sum, s) => sum + (s._sum.finalAmount || 0), 0);
  }

  private async calculateAppointmentsProgress(
    professionalId: string | undefined,
    startDate: Date,
    endDate: Date,
  ): Promise<number> {
    // Esta é uma simplificação - normalmente consultaria a tabela de appointments
    const stats = await this.repository.getEntriesStats(
      professionalId || '',
      startDate,
      endDate,
    );

    return stats.reduce((sum, s) => sum + s._count, 0);
  }

  private async calculateNewCustomersProgress(
    professionalId: string | undefined,
    startDate: Date,
    endDate: Date,
  ): Promise<number> {
    // Simplificação - seria necessário consultar clientes únicos no período
    return 0;
  }

  private async calculateProductSalesProgress(
    professionalId: string | undefined,
    startDate: Date,
    endDate: Date,
  ): Promise<number> {
    // Simplificação - seria necessário consultar vendas de produtos
    return 0;
  }

  private async calculateServiceCountProgress(
    professionalId: string | undefined,
    startDate: Date,
    endDate: Date,
  ): Promise<number> {
    const stats = await this.repository.getEntriesStats(
      professionalId || '',
      startDate,
      endDate,
    );

    return stats.reduce((sum, s) => sum + s._count, 0);
  }

  private async getPreviousPeriodProgress(
    goal: Goal,
    professionalId?: string,
  ): Promise<number | null> {
    // Simplificação - retorna null indicando que não há dados anteriores
    return null;
  }

  checkGoalAchievement(progress: GoalProgress, goal: Goal): {
    isAchieved: boolean;
    bonusAmount?: number;
    bonusPercentage?: number;
  } {
    if (!progress.isAchieved) {
      return { isAchieved: false };
    }

    return {
      isAchieved: true,
      bonusAmount: goal.bonusAmount,
      bonusPercentage: goal.bonusPercentage,
    };
  }
}
