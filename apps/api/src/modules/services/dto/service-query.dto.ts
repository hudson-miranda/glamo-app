import {
  IsString,
  IsOptional,
  IsBoolean,
  IsNumber,
  IsUUID,
  IsEnum,
  IsArray,
  Min,
  Max,
} from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { ServiceType, ServiceStatus, PricingType } from '../interfaces';

/**
 * Ordenação de serviços
 */
export enum ServiceSortBy {
  NAME = 'name',
  PRICE = 'price',
  DURATION = 'duration',
  DISPLAY_ORDER = 'displayOrder',
  POPULARITY = 'totalBookings',
  RATING = 'averageRating',
  CREATED_AT = 'createdAt',
  UPDATED_AT = 'updatedAt',
}

/**
 * Direção da ordenação
 */
export enum SortDirection {
  ASC = 'asc',
  DESC = 'desc',
}

/**
 * DTO para consulta de serviços
 */
export class ServiceQueryDto {
  @ApiPropertyOptional({ description: 'Página', default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ description: 'Itens por página', default: 20 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(100)
  limit?: number = 20;

  @ApiPropertyOptional({ description: 'Termo de busca' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ description: 'ID da categoria' })
  @IsOptional()
  @IsUUID()
  categoryId?: string;

  @ApiPropertyOptional({ description: 'IDs das categorias', type: [String] })
  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  categoryIds?: string[];

  @ApiPropertyOptional({ description: 'ID do profissional' })
  @IsOptional()
  @IsUUID()
  professionalId?: string;

  @ApiPropertyOptional({ description: 'Tipo do serviço', enum: ServiceType })
  @IsOptional()
  @IsEnum(ServiceType)
  type?: ServiceType;

  @ApiPropertyOptional({ description: 'Status', enum: ServiceStatus })
  @IsOptional()
  @IsEnum(ServiceStatus)
  status?: ServiceStatus;

  @ApiPropertyOptional({ description: 'Tipo de precificação', enum: PricingType })
  @IsOptional()
  @IsEnum(PricingType)
  pricingType?: PricingType;

  @ApiPropertyOptional({ description: 'Preço mínimo' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  priceMin?: number;

  @ApiPropertyOptional({ description: 'Preço máximo' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  priceMax?: number;

  @ApiPropertyOptional({ description: 'Duração mínima em minutos' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  durationMin?: number;

  @ApiPropertyOptional({ description: 'Duração máxima em minutos' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  durationMax?: number;

  @ApiPropertyOptional({ description: 'Tags', type: [String] })
  @IsOptional()
  @Transform(({ value }) => (typeof value === 'string' ? [value] : value))
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @ApiPropertyOptional({ description: 'Apenas populares' })
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  isPopular?: boolean;

  @ApiPropertyOptional({ description: 'Apenas destacados' })
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  isFeatured?: boolean;

  @ApiPropertyOptional({ description: 'Disponível para agendamento online' })
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  isOnlineBookingEnabled?: boolean;

  @ApiPropertyOptional({ description: 'Campo de ordenação', enum: ServiceSortBy })
  @IsOptional()
  @IsEnum(ServiceSortBy)
  sortBy?: ServiceSortBy = ServiceSortBy.DISPLAY_ORDER;

  @ApiPropertyOptional({ description: 'Direção da ordenação', enum: SortDirection })
  @IsOptional()
  @IsEnum(SortDirection)
  sortDirection?: SortDirection = SortDirection.ASC;

  @ApiPropertyOptional({ description: 'Incluir serviços deletados' })
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  includeDeleted?: boolean;
}

/**
 * DTO para busca de categoria
 */
export class CategoryQueryDto {
  @ApiPropertyOptional({ description: 'Apenas ativas', default: true })
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  activeOnly?: boolean = true;

  @ApiPropertyOptional({ description: 'Incluir contagem de serviços', default: true })
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  includeServicesCount?: boolean = true;

  @ApiPropertyOptional({ description: 'Incluir subcategorias', default: true })
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  includeChildren?: boolean = true;

  @ApiPropertyOptional({ description: 'ID da categoria pai' })
  @IsOptional()
  @IsUUID()
  parentId?: string;
}

/**
 * DTO para cálculo de preço
 */
export class CalculatePriceDto {
  @ApiPropertyOptional({ description: 'ID da opção selecionada' })
  @IsOptional()
  @IsString()
  optionId?: string;

  @ApiPropertyOptional({ description: 'ID do profissional' })
  @IsOptional()
  @IsUUID()
  professionalId?: string;

  @ApiPropertyOptional({ description: 'Data do agendamento' })
  @IsOptional()
  @Type(() => Date)
  date?: Date;

  @ApiPropertyOptional({ description: 'Horário', example: '14:00' })
  @IsOptional()
  @IsString()
  time?: string;
}
