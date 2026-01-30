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
import { CommissionType } from '../interfaces';

export class ServiceCommissionOverrideDto {
  @ApiProperty({ description: 'ID do serviço' })
  @IsUUID()
  serviceId: string;

  @ApiProperty({ enum: CommissionType, description: 'Tipo de comissão' })
  @IsEnum(CommissionType)
  type: CommissionType;

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
}

export class ProductCommissionOverrideDto {
  @ApiProperty({ description: 'ID do produto' })
  @IsUUID()
  productId: string;

  @ApiProperty({ enum: CommissionType, description: 'Tipo de comissão' })
  @IsEnum(CommissionType)
  type: CommissionType;

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
}

export class CreateProfessionalConfigDto {
  @ApiProperty({ description: 'ID do profissional' })
  @IsUUID()
  professionalId: string;

  @ApiPropertyOptional({ description: 'ID da regra padrão' })
  @IsUUID()
  @IsOptional()
  ruleId?: string;

  @ApiProperty({ description: 'Percentual padrão de comissão' })
  @IsNumber()
  @Min(0)
  @Max(100)
  defaultPercentage: number;

  @ApiPropertyOptional({
    description: 'Overrides por serviço',
    type: [ServiceCommissionOverrideDto],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ServiceCommissionOverrideDto)
  @IsOptional()
  serviceOverrides?: ServiceCommissionOverrideDto[];

  @ApiPropertyOptional({
    description: 'Overrides por produto',
    type: [ProductCommissionOverrideDto],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ProductCommissionOverrideDto)
  @IsOptional()
  productOverrides?: ProductCommissionOverrideDto[];

  @ApiPropertyOptional({ description: 'Início da vigência' })
  @IsDateString()
  @IsOptional()
  effectiveFrom?: string;

  @ApiPropertyOptional({ description: 'Fim da vigência' })
  @IsDateString()
  @IsOptional()
  effectiveTo?: string;
}

export class UpdateProfessionalConfigDto {
  @ApiPropertyOptional({ description: 'ID da regra padrão' })
  @IsUUID()
  @IsOptional()
  ruleId?: string;

  @ApiPropertyOptional({ description: 'Percentual padrão' })
  @IsNumber()
  @IsOptional()
  @Min(0)
  @Max(100)
  defaultPercentage?: number;

  @ApiPropertyOptional({
    description: 'Overrides por serviço',
    type: [ServiceCommissionOverrideDto],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ServiceCommissionOverrideDto)
  @IsOptional()
  serviceOverrides?: ServiceCommissionOverrideDto[];

  @ApiPropertyOptional({
    description: 'Overrides por produto',
    type: [ProductCommissionOverrideDto],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ProductCommissionOverrideDto)
  @IsOptional()
  productOverrides?: ProductCommissionOverrideDto[];

  @ApiPropertyOptional({ description: 'Config ativa?' })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
