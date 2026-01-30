import {
  Controller,
  Post,
  Get,
  Patch,
  Body,
  Param,
  UseGuards,
  Request,
} from '@nestjs/common';
import { TenantsService, CreateTenantDto } from './tenants.service';
import { JwtAuthGuard } from '@/modules/auth/guards/jwt-auth.guard';
import { SkipTenantCheck } from '@/core/tenancy/decorators';

@Controller('tenants')
@SkipTenantCheck()
export class TenantsController {
  constructor(private readonly tenantsService: TenantsService) {}

  /**
   * Create a new tenant (establishment)
   * User must be authenticated
   */
  @Post()
  @UseGuards(JwtAuthGuard)
  async create(@Request() req: any, @Body() dto: CreateTenantDto) {
    const userId = req.user.sub;
    return this.tenantsService.create(userId, dto);
  }

  /**
   * Get current user's tenants
   */
  @Get('my-tenants')
  @UseGuards(JwtAuthGuard)
  async getMyTenants(@Request() req: any) {
    const userId = req.user.sub;
    return this.tenantsService.findUserTenants(userId);
  }

  /**
   * Get tenant by ID
   */
  @Get(':id')
  @UseGuards(JwtAuthGuard)
  async findById(@Param('id') id: string) {
    return this.tenantsService.findById(id);
  }

  /**
   * Get tenant by slug (for public booking pages)
   */
  @Get('slug/:slug')
  async findBySlug(@Param('slug') slug: string) {
    return this.tenantsService.findBySlug(slug);
  }

  /**
   * Update tenant
   */
  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  async update(
    @Param('id') id: string,
    @Request() req: any,
    @Body() dto: Partial<CreateTenantDto>,
  ) {
    const userId = req.user.sub;
    return this.tenantsService.update(id, userId, dto);
  }
}
