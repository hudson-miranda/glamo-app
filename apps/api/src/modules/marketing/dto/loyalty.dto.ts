import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsNumber,
  IsOptional,
  IsBoolean,
  IsEnum,
  IsArray,
  IsUUID,
  ValidateNested,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';
import { LoyaltyTierType, LoyaltyTransactionType } from '../interfaces';

export class LoyaltyTierDto {
  @ApiProperty({ enum: LoyaltyTierType, description: 'Tipo do tier' })
  @IsEnum(LoyaltyTierType)
  type: LoyaltyTierType;

  @ApiProperty({ description: 'Nome do tier' })
  @IsString()
  name: string;

  @ApiProperty({ description: 'Pontos mínimos' })
  @IsNumber()
  @Min(0)
  minPoints: number;

  @ApiPropertyOptional({ description: 'Pontos máximos' })
  @IsNumber()
  @IsOptional()
  maxPoints?: number;

  @ApiPropertyOptional({ description: 'Benefícios' })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  benefits?: string[];

  @ApiProperty({ description: 'Multiplicador de pontos' })
  @IsNumber()
  @Min(1)
  pointsMultiplier: number;

  @ApiPropertyOptional({ description: 'Desconto percentual' })
  @IsNumber()
  @IsOptional()
  discountPercentage?: number;

  @ApiPropertyOptional({ description: 'Reserva prioritária?' })
  @IsBoolean()
  @IsOptional()
  priorityBooking?: boolean;
}

export class LoyaltyEarnRuleDto {
  @ApiProperty({ description: 'Nome da regra' })
  @IsString()
  name: string;

  @ApiProperty({
    enum: ['PURCHASE', 'SERVICE', 'PRODUCT', 'REFERRAL', 'REVIEW'],
    description: 'Gatilho',
  })
  @IsString()
  trigger: 'PURCHASE' | 'SERVICE' | 'PRODUCT' | 'REFERRAL' | 'REVIEW';

  @ApiPropertyOptional({ description: 'Pontos fixos' })
  @IsNumber()
  @IsOptional()
  @Min(0)
  pointsAmount?: number;

  @ApiPropertyOptional({ description: 'Percentual de pontos (sobre valor)' })
  @IsNumber()
  @IsOptional()
  @Min(0)
  pointsPercentage?: number;

  @ApiPropertyOptional({ description: 'IDs de serviços específicos' })
  @IsArray()
  @IsUUID('4', { each: true })
  @IsOptional()
  serviceIds?: string[];

  @ApiPropertyOptional({ description: 'IDs de produtos específicos' })
  @IsArray()
  @IsUUID('4', { each: true })
  @IsOptional()
  productIds?: string[];

  @ApiPropertyOptional({ description: 'Regra ativa?' })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}

export class LoyaltyBonusRuleDto {
  @ApiProperty({ description: 'Nome da regra' })
  @IsString()
  name: string;

  @ApiProperty({
    enum: ['BIRTHDAY', 'ANNIVERSARY', 'FIRST_PURCHASE', 'MILESTONE', 'PROMOTION'],
    description: 'Gatilho',
  })
  @IsString()
  trigger: 'BIRTHDAY' | 'ANNIVERSARY' | 'FIRST_PURCHASE' | 'MILESTONE' | 'PROMOTION';

  @ApiProperty({ description: 'Pontos de bônus' })
  @IsNumber()
  @Min(0)
  bonusPoints: number;

  @ApiPropertyOptional({ description: 'Valor do milestone (ex: 1000 pontos)' })
  @IsNumber()
  @IsOptional()
  milestoneValue?: number;

  @ApiPropertyOptional({ description: 'Regra ativa?' })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}

export class CreateLoyaltyProgramDto {
  @ApiProperty({ description: 'Nome do programa' })
  @IsString()
  name: string;

  @ApiPropertyOptional({ description: 'Descrição' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ description: 'Pontos por real gasto' })
  @IsNumber()
  @Min(0)
  pointsPerCurrency: number;

  @ApiProperty({ description: 'Valor em reais por ponto (ao resgatar)' })
  @IsNumber()
  @Min(0)
  currencyPerPoint: number;

  @ApiProperty({ description: 'Mínimo de pontos para resgate' })
  @IsNumber()
  @Min(0)
  minPointsRedemption: number;

  @ApiPropertyOptional({ description: 'Dias para expiração dos pontos' })
  @IsNumber()
  @IsOptional()
  @Min(1)
  pointsExpireDays?: number;

  @ApiPropertyOptional({ description: 'Tiers do programa', type: [LoyaltyTierDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => LoyaltyTierDto)
  @IsOptional()
  tiers?: LoyaltyTierDto[];

  @ApiPropertyOptional({ description: 'Regras de ganho', type: [LoyaltyEarnRuleDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => LoyaltyEarnRuleDto)
  @IsOptional()
  earnRules?: LoyaltyEarnRuleDto[];

  @ApiPropertyOptional({ description: 'Regras de bônus', type: [LoyaltyBonusRuleDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => LoyaltyBonusRuleDto)
  @IsOptional()
  bonusRules?: LoyaltyBonusRuleDto[];
}

export class UpdateLoyaltyProgramDto {
  @ApiPropertyOptional({ description: 'Nome do programa' })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiPropertyOptional({ description: 'Descrição' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({ description: 'Pontos por real' })
  @IsNumber()
  @IsOptional()
  @Min(0)
  pointsPerCurrency?: number;

  @ApiPropertyOptional({ description: 'Valor por ponto' })
  @IsNumber()
  @IsOptional()
  @Min(0)
  currencyPerPoint?: number;

  @ApiPropertyOptional({ description: 'Programa ativo?' })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @ApiPropertyOptional({ description: 'Tiers', type: [LoyaltyTierDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => LoyaltyTierDto)
  @IsOptional()
  tiers?: LoyaltyTierDto[];

  @ApiPropertyOptional({ description: 'Regras de ganho', type: [LoyaltyEarnRuleDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => LoyaltyEarnRuleDto)
  @IsOptional()
  earnRules?: LoyaltyEarnRuleDto[];
}

export class EarnPointsDto {
  @ApiProperty({ description: 'ID do cliente' })
  @IsUUID()
  customerId: string;

  @ApiProperty({ description: 'Pontos a adicionar' })
  @IsNumber()
  @Min(1)
  points: number;

  @ApiProperty({ description: 'Descrição' })
  @IsString()
  description: string;

  @ApiPropertyOptional({ description: 'Tipo de referência' })
  @IsString()
  @IsOptional()
  referenceType?: 'APPOINTMENT' | 'SALE' | 'REFERRAL' | 'BONUS';

  @ApiPropertyOptional({ description: 'ID de referência' })
  @IsUUID()
  @IsOptional()
  referenceId?: string;
}

export class RedeemPointsDto {
  @ApiProperty({ description: 'ID do cliente' })
  @IsUUID()
  customerId: string;

  @ApiProperty({ description: 'Pontos a resgatar' })
  @IsNumber()
  @Min(1)
  points: number;

  @ApiProperty({ description: 'Descrição' })
  @IsString()
  description: string;
}

export class AdjustPointsDto {
  @ApiProperty({ description: 'ID do cliente' })
  @IsUUID()
  customerId: string;

  @ApiProperty({ description: 'Pontos (positivo ou negativo)' })
  @IsNumber()
  points: number;

  @ApiProperty({ description: 'Motivo do ajuste' })
  @IsString()
  reason: string;
}
