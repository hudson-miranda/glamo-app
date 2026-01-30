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
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { MovementType, MovementReason } from '../interfaces';

// ========================
// STOCK ADJUSTMENT
// ========================

export class StockAdjustmentDto {
  @ApiProperty({ description: 'ID do produto' })
  @IsUUID()
  productId: string;

  @ApiProperty({ enum: MovementType })
  @IsEnum(MovementType)
  type: MovementType;

  @ApiProperty({ enum: MovementReason })
  @IsEnum(MovementReason)
  reason: MovementReason;

  @ApiProperty({ description: 'Quantidade' })
  @IsNumber()
  @Min(1)
  quantity: number;

  @ApiPropertyOptional({ description: 'Custo unitário' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  unitCost?: number;

  @ApiPropertyOptional({ description: 'ID do lote' })
  @IsOptional()
  @IsUUID()
  batchId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;
}

// ========================
// BATCH
// ========================

export class CreateBatchDto {
  @ApiProperty({ description: 'ID do produto' })
  @IsUUID()
  productId: string;

  @ApiProperty({ description: 'Número do lote' })
  @IsString()
  batchNumber: string;

  @ApiProperty({ description: 'Quantidade' })
  @IsNumber()
  @Min(1)
  quantity: number;

  @ApiPropertyOptional({ description: 'Data de validade' })
  @IsOptional()
  @IsDateString()
  expiryDate?: string;

  @ApiPropertyOptional({ description: 'Data de fabricação' })
  @IsOptional()
  @IsDateString()
  manufacturingDate?: string;

  @ApiPropertyOptional({ description: 'ID do fornecedor' })
  @IsOptional()
  @IsUUID()
  supplierId?: string;
}

// ========================
// INVENTORY COUNT
// ========================

export class InventoryCountItemDto {
  @ApiProperty()
  @IsUUID()
  productId: string;

  @ApiProperty()
  @IsNumber()
  @Min(0)
  countedQuantity: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;
}

export class StartInventoryCountDto {
  @ApiPropertyOptional({ description: 'IDs dos produtos (vazio = todos)' })
  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  productIds?: string[];

  @ApiPropertyOptional({ description: 'ID da categoria' })
  @IsOptional()
  @IsUUID()
  categoryId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;
}

export class SubmitInventoryCountDto {
  @ApiProperty({ type: [InventoryCountItemDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => InventoryCountItemDto)
  items: InventoryCountItemDto[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;
}

// ========================
// BULK STOCK ADJUSTMENT
// ========================

export class BulkStockAdjustmentItemDto {
  @ApiProperty()
  @IsUUID()
  productId: string;

  @ApiProperty()
  @IsNumber()
  quantity: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(0)
  unitCost?: number;
}

export class BulkStockAdjustmentDto {
  @ApiProperty({ enum: MovementType })
  @IsEnum(MovementType)
  type: MovementType;

  @ApiProperty({ enum: MovementReason })
  @IsEnum(MovementReason)
  reason: MovementReason;

  @ApiProperty({ type: [BulkStockAdjustmentItemDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => BulkStockAdjustmentItemDto)
  items: BulkStockAdjustmentItemDto[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;
}
