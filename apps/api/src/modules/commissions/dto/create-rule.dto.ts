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
} from 'class-validator';
import { Type } from 'class-transformer';
import { CommissionType, CommissionTrigger } from '../interfaces';

export class TierConfigDto {
  @ApiProperty({ description: 'Valor mínimo para aplicar o tier' })
  @IsNumber()
  @Min(0)
  minValue: number;

  @ApiPropertyOptional({ description: 'Valor máximo do tier' })
  @IsNumber()
  @IsOptional()
  maxValue?: number;

  @ApiPropertyOptional({ description: 'Percentual de comissão' })
  @IsNumber()
  @IsOptional()
  @Min(0)
  @Max(100)
  percentage?: number;

  @ApiPropertyOptional({ description: 'Valor fixo de comissão' })
  @IsNumber()
  @IsOptional()
  @Min(0)
  fixedAmount?: number;
}

export class CommissionConditionDto {
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

  @ApiPropertyOptional({ description: 'Valor mínimo da transação' })
  @IsNumber()
  @IsOptional()
  @Min(0)
  minTransactionValue?: number;

  @ApiPropertyOptional({ description: 'Valor máximo da transação' })
  @IsNumber()
  @IsOptional()
  maxTransactionValue?: number;

  @ApiPropertyOptional({ description: 'Dias da semana (0=Dom, 6=Sab)' })
  @IsArray()
  @IsNumber({}, { each: true })
  @IsOptional()
  dayOfWeek?: number[];
}

export class CreateCommissionRuleDto {
  @ApiProperty({ description: 'Nome da regra' })
  @IsString()
  name: string;

  @ApiPropertyOptional({ description: 'Descrição' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ enum: CommissionType, description: 'Tipo de comissão' })
  @IsEnum(CommissionType)
  type: CommissionType;

  @ApiProperty({ enum: CommissionTrigger, description: 'Gatilho da comissão' })
  @IsEnum(CommissionTrigger)
  trigger: CommissionTrigger;

  @ApiPropertyOptional({ description: 'Percentual (para tipo PERCENTAGE)' })
  @IsNumber()
  @IsOptional()
  @Min(0)
  @Max(100)
  percentage?: number;

  @ApiPropertyOptional({ description: 'Valor fixo (para tipo FIXED)' })
  @IsNumber()
  @IsOptional()
  @Min(0)
  fixedAmount?: number;

  @ApiPropertyOptional({ description: 'Tiers para comissão escalonada', type: [TierConfigDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => TierConfigDto)
  @IsOptional()
  tiers?: TierConfigDto[];

  @ApiPropertyOptional({ description: 'Condições de aplicação', type: CommissionConditionDto })
  @ValidateNested()
  @Type(() => CommissionConditionDto)
  @IsOptional()
  conditions?: CommissionConditionDto;

  @ApiPropertyOptional({ description: 'É regra padrão?' })
  @IsBoolean()
  @IsOptional()
  isDefault?: boolean;

  @ApiPropertyOptional({ description: 'Prioridade (maior = mais importante)' })
  @IsNumber()
  @IsOptional()
  priority?: number;

  @ApiPropertyOptional({ description: 'Válido a partir de' })
  @IsDateString()
  @IsOptional()
  validFrom?: string;

  @ApiPropertyOptional({ description: 'Válido até' })
  @IsDateString()
  @IsOptional()
  validTo?: string;
}

export class UpdateCommissionRuleDto {
  @ApiPropertyOptional({ description: 'Nome da regra' })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiPropertyOptional({ description: 'Descrição' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({ enum: CommissionType, description: 'Tipo de comissão' })
  @IsEnum(CommissionType)
  @IsOptional()
  type?: CommissionType;

  @ApiPropertyOptional({ description: 'Percentual' })
  @IsNumber()
  @IsOptional()
  @Min(0)
  @Max(100)
  percentage?: number;

  @ApiPropertyOptional({ description: 'Valor fixo' })
  @IsNumber()
  @IsOptional()
  @Min(0)
  fixedAmount?: number;

  @ApiPropertyOptional({ description: 'Tiers', type: [TierConfigDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => TierConfigDto)
  @IsOptional()
  tiers?: TierConfigDto[];

  @ApiPropertyOptional({ description: 'Condições', type: CommissionConditionDto })
  @ValidateNested()
  @Type(() => CommissionConditionDto)
  @IsOptional()
  conditions?: CommissionConditionDto;

  @ApiPropertyOptional({ description: 'Regra ativa?' })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @ApiPropertyOptional({ description: 'Prioridade' })
  @IsNumber()
  @IsOptional()
  priority?: number;
}
