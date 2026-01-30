import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { JwtPayload, AuthenticatedUser } from '../interfaces';

/**
 * JWT Strategy para validação de access tokens
 */
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(private configService: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_SECRET'),
    });
  }

  /**
   * Valida o payload do JWT e retorna o usuário autenticado
   * Note: tenantId can be undefined for users who haven't joined/created a tenant yet
   */
  async validate(payload: JwtPayload): Promise<AuthenticatedUser> {
    if (!payload.sub) {
      throw new UnauthorizedException('Token inválido');
    }

    return {
      id: payload.sub,
      sub: payload.sub, // Also include sub for compatibility
      email: payload.email,
      name: payload.email, // Será sobrescrito pelo guard se necessário
      role: payload.role,
      tenantId: payload.tenantId, // Can be undefined
      professionalId: payload.professionalId,
      permissions: payload.permissions || [],
    };
  }
}
