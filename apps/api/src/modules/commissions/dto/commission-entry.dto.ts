import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsNumber,
  IsOptional,
  IsEnum,
  IsArray,
  IsUUID,
  IsDateString,
  ValidateNested,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';
import { CommissionStatus, CommissionType, BonusType, PaymentStatus } from '../interfaces';

export class CommissionAdjustmentDto {
  @ApiProperty({ enum: ['BONUS', 'DEDUCTION', 'CORRECTION'], description: 'Tipo de ajuste' })
  @IsEnum(['BONUS', 'DEDUCTION', 'CORRECTION'])
  type: 'BONUS' | 'DEDUCTION' | 'CORRECTION';

  @ApiProperty({ description: 'Valor do ajuste (positivo ou negativo)' })
  @IsNumber()
  amount: number;

  @ApiProperty({ description: 'Motivo do ajuste' })
  @IsString()
  reason: string;
}

export class CreateCommissionEntryDto {
  @ApiProperty({ description: 'ID do profissional' })
  @IsUUID()
  professionalId: string;

  @ApiProperty({
    enum: ['APPOINTMENT', 'SALE', 'REFERRAL', 'BONUS'],
    description: 'Tipo de referência',
  })
  @IsEnum(['APPOINTMENT', 'SALE', 'REFERRAL', 'BONUS'])
  referenceType: 'APPOINTMENT' | 'SALE' | 'REFERRAL' | 'BONUS';

  @ApiProperty({ description: 'ID da referência' })
  @IsUUID()
  referenceId: string;

  @ApiProperty({ description: 'Valor base para cálculo' })
  @IsNumber()
  @Min(0)
  baseValue: number;

  @ApiPropertyOptional({ description: 'ID da regra aplicada' })
  @IsUUID()
  @IsOptional()
  ruleId?: string;

  @ApiPropertyOptional({ description: 'ID do serviço' })
  @IsUUID()
  @IsOptional()
  serviceId?: string;

  @ApiPropertyOptional({ description: 'ID do produto' })
  @IsUUID()
  @IsOptional()
  productId?: string;

  @ApiPropertyOptional({ description: 'ID do cliente' })
  @IsUUID()
  @IsOptional()
  customerId?: string;

  @ApiPropertyOptional({ description: 'Data de referência' })
  @IsDateString()
  @IsOptional()
  referenceDate?: string;

  @ApiPropertyOptional({ description: 'Observações' })
  @IsString()
  @IsOptional()
  notes?: string;
}

export class ApproveCommissionsDto {
  @ApiProperty({ description: 'IDs das comissões a aprovar' })
  @IsArray()
  @IsUUID('4', { each: true })
  entryIds: string[];

  @ApiPropertyOptional({ description: 'Observações' })
  @IsString()
  @IsOptional()
  notes?: string;
}

export class AdjustCommissionDto {
  @ApiProperty({ description: 'Ajuste', type: CommissionAdjustmentDto })
  @ValidateNested()
  @Type(() => CommissionAdjustmentDto)
  adjustment: CommissionAdjustmentDto;
}

export class PaymentDeductionDto {
  @ApiProperty({ description: 'Tipo de desconto' })
  @IsString()
  type: string;

  @ApiProperty({ description: 'Descrição' })
  @IsString()
  description: string;

  @ApiProperty({ description: 'Valor' })
  @IsNumber()
  @Min(0)
  amount: number;
}

export class PaymentBonusDto {
  @ApiProperty({ enum: BonusType, description: 'Tipo de bônus' })
  @IsEnum(BonusType)
  type: BonusType;

  @ApiProperty({ description: 'Descrição' })
  @IsString()
  description: string;

  @ApiProperty({ description: 'Valor' })
  @IsNumber()
  @Min(0)
  amount: number;

  @ApiPropertyOptional({ description: 'ID da meta relacionada' })
  @IsUUID()
  @IsOptional()
  goalId?: string;
}

export class CreatePaymentDto {
  @ApiProperty({ description: 'ID do profissional' })
  @IsUUID()
  professionalId: string;

  @ApiProperty({ description: 'Início do período' })
  @IsDateString()
  periodStart: string;

  @ApiProperty({ description: 'Fim do período' })
  @IsDateString()
  periodEnd: string;

  @ApiPropertyOptional({ description: 'IDs das comissões (se vazio, pega todas aprovadas)' })
  @IsArray()
  @IsUUID('4', { each: true })
  @IsOptional()
  entryIds?: string[];

  @ApiPropertyOptional({ description: 'Descontos', type: [PaymentDeductionDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PaymentDeductionDto)
  @IsOptional()
  deductions?: PaymentDeductionDto[];

  @ApiPropertyOptional({ description: 'Bônus', type: [PaymentBonusDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PaymentBonusDto)
  @IsOptional()
  bonuses?: PaymentBonusDto[];

  @ApiPropertyOptional({ description: 'Observações' })
  @IsString()
  @IsOptional()
  notes?: string;
}

export class ProcessPaymentDto {
  @ApiProperty({ description: 'Método de pagamento' })
  @IsString()
  paymentMethod: string;

  @ApiPropertyOptional({ description: 'Referência do pagamento' })
  @IsString()
  @IsOptional()
  paymentReference?: string;

  @ApiPropertyOptional({ description: 'Observações' })
  @IsString()
  @IsOptional()
  notes?: string;
}
