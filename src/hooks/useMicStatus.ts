import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export type MicStatusType = 'verified' | 'unverified' | 'cancelled';

interface MicStatusData {
  status: MicStatusType;
  updatedAt: string;
}

export const useMicStatus = (micUniqueIdentifier: string) => {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['mic-status', micUniqueIdentifier],
    queryFn: async (): Promise<MicStatusData | null> => {
      const { data, error } = await supabase
        .from('mic_verifications')
        .select('status, verified_at')
        .eq('mic_unique_identifier', micUniqueIdentifier)
        .order('verified_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      
      if (data) {
        return { 
          status: (data.status as MicStatusType) || 'unverified', 
          updatedAt: data.verified_at 
        };
      }
      return null;
    },
    enabled: !!micUniqueIdentifier,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const updateStatusMutation = useMutation({
    mutationFn: async (newStatus: MicStatusType) => {
      const response = await fetch(
        `https://cotfweyhlglpjmgqxwqx.supabase.co/functions/v1/verify-mic`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token || ''}`,
          },
          body: JSON.stringify({
            mic_unique_identifier: micUniqueIdentifier,
            status: newStatus,
          }),
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to update status');
      }

      return response.json();
    },
    onMutate: async (newStatus: MicStatusType) => {
      await queryClient.cancelQueries({ queryKey: ['mic-status', micUniqueIdentifier] });
      const previous = queryClient.getQueryData<MicStatusData | null>(['mic-status', micUniqueIdentifier]);
      queryClient.setQueryData(['mic-status', micUniqueIdentifier], {
        status: newStatus,
        updatedAt: new Date().toISOString(),
      });
      return { previous };
    },
    onError: (_err, _newStatus, context) => {
      if (context?.previous !== undefined) {
        queryClient.setQueryData(['mic-status', micUniqueIdentifier], context.previous);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mic-status', micUniqueIdentifier] });
      queryClient.invalidateQueries({ queryKey: ['latestVerification', micUniqueIdentifier] });
    },
  });

  return {
    status: query.data?.status || 'unverified',
    updatedAt: query.data?.updatedAt,
    isLoading: query.isLoading,
    updateStatus: updateStatusMutation.mutate,
    isUpdating: updateStatusMutation.isPending,
  };
};
