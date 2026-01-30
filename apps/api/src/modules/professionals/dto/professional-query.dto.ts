import {
  IsString,
  IsOptional,
  IsBoolean,
  IsNumber,
  IsUUID,
  IsEnum,
  IsArray,
  IsDateString,
  Min,
  Max,
} from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { ProfessionalStatus, ContractType } from '../interfaces';

/**
 * Ordenação de profissionais
 */
export enum ProfessionalSortBy {
  NAME = 'name',
  DISPLAY_ORDER = 'displayOrder',
  HIRE_DATE = 'hireDate',
  RATING = 'averageRating',
  APPOINTMENTS = 'totalAppointments',
  REVENUE = 'totalRevenue',
  CREATED_AT = 'createdAt',
}

/**
 * Direção da ordenação
 */
export enum SortDirection {
  ASC = 'asc',
  DESC = 'desc',
}

/**
 * DTO para consulta de profissionais
 */
export class ProfessionalQueryDto {
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

  @ApiPropertyOptional({ description: 'Status', enum: ProfessionalStatus })
  @IsOptional()
  @IsEnum(ProfessionalStatus)
  status?: ProfessionalStatus;

  @ApiPropertyOptional({ description: 'Tipo de contrato', enum: ContractType })
  @IsOptional()
  @IsEnum(ContractType)
  contractType?: ContractType;

  @ApiPropertyOptional({ description: 'ID do serviço' })
  @IsOptional()
  @IsUUID()
  serviceId?: string;

  @ApiPropertyOptional({ description: 'Especialidade' })
  @IsOptional()
  @IsString()
  specialty?: string;

  @ApiPropertyOptional({ description: 'Aceita agendamento online' })
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  isOnlineBookingEnabled?: boolean;

  @ApiPropertyOptional({ description: 'Aceita novos clientes' })
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  acceptsNewCustomers?: boolean;

  @ApiPropertyOptional({ description: 'Campo de ordenação', enum: ProfessionalSortBy })
  @IsOptional()
  @IsEnum(ProfessionalSortBy)
  sortBy?: ProfessionalSortBy = ProfessionalSortBy.DISPLAY_ORDER;

  @ApiPropertyOptional({ description: 'Direção da ordenação', enum: SortDirection })
  @IsOptional()
  @IsEnum(SortDirection)
  sortDirection?: SortDirection = SortDirection.ASC;

  @ApiPropertyOptional({ description: 'Incluir deletados' })
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  includeDeleted?: boolean;
}

/**
 * DTO para consulta de disponibilidade
 */
export class AvailabilityQueryDto {
  @ApiPropertyOptional({ description: 'Data (YYYY-MM-DD)' })
  @IsDateString()
  date: string;

  @ApiPropertyOptional({ description: 'ID do serviço' })
  @IsOptional()
  @IsUUID()
  serviceId?: string;

  @ApiPropertyOptional({ description: 'Duração em minutos' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(5)
  duration?: number;
}

/**
 * DTO para consulta de disponibilidade em período
 */
export class AvailabilityRangeQueryDto {
  @ApiPropertyOptional({ description: 'Data inicial (YYYY-MM-DD)' })
  @IsDateString()
  startDate: string;

  @ApiPropertyOptional({ description: 'Data final (YYYY-MM-DD)' })
  @IsDateString()
  endDate: string;

  @ApiPropertyOptional({ description: 'ID do serviço' })
  @IsOptional()
  @IsUUID()
  serviceId?: string;
}
