import { PartialType } from '@nestjs/swagger';
import { CreateProfessionalDto } from './create-professional.dto';
import {
  IsString,
  IsOptional,
  IsBoolean,
  IsNumber,
  IsUUID,
  IsEnum,
  IsDateString,
  IsArray,
  ValidateNested,
  Min,
  Max,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { WorkingHoursDto, ScheduleConfigDto, SpecialtyDto, CommissionRuleDto } from './create-professional.dto';

/**
 * DTO para atualizar profissional
 */
export class UpdateProfessionalDto extends PartialType(CreateProfessionalDto) {}

/**
 * DTO para bloqueio de agenda
 */
export class CreateScheduleBlockDto {
  @ApiProperty({
    description: 'Tipo de bloqueio',
    enum: ['VACATION', 'LEAVE', 'SICK', 'PERSONAL', 'TRAINING', 'OTHER'],
  })
  @IsString()
  type: 'VACATION' | 'LEAVE' | 'SICK' | 'PERSONAL' | 'TRAINING' | 'OTHER';

  @ApiProperty({ description: 'Título', example: 'Férias de janeiro' })
  @IsString()
  title: string;

  @ApiPropertyOptional({ description: 'Descrição' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ description: 'Data de início' })
  @IsDateString()
  startDate: string;

  @ApiProperty({ description: 'Data de fim' })
  @IsDateString()
  endDate: string;

  @ApiPropertyOptional({ description: 'É o dia todo', default: true })
  @IsOptional()
  @IsBoolean()
  isAllDay?: boolean;

  @ApiPropertyOptional({ description: 'Horário de início (se não for dia todo)' })
  @IsOptional()
  @IsString()
  startTime?: string;

  @ApiPropertyOptional({ description: 'Horário de fim (se não for dia todo)' })
  @IsOptional()
  @IsString()
  endTime?: string;

  @ApiPropertyOptional({ description: 'É recorrente', default: false })
  @IsOptional()
  @IsBoolean()
  isRecurring?: boolean;

  @ApiPropertyOptional({ description: 'Regra de recorrência (RRULE)' })
  @IsOptional()
  @IsString()
  recurrenceRule?: string;
}

/**
 * DTO para atualizar bloqueio
 */
export class UpdateScheduleBlockDto extends PartialType(CreateScheduleBlockDto) {
  @ApiPropertyOptional({
    description: 'Status de aprovação',
    enum: ['PENDING', 'APPROVED', 'REJECTED'],
  })
  @IsOptional()
  @IsString()
  status?: 'PENDING' | 'APPROVED' | 'REJECTED';
}

/**
 * DTO para adicionar especialidade
 */
export class AddSpecialtyDto extends SpecialtyDto {}

/**
 * DTO para atualizar comissão
 */
export class UpdateCommissionRulesDto {
  @ApiProperty({ description: 'Regras de comissão', type: [CommissionRuleDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CommissionRuleDto)
  rules: CommissionRuleDto[];
}

/**
 * DTO para atualizar horários
 */
export class UpdateWorkingHoursDto {
  @ApiProperty({ description: 'Horários de trabalho', type: [WorkingHoursDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => WorkingHoursDto)
  workingHours: WorkingHoursDto[];
}

/**
 * DTO para adicionar serviços
 */
export class AddServicesDto {
  @ApiProperty({ description: 'IDs dos serviços', type: [String] })
  @IsArray()
  @IsUUID('4', { each: true })
  serviceIds: string[];
}

/**
 * DTO para remover serviços
 */
export class RemoveServicesDto {
  @ApiProperty({ description: 'IDs dos serviços', type: [String] })
  @IsArray()
  @IsUUID('4', { each: true })
  serviceIds: string[];
}

/**
 * DTO para reordenar profissionais
 */
export class ReorderProfessionalsDto {
  @ApiProperty({ description: 'IDs na nova ordem', type: [String] })
  @IsArray()
  @IsUUID('4', { each: true })
  professionalIds: string[];
}
