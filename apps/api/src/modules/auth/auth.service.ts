import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
  ConflictException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '@/prisma/prisma.service';
import { UserRole, UserStatus } from '@glamo/database';
import * as argon2 from 'argon2';

/**
 * Auth Service with email verification flow
 * New flow:
 * 1. User registers with personal data only (no tenant)
 * 2. Verification code sent to email
 * 3. User verifies email with 6-digit code
 * 4. User can then choose to be owner or employee
 * 5. If owner, creates tenant; if employee, accepts invitations
 */
@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  // In-memory verification codes (in production, use Redis or database)
  private verificationCodes = new Map<string, { code: string; expiresAt: Date; userId: string }>();

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  // ==================== REGISTRO (sem tenant) ====================

  async register(dto: { email: string; password: string; name: string; phone?: string }) {
    this.logger.log(`Registering new user: ${dto.email}`);

    // Check if email already exists
    const existingUser = await this.prisma.user.findFirst({
      where: { email: dto.email.toLowerCase() },
    });

    if (existingUser) {
      throw new ConflictException('Email já cadastrado');
    }

    // Hash password
    const hashedPassword = await argon2.hash(dto.password);

    // Create user without tenant (tenantId will be null initially)
    const user = await this.prisma.user.create({
      data: {
        email: dto.email.toLowerCase(),
        passwordHash: hashedPassword,
        name: dto.name,
        phone: dto.phone,
        role: UserRole.OWNER, // Will be adjusted when joining tenant
        status: UserStatus.PENDING, // Pending email verification
      },
    });

    // Generate and send verification code
    const verificationCode = this.generateVerificationCode();
    this.verificationCodes.set(dto.email.toLowerCase(), {
      code: verificationCode,
      expiresAt: new Date(Date.now() + 15 * 60 * 1000), // 15 minutes
      userId: user.id,
    });

    // TODO: Send email with verification code
    this.logger.log(`Verification code for ${dto.email}: ${verificationCode}`);
    
    // In development, log the code
    if (this.configService.get('NODE_ENV') === 'development') {
      console.log(`\n📧 VERIFICATION CODE for ${dto.email}: ${verificationCode}\n`);
    }

    return {
      message: 'Conta criada! Verifique seu email para ativar.',
      email: dto.email,
    };
  }

  // ==================== VERIFICAR EMAIL ====================

  async verifyEmail(email: string, code: string) {
    const storedData = this.verificationCodes.get(email.toLowerCase());

    if (!storedData) {
      throw new BadRequestException('Código de verificação não encontrado. Solicite um novo código.');
    }

    if (new Date() > storedData.expiresAt) {
      this.verificationCodes.delete(email.toLowerCase());
      throw new BadRequestException('Código expirado. Solicite um novo código.');
    }

    if (storedData.code !== code) {
      throw new BadRequestException('Código inválido');
    }

    // Activate user
    const user = await this.prisma.user.update({
      where: { id: storedData.userId },
      data: {
        status: UserStatus.ACTIVE,
        emailVerifiedAt: new Date(),
      },
    });

    // Clear verification code
    this.verificationCodes.delete(email.toLowerCase());

    // Generate tokens (tenantId can be null for users without tenant)
    const tokens = await this.generateTokens(user.id, user.tenantId, user.role, user.email);

    return {
      message: 'Email verificado com sucesso!',
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      expiresIn: 900,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        hasTenant: !!user.tenantId,
      },
    };
  }

  // ==================== REENVIAR CÓDIGO ====================

  async resendVerificationCode(email: string) {
    const user = await this.prisma.user.findFirst({
      where: { email: email.toLowerCase() },
    });

    if (!user) {
      // Don't reveal if email exists
      return { message: 'Se o email estiver cadastrado, um novo código será enviado.' };
    }

    if (user.status === UserStatus.ACTIVE) {
      throw new BadRequestException('Email já verificado');
    }

    // Generate new code
    const verificationCode = this.generateVerificationCode();
    this.verificationCodes.set(email.toLowerCase(), {
      code: verificationCode,
      expiresAt: new Date(Date.now() + 15 * 60 * 1000),
      userId: user.id,
    });

    // TODO: Send email
    this.logger.log(`New verification code for ${email}: ${verificationCode}`);
    
    if (this.configService.get('NODE_ENV') === 'development') {
      console.log(`\n📧 NEW VERIFICATION CODE for ${email}: ${verificationCode}\n`);
    }

    return { message: 'Novo código enviado para seu email.' };
  }

  // ==================== LOGIN ====================

  async login(dto: { email: string; password: string }) {
    this.logger.log(`Login attempt: ${dto.email}`);

    // Find user with tenant (if has one)
    const user = await this.prisma.user.findFirst({
      where: { email: dto.email.toLowerCase() },
      include: { tenant: true },
    });

    if (!user) {
      throw new UnauthorizedException('Credenciais inválidas');
    }

    // Verify password
    const isPasswordValid = await argon2.verify(user.passwordHash, dto.password);
    if (!isPasswordValid) {
      await this.prisma.user.update({
        where: { id: user.id },
        data: { failedLogins: { increment: 1 } },
      });
      throw new UnauthorizedException('Credenciais inválidas');
    }

    // Check if email is verified
    if (user.status === UserStatus.PENDING) {
      // Resend verification code
      await this.resendVerificationCode(dto.email);
      throw new UnauthorizedException('Email não verificado. Enviamos um novo código de verificação.');
    }

    // Check user status
    if (user.status !== UserStatus.ACTIVE) {
      throw new UnauthorizedException('Conta inativa');
    }

    // Reset failed logins and update last login
    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        failedLogins: 0,
        lastLoginAt: new Date(),
      },
    });

    // Generate tokens
    const tokens = await this.generateTokens(user.id, user.tenantId, user.role, user.email);

    return {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      expiresIn: 900,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        tenantId: user.tenantId,
        hasTenant: !!user.tenantId,
      },
      tenant: user.tenant ? {
        id: user.tenant.id,
        name: user.tenant.name,
        slug: user.tenant.slug,
        plan: user.tenant.plan,
      } : null,
    };
  }

  // ==================== REFRESH TOKEN ====================

  async refreshTokens(refreshToken: string) {
    try {
      const payload = this.jwtService.verify(refreshToken, {
        secret: this.configService.get<string>('JWT_REFRESH_SECRET') || this.configService.get<string>('JWT_SECRET'),
      });

      const user = await this.prisma.user.findUnique({
        where: { id: payload.sub },
        include: { tenant: true },
      });

      if (!user || user.status !== UserStatus.ACTIVE) {
        throw new UnauthorizedException('Token inválido');
      }

      const tokens = await this.generateTokens(user.id, user.tenantId, user.role, user.email);

      return {
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        expiresIn: 900,
      };
    } catch (error) {
      throw new UnauthorizedException('Refresh token inválido');
    }
  }

  // ==================== VALIDATE USER ====================

  async validateUser(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { tenant: true },
    });

    if (!user || user.status !== UserStatus.ACTIVE) {
      return null;
    }

    return {
      id: user.id,
      email: user.email,
      name: user.name,
      phone: user.phone,
      role: user.role,
      tenantId: user.tenantId,
      hasTenant: !!user.tenantId,
      tenant: user.tenant ? {
        id: user.tenant.id,
        name: user.tenant.name,
        slug: user.tenant.slug,
        plan: user.tenant.plan,
        status: user.tenant.status,
      } : null,
    };
  }

  // ==================== HELPERS ====================

  private generateVerificationCode(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  private async generateTokens(userId: string, tenantId: string | null, role: UserRole, email?: string) {
    const payload = {
      sub: userId,
      tenantId: tenantId || undefined,
      role,
      email,
    };

    const accessToken = this.jwtService.sign(payload, {
      secret: this.configService.get<string>('JWT_SECRET'),
      expiresIn: '15m',
    });

    const refreshToken = this.jwtService.sign(payload, {
      secret: this.configService.get<string>('JWT_REFRESH_SECRET') || this.configService.get<string>('JWT_SECRET'),
      expiresIn: '7d',
    });

    return { accessToken, refreshToken };
  }

  // Compatibility methods
  async hashPassword(password: string): Promise<string> {
    return argon2.hash(password);
  }

  async verifyPassword(password: string, hash: string): Promise<boolean> {
    return argon2.verify(hash, password);
  }
}
