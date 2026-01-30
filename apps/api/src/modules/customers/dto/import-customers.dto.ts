import {
  IsString,
  IsOptional,
  IsBoolean,
  IsEnum,
  IsArray,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/**
 * Formato do arquivo de importação
 */
export enum ImportFileFormat {
  CSV = 'csv',
  EXCEL = 'excel',
  JSON = 'json',
}

/**
 * Ação para duplicados
 */
export enum DuplicateAction {
  SKIP = 'skip',       // Ignorar duplicados
  UPDATE = 'update',   // Atualizar existente
  CREATE = 'create',   // Criar mesmo assim
}

/**
 * Mapeamento de coluna
 */
export class ColumnMappingDto {
  @ApiProperty({ description: 'Nome da coluna no arquivo' })
  @IsString()
  sourceColumn: string;

  @ApiProperty({ description: 'Campo de destino no sistema' })
  @IsString()
  targetField: string;

  @ApiPropertyOptional({ description: 'Transformação a aplicar' })
  @IsOptional()
  @IsString()
  transform?: 'uppercase' | 'lowercase' | 'trim' | 'phone' | 'cpf' | 'date';
}

/**
 * Opções de importação
 */
export class ImportOptionsDto {
  @ApiPropertyOptional({ enum: ImportFileFormat, default: ImportFileFormat.CSV })
  @IsOptional()
  @IsEnum(ImportFileFormat)
  format?: ImportFileFormat = ImportFileFormat.CSV;

  @ApiPropertyOptional({ enum: DuplicateAction, default: DuplicateAction.SKIP })
  @IsOptional()
  @IsEnum(DuplicateAction)
  duplicateAction?: DuplicateAction = DuplicateAction.SKIP;

  @ApiPropertyOptional({ description: 'Campo usado para detectar duplicados', default: 'phone' })
  @IsOptional()
  @IsString()
  duplicateField?: string = 'phone';

  @ApiPropertyOptional({
    type: [ColumnMappingDto],
    description: 'Mapeamento de colunas personalizado',
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ColumnMappingDto)
  columnMapping?: ColumnMappingDto[];

  @ApiPropertyOptional({ description: 'Primeira linha é cabeçalho', default: true })
  @IsOptional()
  @IsBoolean()
  hasHeader?: boolean = true;

  @ApiPropertyOptional({ description: 'Delimitador CSV', default: ',' })
  @IsOptional()
  @IsString()
  delimiter?: string = ',';

  @ApiPropertyOptional({ description: 'Encoding do arquivo', default: 'utf-8' })
  @IsOptional()
  @IsString()
  encoding?: string = 'utf-8';

  @ApiPropertyOptional({ description: 'Tags a adicionar em todos os importados' })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  defaultTags?: string[];

  @ApiPropertyOptional({ description: 'Fonte de aquisição padrão' })
  @IsOptional()
  @IsString()
  defaultAcquisitionSource?: string;

  @ApiPropertyOptional({ description: 'Enviar email de boas-vindas' })
  @IsOptional()
  @IsBoolean()
  sendWelcomeEmail?: boolean = false;

  @ApiPropertyOptional({ description: 'Modo de teste (não salva)' })
  @IsOptional()
  @IsBoolean()
  dryRun?: boolean = false;
}

/**
 * Resultado da importação por linha
 */
export class ImportRowResultDto {
  @ApiProperty({ description: 'Número da linha' })
  row: number;

  @ApiProperty({ description: 'Status do processamento' })
  status: 'created' | 'updated' | 'skipped' | 'error';

  @ApiPropertyOptional({ description: 'ID do cliente criado/atualizado' })
  customerId?: string;

  @ApiPropertyOptional({ description: 'Mensagem de erro' })
  error?: string;

  @ApiPropertyOptional({ description: 'Dados da linha' })
  data?: Record<string, any>;
}

/**
 * Resultado completo da importação
 */
export class ImportResultDto {
  @ApiProperty({ description: 'Total de linhas processadas' })
  totalRows: number;

  @ApiProperty({ description: 'Clientes criados' })
  created: number;

  @ApiProperty({ description: 'Clientes atualizados' })
  updated: number;

  @ApiProperty({ description: 'Linhas ignoradas' })
  skipped: number;

  @ApiProperty({ description: 'Erros encontrados' })
  errors: number;

  @ApiProperty({ type: [ImportRowResultDto], description: 'Detalhes por linha' })
  details: ImportRowResultDto[];

  @ApiProperty({ description: 'Tempo de processamento em ms' })
  processingTimeMs: number;

  @ApiProperty({ description: 'Foi apenas teste' })
  dryRun: boolean;
}

/**
 * DTO para validação prévia do arquivo
 */
export class ValidateImportFileDto {
  @ApiProperty({ description: 'Primeiras linhas do arquivo para preview' })
  previewRows: Record<string, any>[];

  @ApiProperty({ description: 'Colunas detectadas' })
  detectedColumns: string[];

  @ApiProperty({ description: 'Mapeamento sugerido' })
  suggestedMapping: ColumnMappingDto[];

  @ApiProperty({ description: 'Total de linhas no arquivo' })
  totalRows: number;

  @ApiProperty({ description: 'Duplicados potenciais encontrados' })
  potentialDuplicates: number;

  @ApiProperty({ description: 'Erros de validação encontrados' })
  validationErrors: string[];
}
