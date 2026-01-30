import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
  UseGuards,
  ParseUUIDPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '@/modules/auth/guards/jwt-auth.guard';
import { TenantGuard } from '@/core/tenancy/tenant.guard';
import { CurrentUser } from '@/modules/auth/decorators/current-user.decorator';
import { MarketingService } from './marketing.service';
import {
  CreateCampaignDto,
  UpdateCampaignDto,
  CreateCouponDto,
  UpdateCouponDto,
  ValidateCouponDto,
  RedeemCouponDto,
  CreateLoyaltyProgramDto,
  UpdateLoyaltyProgramDto,
  EarnPointsDto,
  RedeemPointsDto,
  AdjustPointsDto,
  CreateReferralProgramDto,
  UpdateReferralProgramDto,
  CreateReferralDto,
  CompleteReferralDto,
  CampaignQueryDto,
  CouponQueryDto,
  LoyaltyMemberQueryDto,
  LoyaltyTransactionQueryDto,
  ReferralQueryDto,
} from './dto';

@ApiTags('Marketing')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, TenantGuard)
@Controller('marketing')
export class MarketingController {
  constructor(private readonly marketingService: MarketingService) {}

  // ========================
  // CAMPAIGNS
  // ========================

  @Post('campaigns')
  @ApiOperation({ summary: 'Criar campanha' })
  @ApiResponse({ status: 201, description: 'Campanha criada' })
  async createCampaign(@Body() dto: CreateCampaignDto, @CurrentUser() user: any) {
    return this.marketingService.createCampaign(dto, user.id);
  }

  @Get('campaigns')
  @ApiOperation({ summary: 'Listar campanhas' })
  @ApiResponse({ status: 200, description: 'Lista paginada' })
  async findCampaigns(@Query() query: CampaignQueryDto) {
    return this.marketingService.findCampaigns(query);
  }

  @Get('campaigns/:id')
  @ApiOperation({ summary: 'Buscar campanha por ID' })
  @ApiParam({ name: 'id', description: 'ID da campanha' })
  @ApiResponse({ status: 200, description: 'Campanha encontrada' })
  async findCampaignById(@Param('id', ParseUUIDPipe) id: string) {
    return this.marketingService.findCampaignById(id);
  }

  @Patch('campaigns/:id')
  @ApiOperation({ summary: 'Atualizar campanha' })
  @ApiParam({ name: 'id', description: 'ID da campanha' })
  @ApiResponse({ status: 200, description: 'Campanha atualizada' })
  async updateCampaign(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateCampaignDto) {
    return this.marketingService.updateCampaign(id, dto);
  }

  @Post('campaigns/:id/start')
  @ApiOperation({ summary: 'Iniciar campanha' })
  @ApiParam({ name: 'id', description: 'ID da campanha' })
  @ApiResponse({ status: 200, description: 'Campanha iniciada' })
  async startCampaign(@Param('id', ParseUUIDPipe) id: string) {
    return this.marketingService.startCampaign(id);
  }

  @Post('campaigns/:id/pause')
  @ApiOperation({ summary: 'Pausar campanha' })
  @ApiParam({ name: 'id', description: 'ID da campanha' })
  @ApiResponse({ status: 200, description: 'Campanha pausada' })
  async pauseCampaign(@Param('id', ParseUUIDPipe) id: string) {
    return this.marketingService.pauseCampaign(id);
  }

  @Delete('campaigns/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Deletar campanha' })
  @ApiParam({ name: 'id', description: 'ID da campanha' })
  @ApiResponse({ status: 204, description: 'Deletada' })
  async deleteCampaign(@Param('id', ParseUUIDPipe) id: string) {
    return this.marketingService.deleteCampaign(id);
  }

  // ========================
  // COUPONS
  // ========================

  @Post('coupons')
  @ApiOperation({ summary: 'Criar cupom' })
  @ApiResponse({ status: 201, description: 'Cupom criado' })
  async createCoupon(@Body() dto: CreateCouponDto, @CurrentUser() user: any) {
    return this.marketingService.createCoupon(dto, user.id);
  }

  @Get('coupons')
  @ApiOperation({ summary: 'Listar cupons' })
  @ApiResponse({ status: 200, description: 'Lista paginada' })
  async findCoupons(@Query() query: CouponQueryDto) {
    return this.marketingService.findCoupons(query);
  }

  @Get('coupons/:id')
  @ApiOperation({ summary: 'Buscar cupom por ID' })
  @ApiParam({ name: 'id', description: 'ID do cupom' })
  @ApiResponse({ status: 200, description: 'Cupom encontrado' })
  async findCouponById(@Param('id', ParseUUIDPipe) id: string) {
    return this.marketingService.findCouponById(id);
  }

  @Patch('coupons/:id')
  @ApiOperation({ summary: 'Atualizar cupom' })
  @ApiParam({ name: 'id', description: 'ID do cupom' })
  @ApiResponse({ status: 200, description: 'Cupom atualizado' })
  async updateCoupon(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateCouponDto) {
    return this.marketingService.updateCoupon(id, dto);
  }

  @Post('coupons/validate')
  @ApiOperation({ summary: 'Validar cupom' })
  @ApiResponse({ status: 200, description: 'Resultado da validação' })
  async validateCoupon(@Body() dto: ValidateCouponDto) {
    return this.marketingService.validateCoupon(dto);
  }

  @Post('coupons/redeem')
  @ApiOperation({ summary: 'Resgatar cupom' })
  @ApiResponse({ status: 201, description: 'Cupom resgatado' })
  async redeemCoupon(@Body() dto: RedeemCouponDto) {
    return this.marketingService.redeemCoupon(dto);
  }

  @Post('coupons/:id/deactivate')
  @ApiOperation({ summary: 'Desativar cupom' })
  @ApiParam({ name: 'id', description: 'ID do cupom' })
  @ApiResponse({ status: 200, description: 'Cupom desativado' })
  async deactivateCoupon(@Param('id', ParseUUIDPipe) id: string) {
    return this.marketingService.deactivateCoupon(id);
  }

  // ========================
  // LOYALTY
  // ========================

  @Post('loyalty/program')
  @ApiOperation({ summary: 'Criar programa de fidelidade' })
  @ApiResponse({ status: 201, description: 'Programa criado' })
  async createLoyaltyProgram(@Body() dto: CreateLoyaltyProgramDto) {
    return this.marketingService.createLoyaltyProgram(dto);
  }

  @Get('loyalty/program')
  @ApiOperation({ summary: 'Buscar programa ativo' })
  @ApiResponse({ status: 200, description: 'Programa encontrado' })
  async findActiveLoyaltyProgram() {
    return this.marketingService.findActiveLoyaltyProgram();
  }

  @Patch('loyalty/program/:id')
  @ApiOperation({ summary: 'Atualizar programa' })
  @ApiParam({ name: 'id', description: 'ID do programa' })
  @ApiResponse({ status: 200, description: 'Programa atualizado' })
  async updateLoyaltyProgram(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateLoyaltyProgramDto,
  ) {
    return this.marketingService.updateLoyaltyProgram(id, dto);
  }

  @Get('loyalty/members')
  @ApiOperation({ summary: 'Listar membros' })
  @ApiResponse({ status: 200, description: 'Lista paginada' })
  async findLoyaltyMembers(@Query() query: LoyaltyMemberQueryDto) {
    return this.marketingService.findLoyaltyMembers(query);
  }

  @Get('loyalty/customers/:customerId')
  @ApiOperation({ summary: 'Buscar fidelidade do cliente' })
  @ApiParam({ name: 'customerId', description: 'ID do cliente' })
  @ApiResponse({ status: 200, description: 'Dados de fidelidade' })
  async getCustomerLoyalty(@Param('customerId', ParseUUIDPipe) customerId: string) {
    return this.marketingService.getCustomerLoyalty(customerId);
  }

  @Post('loyalty/earn')
  @ApiOperation({ summary: 'Ganhar pontos' })
  @ApiResponse({ status: 201, description: 'Pontos adicionados' })
  async earnPoints(@Body() dto: EarnPointsDto) {
    return this.marketingService.earnPoints(dto);
  }

  @Post('loyalty/redeem')
  @ApiOperation({ summary: 'Resgatar pontos' })
  @ApiResponse({ status: 201, description: 'Pontos resgatados' })
  async redeemPoints(@Body() dto: RedeemPointsDto) {
    return this.marketingService.redeemPoints(dto);
  }

  @Post('loyalty/adjust')
  @ApiOperation({ summary: 'Ajustar pontos' })
  @ApiResponse({ status: 201, description: 'Pontos ajustados' })
  async adjustPoints(@Body() dto: AdjustPointsDto) {
    return this.marketingService.adjustPoints(dto);
  }

  @Get('loyalty/transactions')
  @ApiOperation({ summary: 'Listar transações' })
  @ApiResponse({ status: 200, description: 'Lista paginada' })
  async findLoyaltyTransactions(@Query() query: LoyaltyTransactionQueryDto) {
    return this.marketingService.findLoyaltyTransactions(query);
  }

  // ========================
  // REFERRALS
  // ========================

  @Post('referrals/program')
  @ApiOperation({ summary: 'Criar programa de indicação' })
  @ApiResponse({ status: 201, description: 'Programa criado' })
  async createReferralProgram(@Body() dto: CreateReferralProgramDto) {
    return this.marketingService.createReferralProgram(dto);
  }

  @Get('referrals/program')
  @ApiOperation({ summary: 'Buscar programa ativo' })
  @ApiResponse({ status: 200, description: 'Programa encontrado' })
  async findActiveReferralProgram() {
    return this.marketingService.findActiveReferralProgram();
  }

  @Patch('referrals/program/:id')
  @ApiOperation({ summary: 'Atualizar programa' })
  @ApiParam({ name: 'id', description: 'ID do programa' })
  @ApiResponse({ status: 200, description: 'Programa atualizado' })
  async updateReferralProgram(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateReferralProgramDto,
  ) {
    return this.marketingService.updateReferralProgram(id, dto);
  }

  @Post('referrals')
  @ApiOperation({ summary: 'Criar indicação' })
  @ApiResponse({ status: 201, description: 'Indicação criada' })
  async createReferral(@Body() dto: CreateReferralDto) {
    return this.marketingService.createReferral(dto);
  }

  @Get('referrals')
  @ApiOperation({ summary: 'Listar indicações' })
  @ApiResponse({ status: 200, description: 'Lista paginada' })
  async findReferrals(@Query() query: ReferralQueryDto) {
    return this.marketingService.findReferrals(query);
  }

  @Post('referrals/complete')
  @ApiOperation({ summary: 'Completar indicação' })
  @ApiResponse({ status: 200, description: 'Indicação completada' })
  async completeReferral(@Body() dto: CompleteReferralDto) {
    return this.marketingService.completeReferral(dto);
  }

  // ========================
  // STATS
  // ========================

  @Get('stats')
  @ApiOperation({ summary: 'Estatísticas de marketing' })
  @ApiResponse({ status: 200, description: 'Estatísticas' })
  async getStats() {
    return this.marketingService.getStats();
  }
}
