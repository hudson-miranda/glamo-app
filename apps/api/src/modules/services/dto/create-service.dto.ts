import {
  IsString,
  IsOptional,
  IsBoolean,
  IsNumber,
  IsUUID,
  IsEnum,
  IsArray,
  ValidateNested,
  Min,
  Max,
  MinLength,
  MaxLength,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  ServiceType,
  ServiceStatus,
  DurationType,
  PricingType,
} from '../interfaces';

/**
 * DTO para opção de serviço
 */
export class ServiceOptionDto {
  @ApiProperty({ description: 'Nome da opção', example: 'Cabelo Curto' })
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  name: string;

  @ApiPropertyOptional({ description: 'Descrição' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ description: 'Duração em minutos', example: 30 })
  @IsNumber()
  @Min(5)
  @Max(480)
  duration: number;

  @ApiProperty({ description: 'Ajuste de preço', example: 0 })
  @IsNumber()
  priceAdjustment: number;

  @ApiPropertyOptional({ description: 'Se é opção padrão', default: false })
  @IsOptional()
  @IsBoolean()
  isDefault?: boolean;
}

/**
 * DTO para preço por profissional
 */
export class ProfessionalPriceDto {
  @ApiProperty({ description: 'ID do profissional' })
  @IsUUID()
  professionalId: string;

  @ApiProperty({ description: 'Preço para este profissional', example: 80 })
  @IsNumber()
  @Min(0)
  price: number;

  @ApiPropertyOptional({ description: 'Duração override em minutos' })
  @IsOptional()
  @IsNumber()
  @Min(5)
  duration?: number;
}

/**
 * DTO para regra de preço dinâmico
 */
export class DynamicPricingRuleDto {
  @ApiProperty({ description: 'Nome da regra', example: 'Happy Hour' })
  @IsString()
  name: string;

  @ApiProperty({
    description: 'Tipo da regra',
    enum: ['TIME_BASED', 'DEMAND_BASED', 'DAY_BASED', 'SEASON_BASED'],
  })
  @IsString()
  type: 'TIME_BASED' | 'DEMAND_BASED' | 'DAY_BASED' | 'SEASON_BASED';

  @ApiProperty({ description: 'Condições da regra' })
  conditions: {
    daysOfWeek?: number[];
    startTime?: string;
    endTime?: string;
    startDate?: Date;
    endDate?: Date;
    occupancyThreshold?: number;
  };

  @ApiProperty({ description: 'Ajuste a aplicar' })
  adjustment: {
    type: 'PERCENTAGE' | 'FIXED';
    value: number;
  };

  @ApiPropertyOptional({ description: 'Prioridade', default: 0 })
  @IsOptional()
  @IsNumber()
  priority?: number;

  @ApiPropertyOptional({ description: 'Se está ativa', default: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

/**
 * DTO para item de combo
 */
export class ComboItemDto {
  @ApiProperty({ description: 'ID do serviço' })
  @IsUUID()
  serviceId: string;

  @ApiPropertyOptional({ description: 'Quantidade', default: 1 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  quantity?: number;

  @ApiPropertyOptional({ description: 'Se é opcional', default: false })
  @IsOptional()
  @IsBoolean()
  isOptional?: boolean;

  @ApiPropertyOptional({ description: 'Override de preço' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  priceOverride?: number;
}

/**
 * DTO para configuração de pacote
 */
export class PackageConfigDto {
  @ApiProperty({ description: 'Total de sessões', example: 10 })
  @IsNumber()
  @Min(2)
  sessionsTotal: number;

  @ApiProperty({ description: 'Validade em dias', example: 180 })
  @IsNumber()
  @Min(1)
  validityDays: number;

  @ApiProperty({ description: 'Preço total do pacote', example: 800 })
  @IsNumber()
  @Min(0)
  totalPrice: number;

  @ApiPropertyOptional({ description: 'Desconto aplicado', default: 0 })
  @IsOptional()
  @IsNumber()
  discount?: number;
}

/**
 * DTO para disponibilidade
 */
export class ServiceAvailabilityDto {
  @ApiProperty({
    description: 'Dias da semana (0=Dom, 6=Sab)',
    example: [1, 2, 3, 4, 5],
  })
  @IsArray()
  @IsNumber({}, { each: true })
  daysOfWeek: number[];

  @ApiProperty({ description: 'Horário de início', example: '09:00' })
  @IsString()
  startTime: string;

  @ApiProperty({ description: 'Horário de fim', example: '18:00' })
  @IsString()
  endTime: string;
}

/**
 * DTO para requisitos do serviço
 */
export class ServiceRequirementsDto {
  @ApiPropertyOptional({ description: 'Idade mínima' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  minAge?: number;

  @ApiPropertyOptional({ description: 'Idade máxima' })
  @IsOptional()
  @IsNumber()
  maxAge?: number;

  @ApiPropertyOptional({ description: 'Restrição de gênero', enum: ['M', 'F'] })
  @IsOptional()
  @IsString()
  genderRestriction?: 'M' | 'F';

  @ApiPropertyOptional({ description: 'Requer consulta prévia', default: false })
  @IsOptional()
  @IsBoolean()
  requiresConsultation?: boolean;

  @ApiPropertyOptional({ description: 'Requer depósito', default: false })
  @IsOptional()
  @IsBoolean()
  requiresDeposit?: boolean;

  @ApiPropertyOptional({ description: 'Valor do depósito' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  depositAmount?: number;

  @ApiPropertyOptional({ description: 'Percentual do depósito' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  depositPercentage?: number;

  @ApiPropertyOptional({ description: 'Horas para cancelamento' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  cancellationHours?: number;

  @ApiPropertyOptional({ description: 'Observações' })
  @IsOptional()
  @IsString()
  notes?: string;
}

/**
 * DTO para criar serviço
 */
export class CreateServiceDto {
  @ApiProperty({ description: 'ID da categoria' })
  @IsUUID()
  categoryId: string;

  @ApiProperty({ description: 'Nome do serviço', example: 'Corte Feminino' })
  @IsString()
  @MinLength(2)
  @MaxLength(150)
  name: string;

  @ApiPropertyOptional({ description: 'Descrição completa' })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  description?: string;

  @ApiPropertyOptional({ description: 'Descrição curta' })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  shortDescription?: string;

  @ApiPropertyOptional({
    description: 'Tipo do serviço',
    enum: ServiceType,
    default: ServiceType.SINGLE,
  })
  @IsOptional()
  @IsEnum(ServiceType)
  type?: ServiceType;

  @ApiPropertyOptional({
    description: 'Status',
    enum: ServiceStatus,
    default: ServiceStatus.ACTIVE,
  })
  @IsOptional()
  @IsEnum(ServiceStatus)
  status?: ServiceStatus;

  // Duração
  @ApiPropertyOptional({
    description: 'Tipo de duração',
    enum: DurationType,
    default: DurationType.FIXED,
  })
  @IsOptional()
  @IsEnum(DurationType)
  durationType?: DurationType;

  @ApiProperty({ description: 'Duração em minutos', example: 60 })
  @IsNumber()
  @Min(5)
  @Max(480)
  duration: number;

  @ApiPropertyOptional({ description: 'Duração mínima (para variável)' })
  @IsOptional()
  @IsNumber()
  @Min(5)
  durationMin?: number;

  @ApiPropertyOptional({ description: 'Duração máxima (para variável)' })
  @IsOptional()
  @IsNumber()
  @Max(480)
  durationMax?: number;

  @ApiPropertyOptional({ description: 'Tempo de preparação em minutos', default: 0 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  bufferTimeBefore?: number;

  @ApiPropertyOptional({ description: 'Tempo de limpeza em minutos', default: 0 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  bufferTimeAfter?: number;

  // Precificação
  @ApiPropertyOptional({
    description: 'Tipo de precificação',
    enum: PricingType,
    default: PricingType.FIXED,
  })
  @IsOptional()
  @IsEnum(PricingType)
  pricingType?: PricingType;

  @ApiProperty({ description: 'Preço base', example: 80 })
  @IsNumber()
  @Min(0)
  price: number;

  @ApiPropertyOptional({ description: 'Preço mínimo (para "a partir de")' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  priceMin?: number;

  @ApiPropertyOptional({ description: 'Preço máximo' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  priceMax?: number;

  @ApiPropertyOptional({ description: 'Opções de serviço', type: [ServiceOptionDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ServiceOptionDto)
  options?: ServiceOptionDto[];

  @ApiPropertyOptional({ description: 'Preços por profissional', type: [ProfessionalPriceDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ProfessionalPriceDto)
  professionalPrices?: ProfessionalPriceDto[];

  @ApiPropertyOptional({ description: 'Regras de preço dinâmico', type: [DynamicPricingRuleDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => DynamicPricingRuleDto)
  dynamicPricingRules?: DynamicPricingRuleDto[];

  // Combo/Pacote
  @ApiPropertyOptional({ description: 'Itens do combo', type: [ComboItemDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ComboItemDto)
  comboItems?: ComboItemDto[];

  @ApiPropertyOptional({ description: 'Configuração do pacote', type: PackageConfigDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => PackageConfigDto)
  packageConfig?: PackageConfigDto;

  @ApiPropertyOptional({ description: 'Desconto do combo em %' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  comboDiscount?: number;

  // Disponibilidade
  @ApiPropertyOptional({ description: 'Disponibilidade', type: ServiceAvailabilityDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => ServiceAvailabilityDto)
  availability?: ServiceAvailabilityDto;

  @ApiPropertyOptional({ description: 'Máximo de agendamentos por dia' })
  @IsOptional()
  @IsNumber()
  @Min(1)
  maxDailyBookings?: number;

  @ApiPropertyOptional({ description: 'Máximo de agendamentos simultâneos' })
  @IsOptional()
  @IsNumber()
  @Min(1)
  maxConcurrentBookings?: number;

  // Requisitos
  @ApiPropertyOptional({ description: 'Requisitos', type: ServiceRequirementsDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => ServiceRequirementsDto)
  requirements?: ServiceRequirementsDto;

  // Profissionais
  @ApiPropertyOptional({ description: 'IDs dos profissionais que realizam', type: [String] })
  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  professionalIds?: string[];

  // SEO e Marketing
  @ApiPropertyOptional({ description: 'URLs das imagens', type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  images?: string[];

  @ApiPropertyOptional({ description: 'Tags', type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @ApiPropertyOptional({ description: 'Cor em hexadecimal' })
  @IsOptional()
  @IsString()
  color?: string;

  @ApiPropertyOptional({ description: 'Ícone' })
  @IsOptional()
  @IsString()
  icon?: string;

  @ApiPropertyOptional({ description: 'Ordem de exibição', default: 0 })
  @IsOptional()
  @IsNumber()
  displayOrder?: number;

  // Fidelidade
  @ApiPropertyOptional({ description: 'Pontos de fidelidade ganhos', default: 0 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  loyaltyPointsEarned?: number;

  @ApiPropertyOptional({ description: 'Pontos necessários para resgatar', default: 0 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  loyaltyPointsRequired?: number;

  // Flags
  @ApiPropertyOptional({ description: 'Disponível para agendamento online', default: true })
  @IsOptional()
  @IsBoolean()
  isOnlineBookingEnabled?: boolean;

  @ApiPropertyOptional({ description: 'Marcar como popular', default: false })
  @IsOptional()
  @IsBoolean()
  isPopular?: boolean;

  @ApiPropertyOptional({ description: 'Destacar', default: false })
  @IsOptional()
  @IsBoolean()
  isFeatured?: boolean;

  @ApiPropertyOptional({ description: 'Requer confirmação manual', default: false })
  @IsOptional()
  @IsBoolean()
  requiresConfirmation?: boolean;
}
