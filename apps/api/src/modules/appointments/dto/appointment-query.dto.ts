import {
  IsUUID,
  IsOptional,
  IsString,
  IsISO8601,
  IsEnum,
  IsArray,
  IsNumber,
  Min,
  Max,
} from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { AppointmentStatus } from '@glamo/database';

/**
 * Ordenação de agendamentos
 */
export enum AppointmentSortBy {
  SCHEDULED_AT = 'scheduledAt',
  CREATED_AT = 'createdAt',
  STATUS = 'status',
  CLIENT_NAME = 'clientName',
  PROFESSIONAL_NAME = 'professionalName',
}

/**
 * DTO para consulta de agendamentos
 */
export class AppointmentQueryDto {
  @ApiPropertyOptional({ description: 'ID do profissional' })
  @IsOptional()
  @IsUUID()
  professionalId?: string;

  @ApiPropertyOptional({ description: 'ID do cliente' })
  @IsOptional()
  @IsUUID()
  clientId?: string;

  @ApiPropertyOptional({ description: 'Data inicial (ISO 8601)' })
  @IsOptional()
  @IsISO8601()
  startDate?: string;

  @ApiPropertyOptional({ description: 'Data final (ISO 8601)' })
  @IsOptional()
  @IsISO8601()
  endDate?: string;

  @ApiPropertyOptional({ description: 'Status dos agendamentos', enum: AppointmentStatus, isArray: true })
  @IsOptional()
  @IsArray()
  @IsEnum(AppointmentStatus, { each: true })
  @Transform(({ value }) => (Array.isArray(value) ? value : [value]))
  status?: AppointmentStatus[];

  @ApiPropertyOptional({ description: 'Busca por texto (cliente, profissional)' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ description: 'Ordenação', enum: AppointmentSortBy })
  @IsOptional()
  @IsEnum(AppointmentSortBy)
  sortBy?: AppointmentSortBy = AppointmentSortBy.SCHEDULED_AT;

  @ApiPropertyOptional({ description: 'Direção da ordenação' })
  @IsOptional()
  @IsEnum(['asc', 'desc'])
  sortOrder?: 'asc' | 'desc' = 'asc';

  @ApiPropertyOptional({ description: 'Página (1-indexed)' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ description: 'Itens por página' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(100)
  limit?: number = 20;
}

/**
 * DTO para consulta de disponibilidade
 */
export class AvailabilityQueryDto {
  @ApiPropertyOptional({ description: 'ID do profissional' })
  @IsOptional()
  @IsUUID()
  professionalId?: string;

  @ApiPropertyOptional({ description: 'IDs dos serviços' })
  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  @Transform(({ value }) => (Array.isArray(value) ? value : value?.split(',').filter(Boolean)))
  serviceIds?: string[];

  @ApiPropertyOptional({ description: 'Data inicial (ISO 8601)' })
  @IsISO8601()
  startDate: string;

  @ApiPropertyOptional({ description: 'Data final (ISO 8601)' })
  @IsISO8601()
  endDate: string;
}

/**
 * DTO para consulta de slots específicos
 */
export class SlotsQueryDto {
  @ApiPropertyOptional({ description: 'ID do profissional' })
  @IsUUID()
  professionalId: string;

  @ApiPropertyOptional({ description: 'IDs dos serviços' })
  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  @Transform(({ value }) => (Array.isArray(value) ? value : value?.split(',').filter(Boolean)))
  serviceIds?: string[];

  @ApiPropertyOptional({ description: 'Data específica (ISO 8601)' })
  @IsISO8601()
  date: string;
}
