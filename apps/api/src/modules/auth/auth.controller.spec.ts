import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { UserRole } from '@glamo/database';
import { AuthenticatedUser } from './interfaces';

describe('AuthController', () => {
  let controller: AuthController;
  let authService: AuthService;

  const mockUser: AuthenticatedUser = {
    id: 'user-123',
    email: 'test@example.com',
    name: 'Test User',
    role: UserRole.OWNER,
    tenantId: 'tenant-123',
    permissions: [],
  };

  const mockLoginResponse = {
    user: mockUser,
    accessToken: 'mock-access-token',
    refreshToken: 'mock-refresh-token',
    expiresIn: 900,
  };

  const mockAuthService = {
    register: jest.fn().mockResolvedValue(mockLoginResponse),
    addUser: jest.fn().mockResolvedValue(mockUser),
    login: jest.fn().mockResolvedValue(mockLoginResponse),
    refreshTokens: jest.fn().mockResolvedValue({
      accessToken: 'new-access-token',
      refreshToken: 'new-refresh-token',
    }),
    logout: jest.fn().mockResolvedValue(undefined),
    forgotPassword: jest.fn().mockResolvedValue(undefined),
    resetPassword: jest.fn().mockResolvedValue(undefined),
    changePassword: jest.fn().mockResolvedValue(undefined),
    verifyEmail: jest.fn().mockResolvedValue(undefined),
    resendVerificationEmail: jest.fn().mockResolvedValue(undefined),
    getMe: jest.fn().mockResolvedValue(mockUser),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        { provide: AuthService, useValue: mockAuthService },
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
    authService = module.get<AuthService>(AuthService);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('register', () => {
    const registerDto = {
      email: 'new@example.com',
      password: 'Password123!',
      businessName: 'New Salon',
      ownerName: 'Owner Name',
      document: '12345678000190',
      phone: '11999999999',
    };

    it('should register a new tenant and user', async () => {
      const result = await controller.register(registerDto);

      expect(authService.register).toHaveBeenCalledWith(registerDto);
      expect(result).toEqual(mockLoginResponse);
    });
  });

  describe('addUser', () => {
    const addUserDto = {
      email: 'staff@example.com',
      name: 'Staff User',
      role: UserRole.STAFF,
      phone: '11888888888',
    };

    it('should add a new user to tenant', async () => {
      const result = await controller.addUser(addUserDto, mockUser);

      expect(authService.addUser).toHaveBeenCalledWith(
        addUserDto,
        mockUser.tenantId,
        mockUser.id,
      );
      expect(result).toEqual(mockUser);
    });
  });

  describe('login', () => {
    const loginDto = {
      email: 'test@example.com',
      password: 'password123',
    };

    it('should login and return tokens', async () => {
      const result = await controller.login(loginDto);

      expect(authService.login).toHaveBeenCalledWith(loginDto);
      expect(result).toEqual(mockLoginResponse);
    });
  });

  describe('logout', () => {
    it('should logout user', async () => {
      const result = await controller.logout('user-123');

      expect(authService.logout).toHaveBeenCalledWith('user-123');
      expect(result).toEqual({ message: 'Logout realizado com sucesso' });
    });
  });

  describe('forgotPassword', () => {
    it('should initiate password reset', async () => {
      const result = await controller.forgotPassword({ email: 'test@example.com' });

      expect(authService.forgotPassword).toHaveBeenCalledWith('test@example.com');
      expect(result.message).toContain('Se o email existir');
    });
  });

  describe('resetPassword', () => {
    it('should reset password', async () => {
      const dto = { token: 'valid-token', password: 'NewPassword123!' };

      const result = await controller.resetPassword(dto);

      expect(authService.resetPassword).toHaveBeenCalledWith(dto.token, dto.password);
      expect(result.message).toContain('Senha redefinida');
    });
  });

  describe('changePassword', () => {
    it('should change password', async () => {
      const dto = {
        currentPassword: 'oldPassword',
        newPassword: 'NewPassword123!',
      };

      const result = await controller.changePassword('user-123', dto);

      expect(authService.changePassword).toHaveBeenCalledWith(
        'user-123',
        dto.currentPassword,
        dto.newPassword,
      );
      expect(result.message).toContain('Senha alterada');
    });
  });

  describe('verifyEmail', () => {
    it('should verify email', async () => {
      const result = await controller.verifyEmail('valid-token');

      expect(authService.verifyEmail).toHaveBeenCalledWith('valid-token');
      expect(result.message).toContain('Email verificado');
    });
  });

  describe('resendVerification', () => {
    it('should resend verification email', async () => {
      const result = await controller.resendVerification('user-123');

      expect(authService.resendVerificationEmail).toHaveBeenCalledWith('user-123');
      expect(result.message).toContain('Email de verificação reenviado');
    });
  });

  describe('getMe', () => {
    it('should return current user', async () => {
      const result = await controller.getMe(mockUser);

      expect(authService.getMe).toHaveBeenCalledWith(mockUser.id);
    });
  });
});
