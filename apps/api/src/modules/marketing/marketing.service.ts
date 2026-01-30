import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { MarketingRepository } from './repositories';
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
import {
  CampaignStatus,
  CouponStatus,
  CouponType,
  LoyaltyTransactionType,
  LoyaltyTierType,
  ReferralStatus,
  MarketingStats,
} from './interfaces';
import { v4 as uuidv4 } from 'uuid';
import { addDays } from 'date-fns';

@Injectable()
export class MarketingService {
  private readonly logger = new Logger(MarketingService.name);

  constructor(
    private readonly repository: MarketingRepository,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  // ========================
  // CAMPAIGNS
  // ========================

  async createCampaign(dto: CreateCampaignDto, userId: string): Promise<any> {
    const campaign = await this.repository.createCampaign({
      ...dto,
      status: CampaignStatus.DRAFT,
      stats: {
        totalRecipients: 0,
        sent: 0,
        delivered: 0,
        opened: 0,
        clicked: 0,
        converted: 0,
        bounced: 0,
        unsubscribed: 0,
        complained: 0,
        openRate: 0,
        clickRate: 0,
        conversionRate: 0,
        revenue: 0,
      },
      createdBy: userId,
    });

    this.eventEmitter.emit('marketing.campaign_created', { campaign });

    return campaign;
  }

  async findCampaigns(query: CampaignQueryDto) {
    return this.repository.findCampaigns(query);
  }

  async findCampaignById(id: string): Promise<any> {
    const campaign = await this.repository.findCampaignById(id);
    if (!campaign) {
      throw new NotFoundException('Campanha não encontrada');
    }
    return campaign;
  }

  async updateCampaign(id: string, dto: UpdateCampaignDto): Promise<any> {
    const campaign = await this.findCampaignById(id);

    if (campaign.status !== CampaignStatus.DRAFT) {
      throw new BadRequestException('Apenas campanhas em rascunho podem ser editadas');
    }

    return this.repository.updateCampaign(id, dto);
  }

  async startCampaign(id: string): Promise<any> {
    const campaign = await this.findCampaignById(id);

    if (campaign.status !== CampaignStatus.DRAFT && campaign.status !== CampaignStatus.SCHEDULED) {
      throw new BadRequestException('Campanha não pode ser iniciada');
    }

    const updated = await this.repository.updateCampaign(id, {
      status: CampaignStatus.ACTIVE,
      startedAt: new Date(),
    });

    this.eventEmitter.emit('marketing.campaign_started', { campaign: updated });

    return updated;
  }

  async pauseCampaign(id: string): Promise<any> {
    const campaign = await this.findCampaignById(id);

    if (campaign.status !== CampaignStatus.ACTIVE) {
      throw new BadRequestException('Campanha não está ativa');
    }

    return this.repository.updateCampaign(id, {
      status: CampaignStatus.PAUSED,
    });
  }

  async completeCampaign(id: string): Promise<any> {
    return this.repository.updateCampaign(id, {
      status: CampaignStatus.COMPLETED,
      completedAt: new Date(),
    });
  }

  async deleteCampaign(id: string): Promise<void> {
    const campaign = await this.findCampaignById(id);

    if (campaign.status === CampaignStatus.ACTIVE) {
      throw new BadRequestException('Não é possível deletar campanha ativa');
    }

    await this.repository.deleteCampaign(id);
  }

  // ========================
  // COUPONS
  // ========================

  async createCoupon(dto: CreateCouponDto, userId: string): Promise<any> {
    // Verificar código único
    const existing = await this.repository.findCouponByCode(dto.code);
    if (existing) {
      throw new ConflictException('Já existe um cupom com este código');
    }

    const coupon = await this.repository.createCoupon({
      ...dto,
      code: dto.code.toUpperCase(),
      status: CouponStatus.ACTIVE,
      usedCount: 0,
      totalRedemptions: 0,
      totalDiscountGiven: 0,
      validFrom: new Date(dto.validFrom),
      validTo: new Date(dto.validTo),
      createdBy: userId,
    });

    this.eventEmitter.emit('marketing.coupon_created', { coupon });

    return coupon;
  }

  async findCoupons(query: CouponQueryDto) {
    return this.repository.findCoupons(query);
  }

  async findCouponById(id: string): Promise<any> {
    const coupon = await this.repository.findCouponById(id);
    if (!coupon) {
      throw new NotFoundException('Cupom não encontrado');
    }
    return coupon;
  }

  async updateCoupon(id: string, dto: UpdateCouponDto): Promise<any> {
    await this.findCouponById(id);
    return this.repository.updateCoupon(id, dto);
  }

  async validateCoupon(dto: ValidateCouponDto): Promise<{
    valid: boolean;
    coupon?: any;
    discountAmount?: number;
    message?: string;
  }> {
    const coupon = await this.repository.findCouponByCode(dto.code);

    if (!coupon) {
      return { valid: false, message: 'Cupom não encontrado' };
    }

    // Verificar status
    if (coupon.status !== CouponStatus.ACTIVE) {
      return { valid: false, message: 'Cupom inativo' };
    }

    // Verificar validade
    const now = new Date();
    if (now < coupon.validFrom || now > coupon.validTo) {
      return { valid: false, message: 'Cupom expirado ou ainda não válido' };
    }

    // Verificar limites de uso
    if (coupon.usageLimits?.totalUses && coupon.usedCount >= coupon.usageLimits.totalUses) {
      return { valid: false, message: 'Limite de uso atingido' };
    }

    // Verificar uso por cliente
    if (dto.customerId && coupon.usageLimits?.usesPerCustomer) {
      const customerUses = await this.repository.countCouponRedemptions(coupon.id, dto.customerId);
      if (customerUses >= coupon.usageLimits.usesPerCustomer) {
        return { valid: false, message: 'Limite de uso por cliente atingido' };
      }
    }

    // Verificar valor mínimo
    if (coupon.usageLimits?.minPurchaseAmount && dto.totalAmount < coupon.usageLimits.minPurchaseAmount) {
      return {
        valid: false,
        message: `Valor mínimo de R$ ${coupon.usageLimits.minPurchaseAmount} não atingido`,
      };
    }

    // Calcular desconto
    let discountAmount = 0;
    switch (coupon.type) {
      case CouponType.PERCENTAGE:
        discountAmount = dto.totalAmount * (coupon.value / 100);
        break;
      case CouponType.FIXED:
        discountAmount = coupon.value;
        break;
    }

    // Aplicar limite máximo de desconto
    if (coupon.usageLimits?.maxDiscountAmount) {
      discountAmount = Math.min(discountAmount, coupon.usageLimits.maxDiscountAmount);
    }

    return {
      valid: true,
      coupon,
      discountAmount,
    };
  }

  async redeemCoupon(dto: RedeemCouponDto): Promise<any> {
    const validation = await this.validateCoupon({
      code: dto.code,
      customerId: dto.customerId,
      totalAmount: dto.originalAmount,
    });

    if (!validation.valid) {
      throw new BadRequestException(validation.message);
    }

    // Registrar resgate
    const redemption = await this.repository.createCouponRedemption({
      couponId: validation.coupon.id,
      couponCode: dto.code.toUpperCase(),
      customerId: dto.customerId,
      appointmentId: dto.appointmentId,
      saleId: dto.saleId,
      originalAmount: dto.originalAmount,
      discountAmount: dto.discountAmount,
      finalAmount: dto.originalAmount - dto.discountAmount,
      redeemedAt: new Date(),
    });

    // Atualizar contadores do cupom
    await this.repository.updateCoupon(validation.coupon.id, {
      usedCount: validation.coupon.usedCount + 1,
      totalRedemptions: validation.coupon.totalRedemptions + 1,
      totalDiscountGiven: validation.coupon.totalDiscountGiven + dto.discountAmount,
    });

    this.eventEmitter.emit('marketing.coupon_redeemed', { redemption });

    return redemption;
  }

  async deactivateCoupon(id: string): Promise<any> {
    await this.findCouponById(id);
    return this.repository.updateCoupon(id, {
      status: CouponStatus.INACTIVE,
    });
  }

  // ========================
  // LOYALTY PROGRAM
  // ========================

  async createLoyaltyProgram(dto: CreateLoyaltyProgramDto): Promise<any> {
    // Desativar programa existente
    const existing = await this.repository.findActiveLoyaltyProgram();
    if (existing) {
      await this.repository.updateLoyaltyProgram(existing.id, { isActive: false });
    }

    const program = await this.repository.createLoyaltyProgram({
      ...dto,
      isActive: true,
    });

    this.eventEmitter.emit('marketing.loyalty_program_created', { program });

    return program;
  }

  async findActiveLoyaltyProgram() {
    return this.repository.findActiveLoyaltyProgram();
  }

  async updateLoyaltyProgram(id: string, dto: UpdateLoyaltyProgramDto): Promise<any> {
    await this.repository.findLoyaltyProgramById(id);
    return this.repository.updateLoyaltyProgram(id, dto);
  }

  async findLoyaltyMembers(query: LoyaltyMemberQueryDto) {
    return this.repository.findLoyaltyMembers(query);
  }

  async getCustomerLoyalty(customerId: string) {
    let loyalty = await this.repository.findCustomerLoyalty(customerId);

    if (!loyalty) {
      const program = await this.repository.findActiveLoyaltyProgram();
      if (!program) {
        throw new NotFoundException('Programa de fidelidade não encontrado');
      }

      loyalty = await this.repository.createCustomerLoyalty({
        customerId,
        programId: program.id,
        currentPoints: 0,
        lifetimePoints: 0,
        redeemedPoints: 0,
        expiredPoints: 0,
        currentTier: LoyaltyTierType.BRONZE,
        tierProgress: 0,
        memberSince: new Date(),
        lastActivityAt: new Date(),
      });
    }

    return loyalty;
  }

  async earnPoints(dto: EarnPointsDto): Promise<any> {
    const loyalty = await this.getCustomerLoyalty(dto.customerId);

    const newBalance = loyalty.currentPoints + dto.points;

    // Atualizar saldo
    await this.repository.updateCustomerLoyalty(loyalty.id, {
      currentPoints: newBalance,
      lifetimePoints: loyalty.lifetimePoints + dto.points,
      lastActivityAt: new Date(),
    });

    // Registrar transação
    const transaction = await this.repository.createLoyaltyTransaction({
      customerId: dto.customerId,
      type: LoyaltyTransactionType.EARN,
      points: dto.points,
      balance: newBalance,
      description: dto.description,
      referenceType: dto.referenceType,
      referenceId: dto.referenceId,
    });

    // Verificar upgrade de tier
    await this.checkTierUpgrade(dto.customerId, newBalance);

    this.eventEmitter.emit('marketing.points_earned', { transaction });

    return transaction;
  }

  async redeemPoints(dto: RedeemPointsDto): Promise<any> {
    const loyalty = await this.getCustomerLoyalty(dto.customerId);
    const program = await this.repository.findActiveLoyaltyProgram();

    if (!program) {
      throw new NotFoundException('Programa de fidelidade não encontrado');
    }

    if (dto.points < program.minPointsRedemption) {
      throw new BadRequestException(`Mínimo de ${program.minPointsRedemption} pontos para resgate`);
    }

    if (loyalty.currentPoints < dto.points) {
      throw new BadRequestException('Pontos insuficientes');
    }

    const newBalance = loyalty.currentPoints - dto.points;
    const creditValue = dto.points * program.currencyPerPoint;

    // Atualizar saldo
    await this.repository.updateCustomerLoyalty(loyalty.id, {
      currentPoints: newBalance,
      redeemedPoints: loyalty.redeemedPoints + dto.points,
      lastActivityAt: new Date(),
    });

    // Registrar transação
    const transaction = await this.repository.createLoyaltyTransaction({
      customerId: dto.customerId,
      type: LoyaltyTransactionType.REDEEM,
      points: -dto.points,
      balance: newBalance,
      description: dto.description,
    });

    this.eventEmitter.emit('marketing.points_redeemed', { transaction, creditValue });

    return { transaction, creditValue };
  }

  async adjustPoints(dto: AdjustPointsDto): Promise<any> {
    const loyalty = await this.getCustomerLoyalty(dto.customerId);
    const newBalance = loyalty.currentPoints + dto.points;

    if (newBalance < 0) {
      throw new BadRequestException('Ajuste resultaria em saldo negativo');
    }

    await this.repository.updateCustomerLoyalty(loyalty.id, {
      currentPoints: newBalance,
      lastActivityAt: new Date(),
    });

    const transaction = await this.repository.createLoyaltyTransaction({
      customerId: dto.customerId,
      type: LoyaltyTransactionType.ADJUSTMENT,
      points: dto.points,
      balance: newBalance,
      description: dto.reason,
    });

    return transaction;
  }

  async findLoyaltyTransactions(query: LoyaltyTransactionQueryDto) {
    return this.repository.findLoyaltyTransactions(query);
  }

  private async checkTierUpgrade(customerId: string, currentPoints: number): Promise<void> {
    const program = await this.repository.findActiveLoyaltyProgram();
    if (!program?.tiers?.length) return;

    const loyalty = await this.repository.findCustomerLoyalty(customerId);
    if (!loyalty) return;

    // Encontrar tier adequado
    const sortedTiers = [...program.tiers].sort((a, b) => b.minPoints - a.minPoints);
    const newTier = sortedTiers.find((tier) => currentPoints >= tier.minPoints);

    if (newTier && newTier.type !== loyalty.currentTier) {
      await this.repository.updateCustomerLoyalty(loyalty.id, {
        currentTier: newTier.type,
      });

      this.eventEmitter.emit('marketing.tier_changed', {
        customerId,
        previousTier: loyalty.currentTier,
        newTier: newTier.type,
      });
    }
  }

  // ========================
  // REFERRAL PROGRAM
  // ========================

  async createReferralProgram(dto: CreateReferralProgramDto): Promise<any> {
    const existing = await this.repository.findActiveReferralProgram();
    if (existing) {
      await this.repository.updateReferralProgram(existing.id, { isActive: false });
    }

    const program = await this.repository.createReferralProgram({
      ...dto,
      isActive: true,
    });

    return program;
  }

  async findActiveReferralProgram() {
    return this.repository.findActiveReferralProgram();
  }

  async updateReferralProgram(id: string, dto: UpdateReferralProgramDto): Promise<any> {
    await this.repository.findReferralProgramById(id);
    return this.repository.updateReferralProgram(id, dto);
  }

  async createReferral(dto: CreateReferralDto): Promise<any> {
    const program = await this.repository.findActiveReferralProgram();
    if (!program) {
      throw new NotFoundException('Programa de indicação não encontrado');
    }

    // Verificar limite de indicações
    if (program.maxReferralsPerCustomer) {
      const count = await this.repository.countReferralsByReferrer(dto.referrerCustomerId);
      if (count >= program.maxReferralsPerCustomer) {
        throw new BadRequestException('Limite de indicações atingido');
      }
    }

    const referralCode = this.generateReferralCode();
    const expiresAt = addDays(new Date(), program.validDays);

    const referral = await this.repository.createReferral({
      programId: program.id,
      referrerCustomerId: dto.referrerCustomerId,
      refereeEmail: dto.refereeEmail,
      refereePhone: dto.refereePhone,
      referralCode,
      status: ReferralStatus.PENDING,
      referrerRewardGiven: false,
      refereeRewardGiven: false,
      expiresAt,
    });

    this.eventEmitter.emit('marketing.referral_created', { referral });

    return referral;
  }

  async findReferrals(query: ReferralQueryDto) {
    return this.repository.findReferrals(query);
  }

  async completeReferral(dto: CompleteReferralDto): Promise<any> {
    const referral = await this.repository.findReferralByCode(dto.referralCode);

    if (!referral) {
      throw new NotFoundException('Indicação não encontrada');
    }

    if (referral.status !== ReferralStatus.PENDING) {
      throw new BadRequestException('Indicação já processada ou expirada');
    }

    if (new Date() > referral.expiresAt) {
      await this.repository.updateReferral(referral.id, {
        status: ReferralStatus.EXPIRED,
      });
      throw new BadRequestException('Indicação expirada');
    }

    const updated = await this.repository.updateReferral(referral.id, {
      refereeCustomerId: dto.refereeCustomerId,
      conversionAppointmentId: dto.appointmentId,
      status: ReferralStatus.COMPLETED,
      completedAt: new Date(),
    });

    // Processar recompensas
    await this.processReferralRewards(referral.id);

    this.eventEmitter.emit('marketing.referral_completed', { referral: updated });

    return updated;
  }

  private async processReferralRewards(referralId: string): Promise<void> {
    const referral = await this.repository.findReferralById(referralId);
    if (!referral) return;

    const program = await this.repository.findReferralProgramById(referral.programId);
    if (!program) return;

    // Recompensa do indicador
    if (program.referrerReward?.type === 'POINTS') {
      await this.earnPoints({
        customerId: referral.referrerCustomerId,
        points: program.referrerReward.value,
        description: 'Bônus de indicação',
        referenceType: 'REFERRAL',
        referenceId: referral.id,
      });
    }

    // Recompensa do indicado
    if (program.refereeReward?.type === 'POINTS' && referral.refereeCustomerId) {
      await this.earnPoints({
        customerId: referral.refereeCustomerId,
        points: program.refereeReward.value,
        description: 'Bônus de boas-vindas',
        referenceType: 'REFERRAL',
        referenceId: referral.id,
      });
    }

    await this.repository.updateReferral(referralId, {
      status: ReferralStatus.REWARDED,
      referrerRewardGiven: true,
      refereeRewardGiven: !!referral.refereeCustomerId,
    });
  }

  private generateReferralCode(): string {
    return `REF-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
  }

  // ========================
  // STATS
  // ========================

  async getStats(): Promise<MarketingStats> {
    const [campaigns, coupons, loyalty, referrals] = await Promise.all([
      this.repository.getCampaignStats(),
      this.repository.getCouponStats(),
      this.repository.getLoyaltyStats(),
      this.repository.getReferralStats(),
    ]);

    return {
      campaigns: {
        total: campaigns.reduce((sum, c) => sum + c._count, 0),
        active: campaigns.find((c) => c.status === CampaignStatus.ACTIVE)?._count || 0,
        completed: campaigns.find((c) => c.status === CampaignStatus.COMPLETED)?._count || 0,
        totalSent: 0, // Seria calculado de outra forma
        avgOpenRate: 0,
        avgClickRate: 0,
      },
      coupons,
      loyalty,
      referrals,
    };
  }
}
