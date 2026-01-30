import { Injectable } from '@nestjs/common';
import { PrismaService } from '@glamo/database';
import { TenantContext } from '@/core/tenancy';
import {
  CampaignQueryDto,
  CouponQueryDto,
  LoyaltyMemberQueryDto,
  LoyaltyTransactionQueryDto,
  ReferralQueryDto,
} from '../dto';
import { CampaignStatus, CouponStatus, ReferralStatus, LoyaltyTransactionType } from '../interfaces';

@Injectable()
export class MarketingRepository {
  constructor(
    private readonly prisma: PrismaService,
    private readonly tenantContext: TenantContext,
  ) {}

  private get tenantId(): string {
    return this.tenantContext.requireTenantId();
  }

  // ========================
  // CAMPAIGNS
  // ========================

  async createCampaign(data: any) {
    return this.prisma.campaign.create({
      data: { ...data, tenantId: this.tenantId },
    });
  }

  async findCampaignById(id: string) {
    return this.prisma.campaign.findFirst({
      where: { id, tenantId: this.tenantId },
    });
  }

  async findCampaigns(query: CampaignQueryDto) {
    const { type, status, search, tag, startDate, endDate, page = 1, limit = 20 } = query;

    const where: any = { tenantId: this.tenantId };

    if (type) where.type = type;
    if (status) where.status = status;
    if (tag) where.tags = { has: tag };

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = new Date(startDate);
      if (endDate) where.createdAt.lte = new Date(endDate);
    }

    const [data, total] = await Promise.all([
      this.prisma.campaign.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.campaign.count({ where }),
    ]);

    return {
      data,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  async updateCampaign(id: string, data: any) {
    return this.prisma.campaign.update({
      where: { id },
      data,
    });
  }

  async deleteCampaign(id: string) {
    return this.prisma.campaign.delete({ where: { id } });
  }

  // ========================
  // COUPONS
  // ========================

  async createCoupon(data: any) {
    return this.prisma.coupon.create({
      data: { ...data, tenantId: this.tenantId },
    });
  }

  async findCouponById(id: string) {
    return this.prisma.coupon.findFirst({
      where: { id, tenantId: this.tenantId },
    });
  }

  async findCouponByCode(code: string) {
    return this.prisma.coupon.findFirst({
      where: { code: code.toUpperCase(), tenantId: this.tenantId },
    });
  }

  async findCoupons(query: CouponQueryDto) {
    const { type, status, search, campaignId, page = 1, limit = 20 } = query;

    const where: any = { tenantId: this.tenantId };

    if (type) where.type = type;
    if (status) where.status = status;
    if (campaignId) where.campaignId = campaignId;

    if (search) {
      where.OR = [
        { code: { contains: search, mode: 'insensitive' } },
        { name: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [data, total] = await Promise.all([
      this.prisma.coupon.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.coupon.count({ where }),
    ]);

    return {
      data,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  async updateCoupon(id: string, data: any) {
    return this.prisma.coupon.update({
      where: { id },
      data,
    });
  }

  async createCouponRedemption(data: any) {
    return this.prisma.couponRedemption.create({
      data: { ...data, tenantId: this.tenantId },
    });
  }

  async countCouponRedemptions(couponId: string, customerId?: string) {
    const where: any = { tenantId: this.tenantId, couponId };
    if (customerId) where.customerId = customerId;
    return this.prisma.couponRedemption.count({ where });
  }

  // ========================
  // LOYALTY PROGRAM
  // ========================

  async createLoyaltyProgram(data: any) {
    return this.prisma.loyaltyProgram.create({
      data: { ...data, tenantId: this.tenantId },
    });
  }

  async findActiveLoyaltyProgram() {
    return this.prisma.loyaltyProgram.findFirst({
      where: { tenantId: this.tenantId, isActive: true },
    });
  }

  async findLoyaltyProgramById(id: string) {
    return this.prisma.loyaltyProgram.findFirst({
      where: { id, tenantId: this.tenantId },
    });
  }

  async updateLoyaltyProgram(id: string, data: any) {
    return this.prisma.loyaltyProgram.update({
      where: { id },
      data,
    });
  }

  // ========================
  // CUSTOMER LOYALTY
  // ========================

  async createCustomerLoyalty(data: any) {
    return this.prisma.customerLoyalty.create({
      data: { ...data, tenantId: this.tenantId },
    });
  }

  async findCustomerLoyalty(customerId: string) {
    return this.prisma.customerLoyalty.findFirst({
      where: { tenantId: this.tenantId, customerId },
    });
  }

  async findLoyaltyMembers(query: LoyaltyMemberQueryDto) {
    const { tier, minPoints, search, page = 1, limit = 20 } = query;

    const where: any = { tenantId: this.tenantId };

    if (tier) where.currentTier = tier;
    if (minPoints) where.currentPoints = { gte: minPoints };

    const [data, total] = await Promise.all([
      this.prisma.customerLoyalty.findMany({
        where,
        include: { customer: { select: { id: true, name: true, email: true } } },
        orderBy: { currentPoints: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.customerLoyalty.count({ where }),
    ]);

    return {
      data,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  async updateCustomerLoyalty(id: string, data: any) {
    return this.prisma.customerLoyalty.update({
      where: { id },
      data,
    });
  }

  // ========================
  // LOYALTY TRANSACTIONS
  // ========================

  async createLoyaltyTransaction(data: any) {
    return this.prisma.loyaltyTransaction.create({
      data: { ...data, tenantId: this.tenantId },
    });
  }

  async findLoyaltyTransactions(query: LoyaltyTransactionQueryDto) {
    const { customerId, type, startDate, endDate, page = 1, limit = 50 } = query;

    const where: any = { tenantId: this.tenantId };

    if (customerId) where.customerId = customerId;
    if (type) where.type = type;

    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = new Date(startDate);
      if (endDate) where.createdAt.lte = new Date(endDate);
    }

    const [data, total] = await Promise.all([
      this.prisma.loyaltyTransaction.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.loyaltyTransaction.count({ where }),
    ]);

    return {
      data,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  // ========================
  // REFERRAL PROGRAM
  // ========================

  async createReferralProgram(data: any) {
    return this.prisma.referralProgram.create({
      data: { ...data, tenantId: this.tenantId },
    });
  }

  async findActiveReferralProgram() {
    return this.prisma.referralProgram.findFirst({
      where: { tenantId: this.tenantId, isActive: true },
    });
  }

  async findReferralProgramById(id: string) {
    return this.prisma.referralProgram.findFirst({
      where: { id, tenantId: this.tenantId },
    });
  }

  async updateReferralProgram(id: string, data: any) {
    return this.prisma.referralProgram.update({
      where: { id },
      data,
    });
  }

  // ========================
  // REFERRALS
  // ========================

  async createReferral(data: any) {
    return this.prisma.referral.create({
      data: { ...data, tenantId: this.tenantId },
    });
  }

  async findReferralById(id: string) {
    return this.prisma.referral.findFirst({
      where: { id, tenantId: this.tenantId },
    });
  }

  async findReferralByCode(code: string) {
    return this.prisma.referral.findFirst({
      where: { referralCode: code, tenantId: this.tenantId },
    });
  }

  async findReferrals(query: ReferralQueryDto) {
    const { status, referrerId, page = 1, limit = 20 } = query;

    const where: any = { tenantId: this.tenantId };

    if (status) where.status = status;
    if (referrerId) where.referrerCustomerId = referrerId;

    const [data, total] = await Promise.all([
      this.prisma.referral.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.referral.count({ where }),
    ]);

    return {
      data,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  async countReferralsByReferrer(referrerId: string) {
    return this.prisma.referral.count({
      where: {
        tenantId: this.tenantId,
        referrerCustomerId: referrerId,
        status: { in: [ReferralStatus.COMPLETED, ReferralStatus.REWARDED] },
      },
    });
  }

  async updateReferral(id: string, data: any) {
    return this.prisma.referral.update({
      where: { id },
      data,
    });
  }

  // ========================
  // SEGMENTS
  // ========================

  async createSegment(data: any) {
    return this.prisma.customerSegment.create({
      data: { ...data, tenantId: this.tenantId },
    });
  }

  async findSegmentById(id: string) {
    return this.prisma.customerSegment.findFirst({
      where: { id, tenantId: this.tenantId },
    });
  }

  async findSegments() {
    return this.prisma.customerSegment.findMany({
      where: { tenantId: this.tenantId },
      orderBy: { name: 'asc' },
    });
  }

  async updateSegment(id: string, data: any) {
    return this.prisma.customerSegment.update({
      where: { id },
      data,
    });
  }

  async deleteSegment(id: string) {
    return this.prisma.customerSegment.delete({ where: { id } });
  }

  // ========================
  // STATS
  // ========================

  async getCampaignStats() {
    const campaigns = await this.prisma.campaign.groupBy({
      by: ['status'],
      where: { tenantId: this.tenantId },
      _count: true,
    });

    return campaigns;
  }

  async getCouponStats() {
    const active = await this.prisma.coupon.count({
      where: { tenantId: this.tenantId, status: CouponStatus.ACTIVE },
    });

    const redemptions = await this.prisma.couponRedemption.aggregate({
      where: { tenantId: this.tenantId },
      _count: true,
      _sum: { discountAmount: true },
    });

    return {
      active,
      totalRedemptions: redemptions._count,
      totalDiscount: redemptions._sum.discountAmount || 0,
    };
  }

  async getLoyaltyStats() {
    const members = await this.prisma.customerLoyalty.aggregate({
      where: { tenantId: this.tenantId },
      _count: true,
      _sum: { lifetimePoints: true, redeemedPoints: true },
      _avg: { currentPoints: true },
    });

    return {
      activeMembers: members._count,
      totalPointsIssued: members._sum.lifetimePoints || 0,
      totalPointsRedeemed: members._sum.redeemedPoints || 0,
      avgPointsPerMember: Math.round(members._avg.currentPoints || 0),
    };
  }

  async getReferralStats() {
    const referrals = await this.prisma.referral.groupBy({
      by: ['status'],
      where: { tenantId: this.tenantId },
      _count: true,
    });

    const total = referrals.reduce((sum, r) => sum + r._count, 0);
    const completed = referrals.find((r) => r.status === ReferralStatus.COMPLETED)?._count || 0;

    return {
      totalReferrals: total,
      completedReferrals: completed,
      conversionRate: total > 0 ? (completed / total) * 100 : 0,
    };
  }
}
