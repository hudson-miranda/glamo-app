import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';

/**
 * DTO para registro de novo tenant + usuário admin
 */
export class RegisterDto {
  @ApiProperty({
    description: 'Email do administrador',
    example: 'proprietario@salao.com',
  })
  @IsEmail({}, { message: 'Email inválido' })
  @IsNotEmpty({ message: 'Email é obrigatório' })
  @MaxLength(255)
  email: string;

  @ApiProperty({
    description: 'Senha (mínimo 8 caracteres, deve conter maiúscula, minúscula, número e caractere especial)',
    example: 'SenhaSegura123!',
    minLength: 8,
  })
  @IsString()
  @MinLength(8, { message: 'Senha deve ter no mínimo 8 caracteres' })
  @MaxLength(100)
  @Matches(
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
    {
      message:
        'Senha deve conter ao menos uma letra maiúscula, uma minúscula, um número e um caractere especial',
    },
  )
  password: string;

  @ApiProperty({
    description: 'Nome completo do administrador',
    example: 'João Silva',
  })
  @IsString()
  @IsNotEmpty({ message: 'Nome é obrigatório' })
  @MinLength(2)
  @MaxLength(100)
  name: string;

  @ApiProperty({
    description: 'Nome do estabelecimento/salão',
    example: 'Salão Beleza Pura',
  })
  @IsString()
  @IsNotEmpty({ message: 'Nome do estabelecimento é obrigatório' })
  @MinLength(2)
  @MaxLength(100)
  tenantName: string;

  @ApiPropertyOptional({
    description: 'Telefone com DDD',
    example: '11999999999',
  })
  @IsOptional()
  @IsString()
  @Matches(/^\d{10,11}$/, {
    message: 'Telefone deve conter 10 ou 11 dígitos',
  })
  phone?: string;
}

/**
 * DTO para adicionar novo usuário a um tenant existente
 */
export class AddUserDto {
  @ApiProperty({
    description: 'Email do novo usuário',
    example: 'profissional@salao.com',
  })
  @IsEmail({}, { message: 'Email inválido' })
  @IsNotEmpty({ message: 'Email é obrigatório' })
  @MaxLength(255)
  email: string;

  @ApiProperty({
    description: 'Senha temporária',
    example: 'TempPass123!',
    minLength: 8,
  })
  @IsString()
  @MinLength(8)
  @MaxLength(100)
  password: string;

  @ApiProperty({
    description: 'Nome completo',
    example: 'Maria Santos',
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  @MaxLength(100)
  name: string;

  @ApiProperty({
    description: 'Role do usuário',
    example: 'PROFESSIONAL',
    enum: ['ADMIN', 'MANAGER', 'RECEPTIONIST', 'PROFESSIONAL'],
  })
  @IsString()
  @IsNotEmpty()
  role: string;

  @ApiPropertyOptional({
    description: 'Telefone',
    example: '11988888888',
  })
  @IsOptional()
  @IsString()
  phone?: string;
}
