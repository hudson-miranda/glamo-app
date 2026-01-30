import { PartialType, OmitType } from '@nestjs/swagger';
import { CreateServiceDto } from './create-service.dto';
import { IsArray, IsNumber, IsOptional, IsUUID, Min } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

/**
 * DTO para atualizar serviço
 */
export class UpdateServiceDto extends PartialType(
  OmitType(CreateServiceDto, ['categoryId'] as const),
) {
  @ApiPropertyOptional({ description: 'ID da categoria' })
  @IsOptional()
  @IsUUID()
  categoryId?: string;
}

/**
 * DTO para reordenar serviços
 */
export class ReorderServicesDto {
  @ApiPropertyOptional({ description: 'ID da categoria para filtrar' })
  @IsOptional()
  @IsUUID()
  categoryId?: string;

  @ApiPropertyOptional({
    description: 'Lista de IDs na nova ordem',
    type: [String],
  })
  @IsArray()
  @IsUUID('4', { each: true })
  serviceIds: string[];
}

/**
 * DTO para duplicar serviço
 */
export class DuplicateServiceDto {
  @ApiPropertyOptional({ description: 'Novo nome', example: 'Corte Feminino (Cópia)' })
  @IsOptional()
  name?: string;

  @ApiPropertyOptional({ description: 'Nova categoria' })
  @IsOptional()
  @IsUUID()
  categoryId?: string;
}

/**
 * DTO para atualização em lote
 */
export class BulkUpdateServicesDto {
  @ApiPropertyOptional({ description: 'IDs dos serviços', type: [String] })
  @IsArray()
  @IsUUID('4', { each: true })
  serviceIds: string[];

  @ApiPropertyOptional({ description: 'Nova categoria' })
  @IsOptional()
  @IsUUID()
  categoryId?: string;

  @ApiPropertyOptional({ description: 'Ajuste percentual de preço' })
  @IsOptional()
  @IsNumber()
  priceAdjustmentPercentage?: number;

  @ApiPropertyOptional({ description: 'Ajuste fixo de preço' })
  @IsOptional()
  @IsNumber()
  priceAdjustmentFixed?: number;

  @ApiPropertyOptional({ description: 'Ajuste de duração em minutos' })
  @IsOptional()
  @IsNumber()
  durationAdjustment?: number;
}

/**
 * DTO para adicionar profissional ao serviço
 */
export class AddProfessionalToServiceDto {
  @ApiPropertyOptional({ description: 'ID do profissional' })
  @IsUUID()
  professionalId: string;

  @ApiPropertyOptional({ description: 'Preço específico para este profissional' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  price?: number;

  @ApiPropertyOptional({ description: 'Duração específica em minutos' })
  @IsOptional()
  @IsNumber()
  @Min(5)
  duration?: number;
}
