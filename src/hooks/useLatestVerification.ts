import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export const useLatestVerification = (micUniqueIdentifier?: string) => {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['latestVerification', micUniqueIdentifier],
    queryFn: async () => {
      if (!micUniqueIdentifier) return null;
      
      const { data, error } = await supabase
        .from('mic_verifications')
        .select('verified_at')
        .eq('mic_unique_identifier', micUniqueIdentifier)
        .order('verified_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      return data?.verified_at || null;
    },
    enabled: !!micUniqueIdentifier,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const invalidate = () => {
    queryClient.invalidateQueries({ 
      queryKey: ['latestVerification', micUniqueIdentifier] 
    });
  };

  return {
    latestVerification: query.data,
    isLoading: query.isLoading,
    invalidate,
  };
};
