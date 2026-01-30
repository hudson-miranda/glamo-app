import {
  IsString,
  IsOptional,
  IsArray,
  IsBoolean,
  ValidateNested,
  IsEnum,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { SegmentType, SegmentRuleGroup } from '../interfaces';

/**
 * DTO para criação de segmento
 */
export class CreateSegmentDto {
  @ApiProperty({ example: 'Clientes Premium', description: 'Nome do segmento' })
  @IsString()
  name: string;

  @ApiPropertyOptional({ description: 'Descrição do segmento' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ enum: SegmentType, default: SegmentType.SMART })
  @IsOptional()
  @IsEnum(SegmentType)
  type?: SegmentType = SegmentType.SMART;

  @ApiPropertyOptional({ example: '#FF5733', description: 'Cor do segmento' })
  @IsOptional()
  @IsString()
  color?: string;

  @ApiPropertyOptional({ example: 'star', description: 'Ícone do segmento' })
  @IsOptional()
  @IsString()
  icon?: string;

  @ApiPropertyOptional({ description: 'Regras de segmentação' })
  @IsOptional()
  rules?: SegmentRuleGroup;
}

/**
 * DTO para atualização de segmento
 */
export class UpdateSegmentDto {
  @ApiPropertyOptional({ description: 'Nome do segmento' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ description: 'Descrição do segmento' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ description: 'Cor do segmento' })
  @IsOptional()
  @IsString()
  color?: string;

  @ApiPropertyOptional({ description: 'Ícone do segmento' })
  @IsOptional()
  @IsString()
  icon?: string;

  @ApiPropertyOptional({ description: 'Regras de segmentação' })
  @IsOptional()
  rules?: SegmentRuleGroup;
}

/**
 * DTO para adicionar clientes manualmente a um segmento
 */
export class AddToSegmentDto {
  @ApiProperty({ type: [String], description: 'IDs dos clientes' })
  @IsArray()
  @IsString({ each: true })
  customerIds: string[];
}

/**
 * DTO para remover clientes de um segmento
 */
export class RemoveFromSegmentDto {
  @ApiProperty({ type: [String], description: 'IDs dos clientes' })
  @IsArray()
  @IsString({ each: true })
  customerIds: string[];
}
