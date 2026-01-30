import { ApiProperty } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';

/**
 * DTO para reset de senha
 */
export class ResetPasswordDto {
  @ApiProperty({
    description: 'Token de reset de senha recebido por email',
    example: 'abc123def456...',
  })
  @IsString()
  @IsNotEmpty({ message: 'Token é obrigatório' })
  token: string;

  @ApiProperty({
    description: 'Nova senha',
    example: 'NovaSenhaSegura123!',
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
}

/**
 * DTO para alteração de senha pelo usuário logado
 */
export class ChangePasswordDto {
  @ApiProperty({
    description: 'Senha atual',
    example: 'SenhaAtual123!',
  })
  @IsString()
  @IsNotEmpty({ message: 'Senha atual é obrigatória' })
  currentPassword: string;

  @ApiProperty({
    description: 'Nova senha',
    example: 'NovaSenha123!',
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
  newPassword: string;
}
