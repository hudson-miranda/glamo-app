import api from '@/lib/api';
import { PaginatedResponse } from './appointments.service';

export interface Campaign {
  id: string;
  name: string;
  description?: string;
  type: 'email' | 'sms' | 'whatsapp' | 'push';
  status: 'draft' | 'scheduled' | 'active' | 'completed' | 'paused';
  targetAudience: {
    type: 'all' | 'segment' | 'custom';
    segmentId?: string;
    customerIds?: string[];
    filters?: Record<string, any>;
  };
  content: {
    subject?: string;
    body: string;
    template?: string;
  };
  scheduledAt?: string;
  sentAt?: string;
  stats?: CampaignStats;
  createdAt: string;
}

export interface CampaignStats {
  sent: number;
  delivered: number;
  opened: number;
  clicked: number;
  converted: number;
  unsubscribed: number;
}

export interface LoyaltyProgram {
  id: string;
  name: string;
  description?: string;
  type: 'points' | 'visits' | 'cashback';
  isActive: boolean;
  rules: LoyaltyRule[];
  rewards: LoyaltyReward[];
}

export interface LoyaltyRule {
  id: string;
  type: 'earning' | 'bonus';
  condition: string;
  value: number;
  description: string;
}

export interface LoyaltyReward {
  id: string;
  name: string;
  description?: string;
  pointsCost: number;
  type: 'discount' | 'service' | 'product' | 'gift';
  value?: number;
  isActive: boolean;
}

export interface Review {
  id: string;
  customerId: string;
  customer: { id: string; name: string };
  appointmentId?: string;
  professionalId?: string;
  professional?: { id: string; name: string };
  rating: number;
  comment?: string;
  reply?: string;
  repliedAt?: string;
  status: 'pending' | 'approved' | 'hidden';
  source: 'app' | 'web' | 'google' | 'facebook';
  createdAt: string;
}

export interface MarketingSummary {
  campaigns: { active: number; scheduled: number; completed: number };
  loyalty: { totalMembers: number; pointsIssued: number; pointsRedeemed: number };
  reviews: { average: number; total: number; pending: number };
}

export interface CampaignQuery {
  page?: number;
  limit?: number;
  type?: string;
  status?: string;
}

export interface ReviewQuery {
  page?: number;
  limit?: number;
  status?: string;
  rating?: number;
  startDate?: string;
  endDate?: string;
}

export const marketingService = {
  // Summary
  async getSummary(): Promise<MarketingSummary> {
    const response = await api.get<MarketingSummary>('/marketing/summary');
    return response.data;
  },

  // Campaigns
  async listCampaigns(query?: CampaignQuery): Promise<PaginatedResponse<Campaign>> {
    const response = await api.get<PaginatedResponse<Campaign>>('/marketing/campaigns', {
      params: query,
    });
    return response.data;
  },

  async getCampaign(id: string): Promise<Campaign> {
    const response = await api.get<Campaign>(`/marketing/campaigns/${id}`);
    return response.data;
  },

  async createCampaign(data: Partial<Campaign>): Promise<Campaign> {
    const response = await api.post<Campaign>('/marketing/campaigns', data);
    return response.data;
  },

  async updateCampaign(id: string, data: Partial<Campaign>): Promise<Campaign> {
    const response = await api.patch<Campaign>(`/marketing/campaigns/${id}`, data);
    return response.data;
  },

  async deleteCampaign(id: string): Promise<void> {
    await api.delete(`/marketing/campaigns/${id}`);
  },

  async sendCampaign(id: string): Promise<void> {
    await api.post(`/marketing/campaigns/${id}/send`);
  },

  async pauseCampaign(id: string): Promise<void> {
    await api.post(`/marketing/campaigns/${id}/pause`);
  },

  // Loyalty
  async getLoyaltyProgram(): Promise<LoyaltyProgram | null> {
    const response = await api.get<LoyaltyProgram | null>('/marketing/loyalty');
    return response.data;
  },

  async updateLoyaltyProgram(data: Partial<LoyaltyProgram>): Promise<LoyaltyProgram> {
    const response = await api.patch<LoyaltyProgram>('/marketing/loyalty', data);
    return response.data;
  },

  async addLoyaltyReward(data: Partial<LoyaltyReward>): Promise<LoyaltyReward> {
    const response = await api.post<LoyaltyReward>('/marketing/loyalty/rewards', data);
    return response.data;
  },

  async updateLoyaltyReward(id: string, data: Partial<LoyaltyReward>): Promise<LoyaltyReward> {
    const response = await api.patch<LoyaltyReward>(`/marketing/loyalty/rewards/${id}`, data);
    return response.data;
  },

  async deleteLoyaltyReward(id: string): Promise<void> {
    await api.delete(`/marketing/loyalty/rewards/${id}`);
  },

  // Reviews
  async listReviews(query?: ReviewQuery): Promise<PaginatedResponse<Review>> {
    const response = await api.get<PaginatedResponse<Review>>('/marketing/reviews', {
      params: query,
    });
    return response.data;
  },

  async replyToReview(id: string, reply: string): Promise<Review> {
    const response = await api.post<Review>(`/marketing/reviews/${id}/reply`, { reply });
    return response.data;
  },

  async updateReviewStatus(id: string, status: 'approved' | 'hidden'): Promise<Review> {
    const response = await api.patch<Review>(`/marketing/reviews/${id}`, { status });
    return response.data;
  },

  // Segments
  async getSegments(): Promise<{ id: string; name: string; customerCount: number }[]> {
    const response = await api.get<{ data: { id: string; name: string; customerCount: number }[] }>(
      '/marketing/segments'
    );
    return response.data.data;
  },

  async createSegment(data: { name: string; filters: Record<string, any> }): Promise<{ id: string; name: string }> {
    const response = await api.post<{ id: string; name: string }>('/marketing/segments', data);
    return response.data;
  },

  async deleteSegment(id: string): Promise<void> {
    await api.delete(`/marketing/segments/${id}`);
  },
};
