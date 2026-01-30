import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty } from 'class-validator';

/**
 * DTO para solicitar reset de senha
 */
export class ForgotPasswordDto {
  @ApiProperty({
    description: 'Email do usuário',
    example: 'usuario@salao.com',
  })
  @IsEmail({}, { message: 'Email inválido' })
  @IsNotEmpty({ message: 'Email é obrigatório' })
  email: string;
}
