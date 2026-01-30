import {
  IsOptional,
  IsString,
  IsArray,
  IsEnum,
  IsBoolean,
  IsNumber,
  IsDateString,
  Min,
  Max,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { CustomerGender, LoyaltyTier } from '../interfaces';

/**
 * Ordenação dos resultados
 */
export enum CustomerSortBy {
  NAME = 'name',
  CREATED_AT = 'createdAt',
  LAST_VISIT = 'lastVisitAt',
  TOTAL_SPENT = 'totalSpent',
  TOTAL_APPOINTMENTS = 'totalAppointments',
}

/**
 * Direção da ordenação
 */
export enum SortDirection {
  ASC = 'asc',
  DESC = 'desc',
}

/**
 * DTO para consulta de clientes com filtros e paginação
 */
export class CustomerQueryDto {
  // Paginação
  @ApiPropertyOptional({ default: 1, minimum: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ default: 20, minimum: 1, maximum: 100 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(100)
  limit?: number = 20;

  // Busca textual
  @ApiPropertyOptional({ description: 'Busca por nome, email ou telefone' })
  @IsOptional()
  @IsString()
  search?: string;

  // Filtros básicos
  @ApiPropertyOptional({ enum: CustomerGender })
  @IsOptional()
  @IsEnum(CustomerGender)
  gender?: CustomerGender;

  @ApiPropertyOptional({ type: [String], description: 'Filtrar por tags' })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @ApiPropertyOptional({ enum: LoyaltyTier })
  @IsOptional()
  @IsEnum(LoyaltyTier)
  loyaltyTier?: LoyaltyTier;

  @ApiPropertyOptional({ description: 'Filtrar por segmento' })
  @IsOptional()
  @IsString()
  segment?: string;

  // Filtros de data
  @ApiPropertyOptional({ description: 'Criados a partir de' })
  @IsOptional()
  @IsDateString()
  createdFrom?: string;

  @ApiPropertyOptional({ description: 'Criados até' })
  @IsOptional()
  @IsDateString()
  createdTo?: string;

  @ApiPropertyOptional({ description: 'Última visita a partir de' })
  @IsOptional()
  @IsDateString()
  lastVisitFrom?: string;

  @ApiPropertyOptional({ description: 'Última visita até' })
  @IsOptional()
  @IsDateString()
  lastVisitTo?: string;

  // Filtros de métricas
  @ApiPropertyOptional({ description: 'Total gasto mínimo' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  minTotalSpent?: number;

  @ApiPropertyOptional({ description: 'Total gasto máximo' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  maxTotalSpent?: number;

  @ApiPropertyOptional({ description: 'Mínimo de agendamentos' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  minAppointments?: number;

  @ApiPropertyOptional({ description: 'Máximo de agendamentos' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  maxAppointments?: number;

  // Filtros booleanos
  @ApiPropertyOptional({ description: 'Aceita marketing' })
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  acceptsMarketing?: boolean;

  @ApiPropertyOptional({ description: 'Tem email' })
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  hasEmail?: boolean;

  @ApiPropertyOptional({ description: 'Aniversariantes do mês atual' })
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  birthdayThisMonth?: boolean;

  // Ordenação
  @ApiPropertyOptional({ enum: CustomerSortBy, default: CustomerSortBy.NAME })
  @IsOptional()
  @IsEnum(CustomerSortBy)
  sortBy?: CustomerSortBy = CustomerSortBy.NAME;

  @ApiPropertyOptional({ enum: SortDirection, default: SortDirection.ASC })
  @IsOptional()
  @IsEnum(SortDirection)
  sortDirection?: SortDirection = SortDirection.ASC;

  // Incluir relacionamentos
  @ApiPropertyOptional({ description: 'Incluir métricas calculadas' })
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  includeMetrics?: boolean;

  @ApiPropertyOptional({ description: 'Incluir informações de fidelidade' })
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  includeLoyalty?: boolean;
}

/**
 * DTO para busca avançada
 */
export class CustomerAdvancedSearchDto extends CustomerQueryDto {
  @ApiPropertyOptional({ description: 'Busca fonética (similar)' })
  @IsOptional()
  @IsString()
  phoneticSearch?: string;

  @ApiPropertyOptional({ description: 'IDs de profissionais preferidos' })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  preferredProfessionalIds?: string[];

  @ApiPropertyOptional({ description: 'IDs de serviços utilizados' })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  usedServiceIds?: string[];

  @ApiPropertyOptional({ description: 'Fonte de aquisição' })
  @IsOptional()
  @IsString()
  acquisitionSource?: string;
}
