import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsNumber, IsEnum, Min, IsArray } from 'class-validator';
import { Type } from 'class-transformer';
import { MetricType, ReportType } from '../interfaces';

export class AnalyticsQueryDto {
  @ApiPropertyOptional({ description: 'Data inicial' })
  @IsOptional()
  @IsString()
  startDate?: string;

  @ApiPropertyOptional({ description: 'Data final' })
  @IsOptional()
  @IsString()
  endDate?: string;

  @ApiPropertyOptional({ description: 'Preset de período' })
  @IsOptional()
  @IsString()
  preset?: 'today' | 'yesterday' | 'last7days' | 'last30days' | 'thisMonth' | 'lastMonth' | 'thisYear';

  @ApiPropertyOptional({ description: 'ID do profissional' })
  @IsOptional()
  @IsString()
  professionalId?: string;

  @ApiPropertyOptional({ description: 'ID do serviço' })
  @IsOptional()
  @IsString()
  serviceId?: string;

  @ApiPropertyOptional({ description: 'ID da categoria' })
  @IsOptional()
  @IsString()
  categoryId?: string;

  @ApiPropertyOptional({ description: 'Incluir comparação com período anterior' })
  @IsOptional()
  @IsString()
  comparison?: 'previous_period' | 'previous_year';
}

export class DashboardQueryDto {
  @ApiPropertyOptional({ description: 'Apenas dashboards padrão' })
  @IsOptional()
  @IsString()
  isDefault?: string;

  @ApiPropertyOptional({ description: 'Incluir compartilhados' })
  @IsOptional()
  @IsString()
  includeShared?: string;
}

export class ReportQueryDto {
  @ApiPropertyOptional({ enum: ReportType })
  @IsOptional()
  @IsEnum(ReportType)
  type?: ReportType;

  @ApiPropertyOptional({ description: 'Busca por nome' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ description: 'Página', default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  page?: number;

  @ApiPropertyOptional({ description: 'Limite por página', default: 20 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  limit?: number;
}

export class KPIQueryDto {
  @ApiPropertyOptional({ enum: MetricType })
  @IsOptional()
  @IsEnum(MetricType)
  metricType?: MetricType;

  @ApiPropertyOptional({ enum: ReportType })
  @IsOptional()
  @IsEnum(ReportType)
  period?: ReportType;
}

export class ExportQueryDto {
  @ApiPropertyOptional({ description: 'Formato de exportação' })
  @IsOptional()
  @IsString()
  format?: 'pdf' | 'excel' | 'csv' | 'json';

  @ApiPropertyOptional({ description: 'Data inicial' })
  @IsOptional()
  @IsString()
  startDate?: string;

  @ApiPropertyOptional({ description: 'Data final' })
  @IsOptional()
  @IsString()
  endDate?: string;

  @ApiPropertyOptional({ description: 'Métricas a incluir' })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  metrics?: string[];
}
