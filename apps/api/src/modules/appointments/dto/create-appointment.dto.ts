import {
  IsUUID,
  IsArray,
  IsOptional,
  IsString,
  IsISO8601,
  IsEnum,
  IsNumber,
  IsBoolean,
  ValidateNested,
  Min,
  MaxLength,
  ArrayMinSize,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/**
 * Enum para tipo de recorrência
 */
export enum RecurrenceType {
  NONE = 'NONE',
  DAILY = 'DAILY',
  WEEKLY = 'WEEKLY',
  BIWEEKLY = 'BIWEEKLY',
  MONTHLY = 'MONTHLY',
}

/**
 * DTO para serviço no agendamento
 */
export class AppointmentServiceDto {
  @ApiProperty({ description: 'ID do serviço' })
  @IsUUID()
  serviceId: string;

  @ApiPropertyOptional({ description: 'Quantidade (padrão: 1)' })
  @IsOptional()
  @IsNumber()
  @Min(1)
  quantity?: number = 1;

  @ApiPropertyOptional({ description: 'Preço customizado (se diferente do padrão)' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  customPrice?: number;
}

/**
 * DTO para criação de agendamento
 */
export class CreateAppointmentDto {
  @ApiProperty({ description: 'ID do cliente' })
  @IsUUID()
  clientId: string;

  @ApiProperty({ description: 'ID do profissional' })
  @IsUUID()
  professionalId: string;

  @ApiProperty({ description: 'Serviços do agendamento', type: [AppointmentServiceDto] })
  @IsArray()
  @ArrayMinSize(1, { message: 'Pelo menos um serviço deve ser selecionado' })
  @ValidateNested({ each: true })
  @Type(() => AppointmentServiceDto)
  services: AppointmentServiceDto[];

  @ApiProperty({ description: 'Data e hora de início (ISO 8601)' })
  @IsISO8601()
  scheduledAt: string;

  @ApiPropertyOptional({ description: 'Observações do agendamento' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  notes?: string;

  @ApiPropertyOptional({ description: 'Tipo de recorrência', enum: RecurrenceType })
  @IsOptional()
  @IsEnum(RecurrenceType)
  recurrence?: RecurrenceType = RecurrenceType.NONE;

  @ApiPropertyOptional({ description: 'Número de ocorrências (para recorrência)' })
  @IsOptional()
  @IsNumber()
  @Min(1)
  recurrenceCount?: number;

  @ApiPropertyOptional({ description: 'Data final da recorrência' })
  @IsOptional()
  @IsISO8601()
  recurrenceEndDate?: string;

  @ApiPropertyOptional({ description: 'Origem do agendamento' })
  @IsOptional()
  @IsString()
  source?: string = 'WEB';

  @ApiPropertyOptional({ description: 'Pular validação de conflitos (admin only)' })
  @IsOptional()
  @IsBoolean()
  skipConflictCheck?: boolean = false;
}
