import {
  Controller,
  Post,
  Get,
  Delete,
  Body,
  Param,
  UseGuards,
  Request,
} from '@nestjs/common';
import { InvitationsService, CreateInvitationDto } from './invitations.service';
import { JwtAuthGuard } from '@/modules/auth/guards/jwt-auth.guard';
import { SkipTenantCheck } from '@/core/tenancy/decorators';

@Controller('invitations')
@SkipTenantCheck()
export class InvitationsController {
  constructor(private readonly invitationsService: InvitationsService) {}

  /**
   * Create a new invitation
   * Requires tenant context from authenticated user
   */
  @Post()
  @UseGuards(JwtAuthGuard)
  async create(@Request() req: any, @Body() dto: CreateInvitationDto) {
    const userId = req.user.sub;
    const tenantId = req.user.tenantId;

    if (!tenantId) {
      throw new Error('Você precisa ter um estabelecimento para enviar convites');
    }

    return this.invitationsService.create(userId, tenantId, dto);
  }

  /**
   * Get invitations received by current user
   */
  @Get('received')
  @UseGuards(JwtAuthGuard)
  async getReceived(@Request() req: any) {
    const userId = req.user.sub;
    const email = req.user.email;
    return this.invitationsService.getReceivedInvitations(userId, email);
  }

  /**
   * Get invitations sent by current tenant
   */
  @Get('sent')
  @UseGuards(JwtAuthGuard)
  async getSent(@Request() req: any) {
    const userId = req.user.sub;
    const tenantId = req.user.tenantId;

    if (!tenantId) {
      return [];
    }

    return this.invitationsService.getTenantInvitations(tenantId, userId);
  }

  /**
   * Get invitation by token (public endpoint for email links)
   */
  @Get('token/:token')
  async getByToken(@Param('token') token: string) {
    return this.invitationsService.findByToken(token);
  }

  /**
   * Accept an invitation
   */
  @Post(':id/accept')
  @UseGuards(JwtAuthGuard)
  async accept(@Param('id') id: string, @Request() req: any) {
    const userId = req.user.sub;
    return this.invitationsService.accept(id, userId);
  }

  /**
   * Reject an invitation
   */
  @Post(':id/reject')
  @UseGuards(JwtAuthGuard)
  async reject(@Param('id') id: string, @Request() req: any) {
    const userId = req.user.sub;
    return this.invitationsService.reject(id, userId);
  }

  /**
   * Cancel an invitation (sender only)
   */
  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  async cancel(@Param('id') id: string, @Request() req: any) {
    const userId = req.user.sub;
    const tenantId = req.user.tenantId;

    if (!tenantId) {
      throw new Error('Você precisa ter um estabelecimento para cancelar convites');
    }

    return this.invitationsService.cancel(id, userId, tenantId);
  }
}
