import {
  Injectable,
  ConflictException,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { InvitationStatus, UserRole } from '@prisma/client';
import { randomBytes } from 'crypto';

export interface CreateInvitationDto {
  email: string;
  role?: UserRole;
  message?: string;
}

@Injectable()
export class InvitationsService {
  constructor(private prisma: PrismaService) {}

  /**
   * Generate a unique invitation token
   */
  private generateToken(): string {
    return randomBytes(32).toString('hex');
  }

  /**
   * Create a new invitation
   */
  async create(senderId: string, tenantId: string, dto: CreateInvitationDto) {
    // Validate sender has permission
    const sender = await this.prisma.user.findUnique({
      where: { id: senderId },
      select: { tenantId: true, role: true },
    });

    if (!sender?.tenantId || sender.tenantId !== tenantId) {
      throw new ForbiddenException('Você não pertence a este estabelecimento');
    }

    if (sender.role !== UserRole.OWNER && sender.role !== UserRole.ADMIN && sender.role !== UserRole.MANAGER) {
      throw new ForbiddenException('Você não tem permissão para enviar convites');
    }

    // Check if there's already a pending invitation for this email
    const existingInvitation = await this.prisma.invitation.findFirst({
      where: {
        tenantId,
        email: dto.email.toLowerCase(),
        status: InvitationStatus.PENDING,
      },
    });

    if (existingInvitation) {
      throw new ConflictException('Já existe um convite pendente para este email');
    }

    // Check if user with this email is already in the tenant
    const existingUser = await this.prisma.user.findFirst({
      where: {
        email: dto.email.toLowerCase(),
        tenantId,
      },
    });

    if (existingUser) {
      throw new ConflictException('Este usuário já faz parte do estabelecimento');
    }

    // Find if the user exists (to link the invitation)
    const recipientUser = await this.prisma.user.findUnique({
      where: { email: dto.email.toLowerCase() },
    });

    const token = this.generateToken();
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    const invitation = await this.prisma.invitation.create({
      data: {
        tenantId,
        senderId,
        recipientId: recipientUser?.id || null,
        email: dto.email.toLowerCase(),
        role: dto.role || UserRole.PROFESSIONAL,
        status: InvitationStatus.PENDING,
        token,
        expiresAt,
        message: dto.message,
      },
      include: {
        tenant: {
          select: {
            id: true,
            name: true,
            logoUrl: true,
          },
        },
        sender: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    // TODO: Send email notification
    console.log(`📧 Convite enviado para ${dto.email} - Token: ${token}`);

    return {
      id: invitation.id,
      email: invitation.email,
      role: invitation.role,
      status: invitation.status,
      expiresAt: invitation.expiresAt,
      tenant: invitation.tenant,
      sender: invitation.sender,
    };
  }

  /**
   * Get invitations received by a user
   */
  async getReceivedInvitations(userId: string, email: string) {
    const invitations = await this.prisma.invitation.findMany({
      where: {
        OR: [
          { recipientId: userId },
          { email: email.toLowerCase() },
        ],
        status: InvitationStatus.PENDING,
        expiresAt: {
          gt: new Date(),
        },
      },
      include: {
        tenant: {
          select: {
            id: true,
            name: true,
            logoUrl: true,
            businessType: true,
          },
        },
        sender: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return invitations.map((inv) => ({
      id: inv.id,
      role: inv.role,
      message: inv.message,
      status: inv.status,
      expiresAt: inv.expiresAt,
      createdAt: inv.createdAt,
      tenant: inv.tenant,
      sender: inv.sender,
    }));
  }

  /**
   * Get invitations sent by a tenant
   */
  async getTenantInvitations(tenantId: string, userId: string) {
    // Validate user belongs to tenant
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { tenantId: true },
    });

    if (user?.tenantId !== tenantId) {
      throw new ForbiddenException('Você não pertence a este estabelecimento');
    }

    const invitations = await this.prisma.invitation.findMany({
      where: {
        tenantId,
      },
      include: {
        recipient: {
          select: {
            id: true,
            name: true,
          },
        },
        sender: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return invitations;
  }

  /**
   * Accept an invitation
   */
  async accept(invitationId: string, userId: string) {
    const invitation = await this.prisma.invitation.findUnique({
      where: { id: invitationId },
      include: {
        tenant: true,
      },
    });

    if (!invitation) {
      throw new NotFoundException('Convite não encontrado');
    }

    // Check if invitation is valid
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('Usuário não encontrado');
    }

    // Verify invitation belongs to this user (by ID or email)
    if (invitation.recipientId && invitation.recipientId !== userId) {
      throw new ForbiddenException('Este convite não é para você');
    }

    if (!invitation.recipientId && invitation.email.toLowerCase() !== user.email.toLowerCase()) {
      throw new ForbiddenException('Este convite não é para você');
    }

    if (invitation.status !== InvitationStatus.PENDING) {
      throw new BadRequestException('Este convite já foi respondido');
    }

    if (invitation.expiresAt < new Date()) {
      throw new BadRequestException('Este convite expirou');
    }

    // Accept invitation in transaction
    await this.prisma.$transaction(async (tx) => {
      // Update invitation status
      await tx.invitation.update({
        where: { id: invitationId },
        data: {
          status: InvitationStatus.ACCEPTED,
          recipientId: userId,
          respondedAt: new Date(),
        },
      });

      // Update user to belong to tenant
      await tx.user.update({
        where: { id: userId },
        data: {
          tenantId: invitation.tenantId,
          role: invitation.role,
        },
      });

      // Create professional profile if role is PROFESSIONAL
      if (invitation.role === UserRole.PROFESSIONAL) {
        await tx.professional.create({
          data: {
            userId,
            tenantId: invitation.tenantId,
            displayName: user.name,
            isActive: true,
            acceptsOnlineBooking: true,
          },
        });
      }
    });

    return {
      message: 'Convite aceito com sucesso',
      tenant: {
        id: invitation.tenant.id,
        name: invitation.tenant.name,
        slug: invitation.tenant.slug,
      },
    };
  }

  /**
   * Reject an invitation
   */
  async reject(invitationId: string, userId: string) {
    const invitation = await this.prisma.invitation.findUnique({
      where: { id: invitationId },
    });

    if (!invitation) {
      throw new NotFoundException('Convite não encontrado');
    }

    // Check if invitation belongs to this user
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('Usuário não encontrado');
    }

    if (invitation.recipientId && invitation.recipientId !== userId) {
      throw new ForbiddenException('Este convite não é para você');
    }

    if (!invitation.recipientId && invitation.email.toLowerCase() !== user.email.toLowerCase()) {
      throw new ForbiddenException('Este convite não é para você');
    }

    if (invitation.status !== InvitationStatus.PENDING) {
      throw new BadRequestException('Este convite já foi respondido');
    }

    await this.prisma.invitation.update({
      where: { id: invitationId },
      data: {
        status: InvitationStatus.REJECTED,
        recipientId: userId,
        respondedAt: new Date(),
      },
    });

    return {
      message: 'Convite recusado',
    };
  }

  /**
   * Cancel an invitation (by sender)
   */
  async cancel(invitationId: string, userId: string, tenantId: string) {
    const invitation = await this.prisma.invitation.findUnique({
      where: { id: invitationId },
    });

    if (!invitation) {
      throw new NotFoundException('Convite não encontrado');
    }

    if (invitation.tenantId !== tenantId) {
      throw new ForbiddenException('Este convite não pertence ao seu estabelecimento');
    }

    // Validate sender has permission
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { tenantId: true, role: true },
    });

    if (user?.tenantId !== tenantId) {
      throw new ForbiddenException('Você não pertence a este estabelecimento');
    }

    if (user.role !== UserRole.OWNER && user.role !== UserRole.ADMIN && invitation.senderId !== userId) {
      throw new ForbiddenException('Você não tem permissão para cancelar este convite');
    }

    if (invitation.status !== InvitationStatus.PENDING) {
      throw new BadRequestException('Este convite já foi respondido');
    }

    await this.prisma.invitation.update({
      where: { id: invitationId },
      data: {
        status: InvitationStatus.CANCELLED,
      },
    });

    return {
      message: 'Convite cancelado',
    };
  }

  /**
   * Get invitation by token (for email link)
   */
  async findByToken(token: string) {
    const invitation = await this.prisma.invitation.findUnique({
      where: { token },
      include: {
        tenant: {
          select: {
            id: true,
            name: true,
            logoUrl: true,
          },
        },
        sender: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    if (!invitation) {
      throw new NotFoundException('Convite não encontrado');
    }

    return invitation;
  }
}
