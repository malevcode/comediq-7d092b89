import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchGrowthOpportunities, submitGrowthOpportunity, type GrowthOpportunityType } from "@/api/growthOpportunities";

export function useGrowthOpportunities(type?: GrowthOpportunityType) {
  return useQuery({
    queryKey: ['growth-opportunities', type],
    queryFn: () => fetchGrowthOpportunities(type),
  });
}

export function useSubmitOpportunity() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: submitGrowthOpportunity,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['growth-opportunities'] });
    },
  });
}
