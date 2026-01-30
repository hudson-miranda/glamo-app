import {
  IsString,
  IsNumber,
  IsOptional,
  IsEnum,
  IsArray,
  IsUUID,
  IsBoolean,
  ValidateNested,
  Min,
  IsObject,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ProductType, ProductStatus, UnitOfMeasure } from '../interfaces';

// ========================
// PRODUCT PRICING
// ========================

export class ProductPricingDto {
  @ApiProperty({ description: 'Preço de custo' })
  @IsNumber()
  @Min(0)
  costPrice: number;

  @ApiProperty({ description: 'Preço de venda varejo' })
  @IsNumber()
  @Min(0)
  retailPrice: number;

  @ApiPropertyOptional({ description: 'Preço atacado' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  wholesalePrice?: number;

  @ApiPropertyOptional({ description: 'Preço mínimo' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  minPrice?: number;
}

// ========================
// PRODUCT STOCK
// ========================

export class ProductStockDto {
  @ApiProperty({ description: 'Quantidade inicial' })
  @IsNumber()
  @Min(0)
  quantity: number;

  @ApiProperty({ description: 'Estoque mínimo' })
  @IsNumber()
  @Min(0)
  minStock: number;

  @ApiPropertyOptional({ description: 'Estoque máximo' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  maxStock?: number;

  @ApiProperty({ description: 'Ponto de reposição' })
  @IsNumber()
  @Min(0)
  reorderPoint: number;

  @ApiProperty({ description: 'Quantidade de reposição' })
  @IsNumber()
  @Min(1)
  reorderQuantity: number;
}

// ========================
// PRODUCT DIMENSIONS
// ========================

export class ProductDimensionsDto {
  @ApiPropertyOptional({ description: 'Largura (cm)' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  width?: number;

  @ApiPropertyOptional({ description: 'Altura (cm)' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  height?: number;

  @ApiPropertyOptional({ description: 'Profundidade (cm)' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  depth?: number;

  @ApiPropertyOptional({ description: 'Peso (g)' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  weight?: number;
}

// ========================
// CREATE PRODUCT
// ========================

export class CreateProductDto {
  @ApiProperty({ description: 'SKU único' })
  @IsString()
  sku: string;

  @ApiPropertyOptional({ description: 'Código de barras' })
  @IsOptional()
  @IsString()
  barcode?: string;

  @ApiProperty({ description: 'Nome do produto' })
  @IsString()
  name: string;

  @ApiPropertyOptional({ description: 'Descrição' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ enum: ProductType })
  @IsEnum(ProductType)
  type: ProductType;

  @ApiPropertyOptional({ enum: ProductStatus, default: ProductStatus.ACTIVE })
  @IsOptional()
  @IsEnum(ProductStatus)
  status?: ProductStatus;

  @ApiPropertyOptional({ description: 'ID da categoria' })
  @IsOptional()
  @IsUUID()
  categoryId?: string;

  @ApiPropertyOptional({ description: 'ID da marca' })
  @IsOptional()
  @IsUUID()
  brandId?: string;

  @ApiProperty({ type: ProductPricingDto })
  @ValidateNested()
  @Type(() => ProductPricingDto)
  pricing: ProductPricingDto;

  @ApiProperty({ type: ProductStockDto })
  @ValidateNested()
  @Type(() => ProductStockDto)
  stock: ProductStockDto;

  @ApiProperty({ enum: UnitOfMeasure })
  @IsEnum(UnitOfMeasure)
  unit: UnitOfMeasure;

  @ApiPropertyOptional({ description: 'Unidades por embalagem' })
  @IsOptional()
  @IsNumber()
  @Min(1)
  unitsPerPackage?: number;

  @ApiPropertyOptional({ type: ProductDimensionsDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => ProductDimensionsDto)
  dimensions?: ProductDimensionsDto;

  @ApiPropertyOptional({ description: 'URLs das imagens' })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  images?: string[];

  @ApiPropertyOptional({ description: 'ID do fornecedor' })
  @IsOptional()
  @IsUUID()
  supplierId?: string;

  @ApiPropertyOptional({ description: 'Controlar estoque', default: true })
  @IsOptional()
  @IsBoolean()
  trackInventory?: boolean;

  @ApiPropertyOptional({ description: 'Controlar lotes', default: false })
  @IsOptional()
  @IsBoolean()
  trackBatches?: boolean;

  @ApiPropertyOptional({ description: 'Permitir estoque negativo', default: false })
  @IsOptional()
  @IsBoolean()
  allowNegativeStock?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;
}

// ========================
// UPDATE PRODUCT
// ========================

export class UpdateProductDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  sku?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  barcode?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ enum: ProductType })
  @IsOptional()
  @IsEnum(ProductType)
  type?: ProductType;

  @ApiPropertyOptional({ enum: ProductStatus })
  @IsOptional()
  @IsEnum(ProductStatus)
  status?: ProductStatus;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  categoryId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  brandId?: string;

  @ApiPropertyOptional({ type: ProductPricingDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => ProductPricingDto)
  pricing?: ProductPricingDto;

  @ApiPropertyOptional({ enum: UnitOfMeasure })
  @IsOptional()
  @IsEnum(UnitOfMeasure)
  unit?: UnitOfMeasure;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(1)
  unitsPerPackage?: number;

  @ApiPropertyOptional({ type: ProductDimensionsDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => ProductDimensionsDto)
  dimensions?: ProductDimensionsDto;

  @ApiPropertyOptional()
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  images?: string[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  supplierId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  trackInventory?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  trackBatches?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  allowNegativeStock?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;
}

// ========================
// UPDATE STOCK SETTINGS
// ========================

export class UpdateStockSettingsDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(0)
  minStock?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(0)
  maxStock?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(0)
  reorderPoint?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(1)
  reorderQuantity?: number;
}
