import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { Request } from 'express';
import { JwtRefreshPayload } from '../interfaces';

/**
 * JWT Refresh Strategy para validação de refresh tokens
 */
@Injectable()
export class JwtRefreshStrategy extends PassportStrategy(Strategy, 'jwt-refresh') {
  constructor(private configService: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromBodyField('refreshToken'),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_REFRESH_SECRET'),
      passReqToCallback: true,
    });
  }

  /**
   * Valida o refresh token
   */
  async validate(
    req: Request,
    payload: JwtRefreshPayload,
  ): Promise<{ userId: string; tenantId: string; tokenId: string; refreshToken: string }> {
    if (!payload.sub || !payload.tenantId || payload.type !== 'refresh') {
      throw new UnauthorizedException('Refresh token inválido');
    }

    const refreshToken = req.body?.refreshToken;
    if (!refreshToken) {
      throw new UnauthorizedException('Refresh token não fornecido');
    }

    return {
      userId: payload.sub,
      tenantId: payload.tenantId,
      tokenId: payload.tokenId,
      refreshToken,
    };
  }
}
