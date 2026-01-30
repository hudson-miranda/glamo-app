import {
  IsString,
  IsNumber,
  IsOptional,
  IsEnum,
  IsArray,
  IsUUID,
  IsDateString,
  IsBoolean,
  ValidateNested,
  Min,
  IsObject,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PaymentMethod, PaymentStatus, CardBrand } from '../interfaces';

// ========================
// CARD DETAILS
// ========================

export class CardDetailsDto {
  @ApiProperty({ enum: CardBrand })
  @IsEnum(CardBrand)
  brand: CardBrand;

  @ApiProperty({ description: 'Últimos 4 dígitos' })
  @IsString()
  lastFour: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  holderName?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  expiryMonth?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  expiryYear?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isDebit?: boolean;
}

// ========================
// INSTALLMENT DETAILS
// ========================

export class InstallmentDetailsDto {
  @ApiProperty({ description: 'Número de parcelas' })
  @IsNumber()
  @Min(1)
  numberOfInstallments: number;

  @ApiProperty()
  @IsNumber()
  @Min(0)
  installmentAmount: number;

  @ApiProperty()
  @IsNumber()
  @Min(0)
  totalAmount: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(0)
  interestRate?: number;

  @ApiProperty()
  @IsBoolean()
  hasInterest: boolean;
}

// ========================
// CREATE PAYMENT
// ========================

export class CreatePaymentDto {
  @ApiProperty({ description: 'Valor do pagamento' })
  @IsNumber()
  @Min(0.01)
  amount: number;

  @ApiPropertyOptional({ description: 'Gorjeta' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  tip?: number;

  @ApiPropertyOptional({ description: 'Desconto' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  discount?: number;

  @ApiProperty({ enum: PaymentMethod })
  @IsEnum(PaymentMethod)
  method: PaymentMethod;

  @ApiPropertyOptional({ type: CardDetailsDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => CardDetailsDto)
  cardDetails?: CardDetailsDto;

  @ApiPropertyOptional({ type: InstallmentDetailsDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => InstallmentDetailsDto)
  installmentDetails?: InstallmentDetailsDto;

  @ApiPropertyOptional({ description: 'ID do agendamento' })
  @IsOptional()
  @IsUUID()
  appointmentId?: string;

  @ApiPropertyOptional({ description: 'ID da fatura' })
  @IsOptional()
  @IsUUID()
  invoiceId?: string;

  @ApiPropertyOptional({ description: 'ID do cliente' })
  @IsOptional()
  @IsUUID()
  customerId?: string;

  @ApiPropertyOptional({ description: 'ID do pedido' })
  @IsOptional()
  @IsUUID()
  orderId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  reference?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;
}

// ========================
// PROCESS CARD PAYMENT
// ========================

export class ProcessCardPaymentDto extends CreatePaymentDto {
  @ApiProperty({ description: 'Token do cartão (criptografado)' })
  @IsString()
  cardToken: string;

  @ApiPropertyOptional({ description: 'Salvar cartão para uso futuro' })
  @IsOptional()
  @IsBoolean()
  saveCard?: boolean;

  @ApiPropertyOptional({ description: 'ID do cartão salvo' })
  @IsOptional()
  @IsUUID()
  savedCardId?: string;
}

// ========================
// PROCESS PIX PAYMENT
// ========================

export class ProcessPixPaymentDto extends CreatePaymentDto {
  @ApiPropertyOptional({ description: 'Tempo de expiração em minutos (default: 30)' })
  @IsOptional()
  @IsNumber()
  @Min(5)
  expirationMinutes?: number;
}

// ========================
// REFUND
// ========================

export class RefundPaymentDto {
  @ApiProperty({ description: 'Valor do reembolso' })
  @IsNumber()
  @Min(0.01)
  amount: number;

  @ApiProperty({ description: 'Motivo do reembolso' })
  @IsString()
  reason: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;
}

// ========================
// UPDATE PAYMENT
// ========================

export class UpdatePaymentDto {
  @ApiPropertyOptional({ enum: PaymentStatus })
  @IsOptional()
  @IsEnum(PaymentStatus)
  status?: PaymentStatus;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  reference?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;
}
