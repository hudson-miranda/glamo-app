import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsNumber,
  IsOptional,
  IsBoolean,
  IsEnum,
  IsArray,
  IsUUID,
  IsDateString,
  ValidateNested,
  Min,
  Max,
  Matches,
} from 'class-validator';
import { Type } from 'class-transformer';
import { CouponType } from '../interfaces';

export class CouponUsageLimitsDto {
  @ApiPropertyOptional({ description: 'Usos totais permitidos' })
  @IsNumber()
  @IsOptional()
  @Min(1)
  totalUses?: number;

  @ApiPropertyOptional({ description: 'Usos por cliente' })
  @IsNumber()
  @IsOptional()
  @Min(1)
  usesPerCustomer?: number;

  @ApiPropertyOptional({ description: 'Valor mínimo de compra' })
  @IsNumber()
  @IsOptional()
  @Min(0)
  minPurchaseAmount?: number;

  @ApiPropertyOptional({ description: 'Desconto máximo' })
  @IsNumber()
  @IsOptional()
  @Min(0)
  maxDiscountAmount?: number;
}

export class CouponApplicabilityDto {
  @ApiPropertyOptional({ description: 'IDs de serviços aplicáveis' })
  @IsArray()
  @IsUUID('4', { each: true })
  @IsOptional()
  serviceIds?: string[];

  @ApiPropertyOptional({ description: 'IDs de categorias de serviço' })
  @IsArray()
  @IsUUID('4', { each: true })
  @IsOptional()
  serviceCategoryIds?: string[];

  @ApiPropertyOptional({ description: 'IDs de produtos aplicáveis' })
  @IsArray()
  @IsUUID('4', { each: true })
  @IsOptional()
  productIds?: string[];

  @ApiPropertyOptional({ description: 'IDs de categorias de produto' })
  @IsArray()
  @IsUUID('4', { each: true })
  @IsOptional()
  productCategoryIds?: string[];

  @ApiPropertyOptional({ description: 'IDs de profissionais' })
  @IsArray()
  @IsUUID('4', { each: true })
  @IsOptional()
  professionalIds?: string[];

  @ApiPropertyOptional({ description: 'Serviços a excluir' })
  @IsArray()
  @IsUUID('4', { each: true })
  @IsOptional()
  excludeServiceIds?: string[];

  @ApiPropertyOptional({ description: 'Produtos a excluir' })
  @IsArray()
  @IsUUID('4', { each: true })
  @IsOptional()
  excludeProductIds?: string[];

  @ApiPropertyOptional({ description: 'Apenas novos clientes?' })
  @IsBoolean()
  @IsOptional()
  newCustomersOnly?: boolean;

  @ApiPropertyOptional({ description: 'Apenas primeira compra?' })
  @IsBoolean()
  @IsOptional()
  firstPurchaseOnly?: boolean;
}

export class CreateCouponDto {
  @ApiProperty({ description: 'Código do cupom (alfanumérico)' })
  @IsString()
  @Matches(/^[A-Za-z0-9_-]+$/, { message: 'Código deve ser alfanumérico' })
  code: string;

  @ApiProperty({ description: 'Nome' })
  @IsString()
  name: string;

  @ApiPropertyOptional({ description: 'Descrição' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ enum: CouponType, description: 'Tipo de cupom' })
  @IsEnum(CouponType)
  type: CouponType;

  @ApiProperty({ description: 'Valor (% ou fixo)' })
  @IsNumber()
  @Min(0)
  value: number;

  @ApiPropertyOptional({ description: 'Quantidade a comprar (BUY_X_GET_Y)' })
  @IsNumber()
  @IsOptional()
  @Min(1)
  buyQuantity?: number;

  @ApiPropertyOptional({ description: 'Quantidade grátis (BUY_X_GET_Y)' })
  @IsNumber()
  @IsOptional()
  @Min(1)
  getQuantity?: number;

  @ApiPropertyOptional({ description: 'ID do serviço grátis' })
  @IsUUID()
  @IsOptional()
  freeServiceId?: string;

  @ApiPropertyOptional({ description: 'ID do produto grátis' })
  @IsUUID()
  @IsOptional()
  freeProductId?: string;

  @ApiPropertyOptional({ description: 'Limites de uso', type: CouponUsageLimitsDto })
  @ValidateNested()
  @Type(() => CouponUsageLimitsDto)
  @IsOptional()
  usageLimits?: CouponUsageLimitsDto;

  @ApiPropertyOptional({ description: 'Aplicabilidade', type: CouponApplicabilityDto })
  @ValidateNested()
  @Type(() => CouponApplicabilityDto)
  @IsOptional()
  applicability?: CouponApplicabilityDto;

  @ApiProperty({ description: 'Válido a partir de' })
  @IsDateString()
  validFrom: string;

  @ApiProperty({ description: 'Válido até' })
  @IsDateString()
  validTo: string;

  @ApiPropertyOptional({ description: 'ID da campanha' })
  @IsUUID()
  @IsOptional()
  campaignId?: string;
}

export class UpdateCouponDto {
  @ApiPropertyOptional({ description: 'Nome' })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiPropertyOptional({ description: 'Descrição' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({ description: 'Valor' })
  @IsNumber()
  @IsOptional()
  @Min(0)
  value?: number;

  @ApiPropertyOptional({ description: 'Limites de uso', type: CouponUsageLimitsDto })
  @ValidateNested()
  @Type(() => CouponUsageLimitsDto)
  @IsOptional()
  usageLimits?: CouponUsageLimitsDto;

  @ApiPropertyOptional({ description: 'Aplicabilidade', type: CouponApplicabilityDto })
  @ValidateNested()
  @Type(() => CouponApplicabilityDto)
  @IsOptional()
  applicability?: CouponApplicabilityDto;

  @ApiPropertyOptional({ description: 'Válido até' })
  @IsDateString()
  @IsOptional()
  validTo?: string;

  @ApiPropertyOptional({ description: 'Ativo?' })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}

export class ValidateCouponDto {
  @ApiProperty({ description: 'Código do cupom' })
  @IsString()
  code: string;

  @ApiPropertyOptional({ description: 'ID do cliente' })
  @IsUUID()
  @IsOptional()
  customerId?: string;

  @ApiPropertyOptional({ description: 'IDs dos serviços' })
  @IsArray()
  @IsUUID('4', { each: true })
  @IsOptional()
  serviceIds?: string[];

  @ApiPropertyOptional({ description: 'IDs dos produtos' })
  @IsArray()
  @IsUUID('4', { each: true })
  @IsOptional()
  productIds?: string[];

  @ApiProperty({ description: 'Valor total' })
  @IsNumber()
  @Min(0)
  totalAmount: number;
}

export class RedeemCouponDto {
  @ApiProperty({ description: 'Código do cupom' })
  @IsString()
  code: string;

  @ApiProperty({ description: 'ID do cliente' })
  @IsUUID()
  customerId: string;

  @ApiPropertyOptional({ description: 'ID do agendamento' })
  @IsUUID()
  @IsOptional()
  appointmentId?: string;

  @ApiPropertyOptional({ description: 'ID da venda' })
  @IsUUID()
  @IsOptional()
  saleId?: string;

  @ApiProperty({ description: 'Valor original' })
  @IsNumber()
  @Min(0)
  originalAmount: number;

  @ApiProperty({ description: 'Valor do desconto' })
  @IsNumber()
  @Min(0)
  discountAmount: number;
}
