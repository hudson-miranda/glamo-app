import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsEnum, IsUUID, IsDateString, IsNumber, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';
import { CommissionStatus, PaymentStatus, GoalType, GoalPeriod } from '../interfaces';

export class CommissionQueryDto {
  @ApiPropertyOptional({ description: 'ID do profissional' })
  @IsUUID()
  @IsOptional()
  professionalId?: string;

  @ApiPropertyOptional({ enum: CommissionStatus, description: 'Status' })
  @IsEnum(CommissionStatus)
  @IsOptional()
  status?: CommissionStatus;

  @ApiPropertyOptional({ enum: ['APPOINTMENT', 'SALE', 'REFERRAL', 'BONUS'] })
  @IsOptional()
  referenceType?: 'APPOINTMENT' | 'SALE' | 'REFERRAL' | 'BONUS';

  @ApiPropertyOptional({ description: 'ID do serviço' })
  @IsUUID()
  @IsOptional()
  serviceId?: string;

  @ApiPropertyOptional({ description: 'Data inicial' })
  @IsDateString()
  @IsOptional()
  startDate?: string;

  @ApiPropertyOptional({ description: 'Data final' })
  @IsDateString()
  @IsOptional()
  endDate?: string;

  @ApiPropertyOptional({ description: 'Página', default: 1 })
  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ description: 'Limite por página', default: 20 })
  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  @Min(1)
  @Max(100)
  limit?: number = 20;
}

export class PaymentQueryDto {
  @ApiPropertyOptional({ description: 'ID do profissional' })
  @IsUUID()
  @IsOptional()
  professionalId?: string;

  @ApiPropertyOptional({ enum: PaymentStatus, description: 'Status' })
  @IsEnum(PaymentStatus)
  @IsOptional()
  status?: PaymentStatus;

  @ApiPropertyOptional({ description: 'Data inicial' })
  @IsDateString()
  @IsOptional()
  startDate?: string;

  @ApiPropertyOptional({ description: 'Data final' })
  @IsDateString()
  @IsOptional()
  endDate?: string;

  @ApiPropertyOptional({ description: 'Página', default: 1 })
  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ description: 'Limite por página', default: 20 })
  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  @Min(1)
  @Max(100)
  limit?: number = 20;
}

export class GoalQueryDto {
  @ApiPropertyOptional({ description: 'ID do profissional' })
  @IsUUID()
  @IsOptional()
  professionalId?: string;

  @ApiPropertyOptional({ enum: GoalType, description: 'Tipo' })
  @IsEnum(GoalType)
  @IsOptional()
  type?: GoalType;

  @ApiPropertyOptional({ enum: GoalPeriod, description: 'Período' })
  @IsEnum(GoalPeriod)
  @IsOptional()
  period?: GoalPeriod;

  @ApiPropertyOptional({ description: 'Apenas ativas?' })
  @IsOptional()
  activeOnly?: boolean;

  @ApiPropertyOptional({ description: 'Incluir globais?' })
  @IsOptional()
  includeGlobal?: boolean;
}

export class ReportQueryDto {
  @ApiProperty({ description: 'Data inicial' })
  @IsDateString()
  startDate: string;

  @ApiProperty({ description: 'Data final' })
  @IsDateString()
  endDate: string;

  @ApiPropertyOptional({ description: 'ID do profissional' })
  @IsUUID()
  @IsOptional()
  professionalId?: string;

  @ApiPropertyOptional({ description: 'Agrupar por', enum: ['day', 'week', 'month'] })
  @IsOptional()
  groupBy?: 'day' | 'week' | 'month';
}

import { ApiProperty } from '@nestjs/swagger';

export class SummaryQueryDto {
  @ApiProperty({ description: 'ID do profissional' })
  @IsUUID()
  professionalId: string;

  @ApiPropertyOptional({ description: 'Data inicial' })
  @IsDateString()
  @IsOptional()
  startDate?: string;

  @ApiPropertyOptional({ description: 'Data final' })
  @IsDateString()
  @IsOptional()
  endDate?: string;
}
