import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsEnum,
  IsBoolean,
  IsNumber,
  IsObject,
  IsArray,
  ValidateNested,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ReportType, MetricType, ChartType, DashboardWidgetType } from '../interfaces';

// ========================
// DATE RANGE
// ========================

export class DateRangeDto {
  @ApiProperty({ description: 'Data inicial', example: '2024-01-01' })
  @IsString()
  startDate: string;

  @ApiProperty({ description: 'Data final', example: '2024-01-31' })
  @IsString()
  endDate: string;

  @ApiPropertyOptional({ description: 'Preset de período' })
  @IsOptional()
  @IsString()
  preset?: string;
}

// ========================
// WIDGET POSITION
// ========================

export class WidgetPositionDto {
  @ApiProperty({ description: 'Posição X' })
  @IsNumber()
  @Min(0)
  x: number;

  @ApiProperty({ description: 'Posição Y' })
  @IsNumber()
  @Min(0)
  y: number;

  @ApiProperty({ description: 'Largura' })
  @IsNumber()
  @Min(1)
  width: number;

  @ApiProperty({ description: 'Altura' })
  @IsNumber()
  @Min(1)
  height: number;
}

// ========================
// WIDGET CONFIG
// ========================

export class WidgetFormattingDto {
  @ApiPropertyOptional({ description: 'Prefixo' })
  @IsOptional()
  @IsString()
  prefix?: string;

  @ApiPropertyOptional({ description: 'Sufixo' })
  @IsOptional()
  @IsString()
  suffix?: string;

  @ApiPropertyOptional({ description: 'Casas decimais' })
  @IsOptional()
  @IsNumber()
  decimals?: number;

  @ApiPropertyOptional({ description: 'Cor' })
  @IsOptional()
  @IsString()
  color?: string;
}

export class WidgetThresholdsDto {
  @ApiPropertyOptional({ description: 'Limite de aviso' })
  @IsOptional()
  @IsNumber()
  warning?: number;

  @ApiPropertyOptional({ description: 'Limite de perigo' })
  @IsOptional()
  @IsNumber()
  danger?: number;

  @ApiPropertyOptional({ description: 'Limite de sucesso' })
  @IsOptional()
  @IsNumber()
  success?: number;
}

export class WidgetConfigDto {
  @ApiPropertyOptional({ enum: MetricType })
  @IsOptional()
  @IsEnum(MetricType)
  metricType?: MetricType;

  @ApiPropertyOptional({ enum: ChartType })
  @IsOptional()
  @IsEnum(ChartType)
  chartType?: ChartType;

  @ApiPropertyOptional({ type: DateRangeDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => DateRangeDto)
  dateRange?: DateRangeDto;

  @ApiPropertyOptional({ description: 'Filtros' })
  @IsOptional()
  @IsObject()
  filters?: Record<string, any>;

  @ApiPropertyOptional({ type: WidgetFormattingDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => WidgetFormattingDto)
  formatting?: WidgetFormattingDto;

  @ApiPropertyOptional({ type: WidgetThresholdsDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => WidgetThresholdsDto)
  thresholds?: WidgetThresholdsDto;
}

// ========================
// DASHBOARD WIDGET
// ========================

export class DashboardWidgetDto {
  @ApiPropertyOptional({ description: 'ID do widget (para atualização)' })
  @IsOptional()
  @IsString()
  id?: string;

  @ApiProperty({ enum: DashboardWidgetType })
  @IsEnum(DashboardWidgetType)
  type: DashboardWidgetType;

  @ApiProperty({ description: 'Título do widget' })
  @IsString()
  title: string;

  @ApiPropertyOptional({ description: 'Descrição' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ type: WidgetPositionDto })
  @ValidateNested()
  @Type(() => WidgetPositionDto)
  position: WidgetPositionDto;

  @ApiProperty({ type: WidgetConfigDto })
  @ValidateNested()
  @Type(() => WidgetConfigDto)
  config: WidgetConfigDto;
}

// ========================
// DASHBOARD LAYOUT
// ========================

export class DashboardLayoutDto {
  @ApiProperty({ description: 'Número de colunas', default: 12 })
  @IsNumber()
  @Min(1)
  columns: number;

  @ApiPropertyOptional({ description: 'Número de linhas' })
  @IsOptional()
  @IsNumber()
  rows?: number;

  @ApiPropertyOptional({ description: 'Espaçamento' })
  @IsOptional()
  @IsNumber()
  gaps?: number;
}

// ========================
// CREATE DASHBOARD
// ========================

export class CreateDashboardDto {
  @ApiProperty({ description: 'Nome do dashboard' })
  @IsString()
  name: string;

  @ApiPropertyOptional({ description: 'Descrição' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ description: 'Dashboard padrão', default: false })
  @IsOptional()
  @IsBoolean()
  isDefault?: boolean;

  @ApiPropertyOptional({ description: 'Dashboard compartilhado', default: false })
  @IsOptional()
  @IsBoolean()
  isShared?: boolean;

  @ApiProperty({ type: DashboardLayoutDto })
  @ValidateNested()
  @Type(() => DashboardLayoutDto)
  layout: DashboardLayoutDto;

  @ApiPropertyOptional({ type: [DashboardWidgetDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => DashboardWidgetDto)
  widgets?: DashboardWidgetDto[];

  @ApiPropertyOptional({ description: 'Intervalo de atualização em segundos' })
  @IsOptional()
  @IsNumber()
  refreshInterval?: number;
}

export class UpdateDashboardDto extends PartialType(CreateDashboardDto) {}

// ========================
// REPORT CONFIG
// ========================

export class ReportConfigDto {
  @ApiProperty({ enum: MetricType, isArray: true })
  @IsArray()
  @IsEnum(MetricType, { each: true })
  metrics: MetricType[];

  @ApiPropertyOptional({ description: 'Dimensões' })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  dimensions?: string[];

  @ApiProperty({ type: DateRangeDto })
  @ValidateNested()
  @Type(() => DateRangeDto)
  dateRange: DateRangeDto;

  @ApiPropertyOptional({ description: 'Filtros' })
  @IsOptional()
  @IsObject()
  filters?: Record<string, any>;

  @ApiPropertyOptional({ description: 'Agrupar por' })
  @IsOptional()
  @IsString()
  groupBy?: string;

  @ApiPropertyOptional({ description: 'Ordenar por' })
  @IsOptional()
  @IsString()
  sortBy?: string;

  @ApiPropertyOptional({ description: 'Ordem', enum: ['asc', 'desc'] })
  @IsOptional()
  @IsString()
  sortOrder?: 'asc' | 'desc';

  @ApiPropertyOptional({ description: 'Limite de resultados' })
  @IsOptional()
  @IsNumber()
  limit?: number;

  @ApiPropertyOptional({ description: 'Incluir gráficos' })
  @IsOptional()
  @IsBoolean()
  includeCharts?: boolean;

  @ApiPropertyOptional({ description: 'Incluir resumo' })
  @IsOptional()
  @IsBoolean()
  includeSummary?: boolean;
}

// ========================
// REPORT SCHEDULE
// ========================

export class ReportScheduleDto {
  @ApiProperty({ description: 'Agendamento ativo' })
  @IsBoolean()
  enabled: boolean;

  @ApiProperty({ description: 'Frequência', enum: ['daily', 'weekly', 'monthly'] })
  @IsString()
  frequency: 'daily' | 'weekly' | 'monthly';

  @ApiPropertyOptional({ description: 'Dia da semana (0-6)' })
  @IsOptional()
  @IsNumber()
  dayOfWeek?: number;

  @ApiPropertyOptional({ description: 'Dia do mês (1-31)' })
  @IsOptional()
  @IsNumber()
  dayOfMonth?: number;

  @ApiProperty({ description: 'Hora de envio', example: '09:00' })
  @IsString()
  time: string;

  @ApiProperty({ description: 'Destinatários' })
  @IsArray()
  @IsString({ each: true })
  recipients: string[];

  @ApiProperty({ description: 'Formato', enum: ['pdf', 'excel', 'csv'] })
  @IsString()
  format: 'pdf' | 'excel' | 'csv';
}

// ========================
// CREATE REPORT
// ========================

export class CreateReportDto {
  @ApiProperty({ description: 'Nome do relatório' })
  @IsString()
  name: string;

  @ApiPropertyOptional({ description: 'Descrição' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ enum: ReportType })
  @IsEnum(ReportType)
  type: ReportType;

  @ApiProperty({ type: ReportConfigDto })
  @ValidateNested()
  @Type(() => ReportConfigDto)
  config: ReportConfigDto;

  @ApiPropertyOptional({ type: ReportScheduleDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => ReportScheduleDto)
  schedule?: ReportScheduleDto;
}

export class UpdateReportDto extends PartialType(CreateReportDto) {}

// ========================
// KPI
// ========================

export class CreateKPIDto {
  @ApiProperty({ description: 'Nome do KPI' })
  @IsString()
  name: string;

  @ApiPropertyOptional({ description: 'Descrição' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ enum: MetricType })
  @IsEnum(MetricType)
  metricType: MetricType;

  @ApiProperty({ description: 'Valor alvo' })
  @IsNumber()
  targetValue: number;

  @ApiProperty({ description: 'Unidade', example: 'R$' })
  @IsString()
  unit: string;

  @ApiProperty({ enum: ReportType })
  @IsEnum(ReportType)
  period: ReportType;
}

export class UpdateKPIDto extends PartialType(CreateKPIDto) {}

// ========================
// ALERT
// ========================

export class CreateAlertDto {
  @ApiProperty({ description: 'Nome do alerta' })
  @IsString()
  name: string;

  @ApiPropertyOptional({ description: 'Descrição' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ enum: MetricType })
  @IsEnum(MetricType)
  metric: MetricType;

  @ApiProperty({ description: 'Condição', enum: ['above', 'below', 'equals', 'change_percent'] })
  @IsString()
  condition: 'above' | 'below' | 'equals' | 'change_percent';

  @ApiProperty({ description: 'Limite' })
  @IsNumber()
  threshold: number;

  @ApiProperty({ description: 'Destinatários' })
  @IsArray()
  @IsString({ each: true })
  recipients: string[];

  @ApiProperty({ description: 'Canais', enum: ['email', 'push', 'sms'], isArray: true })
  @IsArray()
  @IsString({ each: true })
  channels: ('email' | 'push' | 'sms')[];
}

export class UpdateAlertDto extends PartialType(CreateAlertDto) {
  @ApiPropertyOptional({ description: 'Alerta ativo' })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
