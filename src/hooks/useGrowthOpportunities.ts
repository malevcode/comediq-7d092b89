import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  fetchGrowthOpportunities,
  fetchAllGrowthOpportunities,
  fetchMySubmissions,
  submitGrowthOpportunity,
  updateGrowthOpportunity,
  deleteGrowthOpportunity,
  type GrowthOpportunityType,
} from "@/api/pb/growthOpportunities";

export function useGrowthOpportunities(type?: GrowthOpportunityType) {
  return useQuery({
    queryKey: ['growth-opportunities', type],
    queryFn: () => fetchGrowthOpportunities(type),
  });
}

export function useAllGrowthOpportunities() {
  return useQuery({
    queryKey: ['growth-opportunities-all'],
    queryFn: fetchAllGrowthOpportunities,
  });
}

export function useMyGrowthSubmissions(userId?: string) {
  return useQuery({
    queryKey: ['growth-opportunities-mine', userId],
    queryFn: () => fetchMySubmissions(userId!),
    enabled: !!userId,
  });
}

export function useSubmitOpportunity() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: submitGrowthOpportunity,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['growth-opportunities'] });
      queryClient.invalidateQueries({ queryKey: ['growth-opportunities-mine'] });
    },
  });
}

export function useUpdateOpportunity() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: any }) => updateGrowthOpportunity(id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['growth-opportunities'] });
      queryClient.invalidateQueries({ queryKey: ['growth-opportunities-all'] });
      queryClient.invalidateQueries({ queryKey: ['growth-opportunities-mine'] });
    },
  });
}

export function useDeleteOpportunity() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteGrowthOpportunity,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['growth-opportunities'] });
      queryClient.invalidateQueries({ queryKey: ['growth-opportunities-all'] });
      queryClient.invalidateQueries({ queryKey: ['growth-opportunities-mine'] });
    },
  });
}
