import { IsArray, IsString, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { UpdateCustomerDto } from './update-customer.dto';

/**
 * DTO para atualização em lote
 */
export class BulkUpdateDto {
  @ApiProperty({ type: [String], description: 'IDs dos clientes' })
  @IsArray()
  @IsString({ each: true })
  customerIds: string[];

  @ApiProperty({ description: 'Dados a serem atualizados' })
  data: Partial<UpdateCustomerDto>;
}

/**
 * DTO para adicionar tags em lote
 */
export class BulkAddTagsDto {
  @ApiProperty({ type: [String], description: 'IDs dos clientes' })
  @IsArray()
  @IsString({ each: true })
  customerIds: string[];

  @ApiProperty({ type: [String], description: 'Tags a adicionar' })
  @IsArray()
  @IsString({ each: true })
  tags: string[];
}

/**
 * DTO para remover tags em lote
 */
export class BulkRemoveTagsDto {
  @ApiProperty({ type: [String], description: 'IDs dos clientes' })
  @IsArray()
  @IsString({ each: true })
  customerIds: string[];

  @ApiProperty({ type: [String], description: 'Tags a remover' })
  @IsArray()
  @IsString({ each: true })
  tags: string[];
}

/**
 * DTO para soft delete em lote
 */
export class BulkDeleteDto {
  @ApiProperty({ type: [String], description: 'IDs dos clientes' })
  @IsArray()
  @IsString({ each: true })
  customerIds: string[];

  @ApiPropertyOptional({ description: 'Motivo da exclusão' })
  @IsOptional()
  @IsString()
  reason?: string;
}

/**
 * Resultado de operação em lote
 */
export class BulkOperationResultDto {
  @ApiProperty({ description: 'Total de itens processados' })
  total: number;

  @ApiProperty({ description: 'Sucesso' })
  success: number;

  @ApiProperty({ description: 'Falhas' })
  failed: number;

  @ApiProperty({ description: 'Erros encontrados' })
  errors: Array<{
    customerId: string;
    error: string;
  }>;
}
