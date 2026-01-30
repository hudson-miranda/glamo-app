import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  marketingService,
  CampaignQuery,
  ReviewQuery,
  Campaign,
} from '@/services/marketing.service';

export const marketingKeys = {
  all: ['marketing'] as const,
  summary: () => [...marketingKeys.all, 'summary'] as const,
  campaigns: () => [...marketingKeys.all, 'campaigns'] as const,
  campaignList: (query?: CampaignQuery) => [...marketingKeys.campaigns(), 'list', query] as const,
  campaign: (id: string) => [...marketingKeys.campaigns(), id] as const,
  loyalty: () => [...marketingKeys.all, 'loyalty'] as const,
  reviews: () => [...marketingKeys.all, 'reviews'] as const,
  reviewList: (query?: ReviewQuery) => [...marketingKeys.reviews(), 'list', query] as const,
  segments: () => [...marketingKeys.all, 'segments'] as const,
};

// Summary
export function useMarketingSummary() {
  return useQuery({
    queryKey: marketingKeys.summary(),
    queryFn: () => marketingService.getSummary(),
  });
}

// Campaigns
export function useCampaigns(query?: CampaignQuery) {
  return useQuery({
    queryKey: marketingKeys.campaignList(query),
    queryFn: () => marketingService.listCampaigns(query),
  });
}

export function useCampaign(id: string) {
  return useQuery({
    queryKey: marketingKeys.campaign(id),
    queryFn: () => marketingService.getCampaign(id),
    enabled: !!id,
  });
}

export function useCreateCampaign() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: Partial<Campaign>) => marketingService.createCampaign(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: marketingKeys.campaigns() });
    },
  });
}

export function useUpdateCampaign() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Campaign> }) =>
      marketingService.updateCampaign(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: marketingKeys.campaigns() });
      queryClient.invalidateQueries({ queryKey: marketingKeys.campaign(variables.id) });
    },
  });
}

export function useDeleteCampaign() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => marketingService.deleteCampaign(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: marketingKeys.campaigns() });
    },
  });
}

export function useSendCampaign() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => marketingService.sendCampaign(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: marketingKeys.campaign(id) });
      queryClient.invalidateQueries({ queryKey: marketingKeys.campaigns() });
    },
  });
}

// Loyalty
export function useLoyaltyProgram() {
  return useQuery({
    queryKey: marketingKeys.loyalty(),
    queryFn: () => marketingService.getLoyaltyProgram(),
  });
}

export function useUpdateLoyaltyProgram() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: marketingService.updateLoyaltyProgram,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: marketingKeys.loyalty() });
    },
  });
}

// Reviews
export function useReviews(query?: ReviewQuery) {
  return useQuery({
    queryKey: marketingKeys.reviewList(query),
    queryFn: () => marketingService.listReviews(query),
  });
}

export function useReplyToReview() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, reply }: { id: string; reply: string }) =>
      marketingService.replyToReview(id, reply),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: marketingKeys.reviews() });
    },
  });
}

export function useUpdateReviewStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: 'approved' | 'hidden' }) =>
      marketingService.updateReviewStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: marketingKeys.reviews() });
    },
  });
}

// Segments
export function useCustomerSegments() {
  return useQuery({
    queryKey: marketingKeys.segments(),
    queryFn: () => marketingService.getSegments(),
  });
}

export function useCreateSegment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: marketingService.createSegment,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: marketingKeys.segments() });
    },
  });
}
