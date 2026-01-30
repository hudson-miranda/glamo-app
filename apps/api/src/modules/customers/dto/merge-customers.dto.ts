import { IsString, IsArray, IsOptional, IsBoolean } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/**
 * DTO para mesclar clientes duplicados
 */
export class MergeCustomersDto {
  @ApiProperty({ description: 'ID do cliente principal (que permanecerá)' })
  @IsString()
  primaryCustomerId: string;

  @ApiProperty({
    type: [String],
    description: 'IDs dos clientes a serem mesclados (serão removidos)',
  })
  @IsArray()
  @IsString({ each: true })
  mergeCustomerIds: string[];

  @ApiPropertyOptional({
    description: 'Estratégia de merge para campos conflitantes',
    default: 'primary',
  })
  @IsOptional()
  @IsString()
  conflictStrategy?: 'primary' | 'newest' | 'oldest' | 'merge';

  @ApiPropertyOptional({
    description: 'Manter histórico de agendamentos dos mesclados',
    default: true,
  })
  @IsOptional()
  @IsBoolean()
  keepAppointmentHistory?: boolean = true;

  @ApiPropertyOptional({
    description: 'Somar pontos de fidelidade',
    default: true,
  })
  @IsOptional()
  @IsBoolean()
  sumLoyaltyPoints?: boolean = true;
}

/**
 * DTO para busca de duplicados
 */
export class FindDuplicatesDto {
  @ApiPropertyOptional({
    description: 'Campos para verificar duplicados',
    default: ['phone', 'email', 'cpf'],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  fields?: string[] = ['phone', 'email', 'cpf'];

  @ApiPropertyOptional({
    description: 'Incluir busca por similaridade de nome',
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  includeNameSimilarity?: boolean = false;

  @ApiPropertyOptional({
    description: 'Threshold de similaridade (0-1)',
    default: 0.8,
  })
  @IsOptional()
  similarityThreshold?: number = 0.8;
}

/**
 * Grupo de duplicados encontrados
 */
export class DuplicateGroupDto {
  @ApiProperty({ description: 'Campo que identificou o duplicado' })
  matchField: string;

  @ApiProperty({ description: 'Valor do campo duplicado' })
  matchValue: string;

  @ApiProperty({ description: 'IDs dos clientes duplicados' })
  customerIds: string[];

  @ApiProperty({ description: 'Resumo dos clientes' })
  customers: Array<{
    id: string;
    name: string;
    phone: string;
    email?: string;
    totalAppointments: number;
    lastVisitAt?: Date;
    createdAt: Date;
  }>;

  @ApiProperty({ description: 'Sugestão de cliente principal (mais completo/ativo)' })
  suggestedPrimaryId: string;
}

/**
 * Resultado da busca de duplicados
 */
export class FindDuplicatesResultDto {
  @ApiProperty({ description: 'Total de grupos de duplicados' })
  totalGroups: number;

  @ApiProperty({ description: 'Total de clientes duplicados' })
  totalDuplicates: number;

  @ApiProperty({ type: [DuplicateGroupDto], description: 'Grupos de duplicados' })
  groups: DuplicateGroupDto[];
}

/**
 * Resultado do merge
 */
export class MergeResultDto {
  @ApiProperty({ description: 'Merge realizado com sucesso' })
  success: boolean;

  @ApiProperty({ description: 'ID do cliente resultante' })
  customerId: string;

  @ApiProperty({ description: 'Clientes mesclados (removidos)' })
  mergedCount: number;

  @ApiProperty({ description: 'Agendamentos transferidos' })
  appointmentsTransferred: number;

  @ApiProperty({ description: 'Pontos de fidelidade consolidados' })
  totalLoyaltyPoints: number;

  @ApiPropertyOptional({ description: 'Avisos ou observações' })
  warnings?: string[];
}
