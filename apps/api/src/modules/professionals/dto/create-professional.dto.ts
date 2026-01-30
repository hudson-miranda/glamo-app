import {
  IsString,
  IsOptional,
  IsBoolean,
  IsNumber,
  IsUUID,
  IsEnum,
  IsArray,
  IsEmail,
  IsDateString,
  ValidateNested,
  Min,
  Max,
  MinLength,
  MaxLength,
  Matches,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ProfessionalStatus, ContractType, CommissionType } from '../interfaces';

/**
 * DTO para horário de trabalho
 */
export class WorkingHoursDto {
  @ApiProperty({ description: 'Dia da semana (0=Dom, 6=Sab)', example: 1 })
  @IsNumber()
  @Min(0)
  @Max(6)
  dayOfWeek: number;

  @ApiProperty({ description: 'É dia de trabalho', default: true })
  @IsBoolean()
  isWorkingDay: boolean;

  @ApiProperty({ description: 'Horário de início', example: '09:00' })
  @IsString()
  @Matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
  startTime: string;

  @ApiProperty({ description: 'Horário de fim', example: '18:00' })
  @IsString()
  @Matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
  endTime: string;

  @ApiPropertyOptional({ description: 'Início do intervalo', example: '12:00' })
  @IsOptional()
  @IsString()
  @Matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
  breakStart?: string;

  @ApiPropertyOptional({ description: 'Fim do intervalo', example: '13:00' })
  @IsOptional()
  @IsString()
  @Matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
  breakEnd?: string;
}

/**
 * DTO para configuração de agenda
 */
export class ScheduleConfigDto {
  @ApiPropertyOptional({ description: 'Duração padrão do slot em minutos', default: 30 })
  @IsOptional()
  @IsNumber()
  @Min(5)
  @Max(240)
  defaultSlotDuration?: number;

  @ApiPropertyOptional({ description: 'Mínimo de horas de antecedência', default: 2 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  minAdvanceBooking?: number;

  @ApiPropertyOptional({ description: 'Máximo de dias de antecedência', default: 60 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  maxAdvanceBooking?: number;

  @ApiPropertyOptional({ description: 'Permite agendamento online', default: true })
  @IsOptional()
  @IsBoolean()
  allowOnlineBooking?: boolean;

  @ApiPropertyOptional({ description: 'Permite walk-ins', default: true })
  @IsOptional()
  @IsBoolean()
  allowWalkIns?: boolean;

  @ApiPropertyOptional({ description: 'Limite de overbooking', default: 0 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  overbookingLimit?: number;

  @ApiPropertyOptional({ description: 'Buffer entre agendamentos em minutos', default: 0 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  bufferBetweenAppointments?: number;
}

/**
 * DTO para especialidade
 */
export class SpecialtyDto {
  @ApiProperty({ description: 'Nome da especialidade', example: 'Coloração' })
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  name: string;

  @ApiPropertyOptional({ description: 'Descrição' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({
    description: 'Nível',
    enum: ['BEGINNER', 'INTERMEDIATE', 'ADVANCED', 'EXPERT'],
    default: 'INTERMEDIATE',
  })
  @IsString()
  level: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED' | 'EXPERT';

  @ApiPropertyOptional({ description: 'Data da certificação' })
  @IsOptional()
  @IsDateString()
  certificationDate?: string;

  @ApiPropertyOptional({ description: 'Data de expiração da certificação' })
  @IsOptional()
  @IsDateString()
  certificationExpiry?: string;

  @ApiPropertyOptional({ description: 'URL do certificado' })
  @IsOptional()
  @IsString()
  certificateUrl?: string;
}

/**
 * DTO para regra de comissão
 */
export class CommissionRuleDto {
  @ApiPropertyOptional({ description: 'ID do serviço (null = todos)' })
  @IsOptional()
  @IsUUID()
  serviceId?: string;

  @ApiPropertyOptional({ description: 'ID da categoria (null = todas)' })
  @IsOptional()
  @IsUUID()
  categoryId?: string;

  @ApiProperty({ description: 'Tipo de comissão', enum: CommissionType })
  @IsEnum(CommissionType)
  type: CommissionType;

  @ApiProperty({ description: 'Valor (% ou fixo)', example: 30 })
  @IsNumber()
  @Min(0)
  value: number;

  @ApiPropertyOptional({ description: 'Comissão mínima' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  minValue?: number;

  @ApiPropertyOptional({ description: 'Comissão máxima' })
  @IsOptional()
  @IsNumber()
  maxValue?: number;

  @ApiPropertyOptional({ description: 'Data de início' })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional({ description: 'Data de fim' })
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiPropertyOptional({ description: 'Se está ativa', default: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

/**
 * DTO para criar profissional
 */
export class CreateProfessionalDto {
  @ApiProperty({ description: 'Nome completo', example: 'Ana Costa' })
  @IsString()
  @MinLength(2)
  @MaxLength(150)
  name: string;

  @ApiProperty({ description: 'Email', example: 'ana@salon.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ description: 'Telefone', example: '+5511999999999' })
  @IsString()
  @MinLength(10)
  phone: string;

  @ApiPropertyOptional({ description: 'CPF' })
  @IsOptional()
  @IsString()
  cpf?: string;

  @ApiPropertyOptional({ description: 'Data de nascimento' })
  @IsOptional()
  @IsDateString()
  birthDate?: string;

  @ApiPropertyOptional({ description: 'Gênero', enum: ['M', 'F', 'O'] })
  @IsOptional()
  @IsString()
  gender?: 'M' | 'F' | 'O';

  @ApiPropertyOptional({ description: 'URL do avatar' })
  @IsOptional()
  @IsString()
  avatar?: string;

  @ApiPropertyOptional({ description: 'Biografia/Descrição' })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  bio?: string;

  @ApiPropertyOptional({ description: 'Status', enum: ProfessionalStatus, default: 'ACTIVE' })
  @IsOptional()
  @IsEnum(ProfessionalStatus)
  status?: ProfessionalStatus;

  @ApiPropertyOptional({ description: 'Tipo de contrato', enum: ContractType, default: 'EMPLOYEE' })
  @IsOptional()
  @IsEnum(ContractType)
  contractType?: ContractType;

  @ApiPropertyOptional({ description: 'Data de contratação' })
  @IsOptional()
  @IsDateString()
  hireDate?: string;

  @ApiPropertyOptional({ description: 'Número de registro (CRO, CRM, etc.)' })
  @IsOptional()
  @IsString()
  registrationNumber?: string;

  @ApiPropertyOptional({ description: 'Especialidades', type: [SpecialtyDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SpecialtyDto)
  specialties?: SpecialtyDto[];

  @ApiPropertyOptional({ description: 'IDs dos serviços que realiza', type: [String] })
  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  serviceIds?: string[];

  @ApiPropertyOptional({ description: 'Horários de trabalho', type: [WorkingHoursDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => WorkingHoursDto)
  workingHours?: WorkingHoursDto[];

  @ApiPropertyOptional({ description: 'Configuração da agenda', type: ScheduleConfigDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => ScheduleConfigDto)
  scheduleConfig?: ScheduleConfigDto;

  @ApiPropertyOptional({ description: 'Regras de comissão', type: [CommissionRuleDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CommissionRuleDto)
  commissionRules?: CommissionRuleDto[];

  @ApiPropertyOptional({ description: 'Percentual de comissão padrão', default: 30 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  defaultCommissionPercentage?: number;

  @ApiPropertyOptional({ description: 'Cor na agenda', example: '#3B82F6' })
  @IsOptional()
  @IsString()
  color?: string;

  @ApiPropertyOptional({ description: 'Ordem de exibição', default: 0 })
  @IsOptional()
  @IsNumber()
  displayOrder?: number;

  @ApiPropertyOptional({ description: 'Aceita agendamento online', default: true })
  @IsOptional()
  @IsBoolean()
  isOnlineBookingEnabled?: boolean;

  @ApiPropertyOptional({ description: 'Aceita novos clientes', default: true })
  @IsOptional()
  @IsBoolean()
  acceptsNewCustomers?: boolean;

  @ApiPropertyOptional({ description: 'Instagram' })
  @IsOptional()
  @IsString()
  instagram?: string;

  @ApiPropertyOptional({ description: 'Facebook' })
  @IsOptional()
  @IsString()
  facebook?: string;

  @ApiPropertyOptional({ description: 'WhatsApp' })
  @IsOptional()
  @IsString()
  whatsapp?: string;

  @ApiPropertyOptional({ description: 'ID do usuário vinculado' })
  @IsOptional()
  @IsUUID()
  userId?: string;
}
