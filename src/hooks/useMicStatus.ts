import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export type MicStatusType = 'verified' | 'unverified' | 'cancelled';

interface MicStatusData {
  status: MicStatusType;
  updatedAt: string;
}

const isMicStatus = (status: string | null | undefined): status is MicStatusType =>
  status === 'verified' || status === 'unverified' || status === 'cancelled';

export const useMicStatus = (micUniqueIdentifier?: string) => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const queryKey = ['mic-status', micUniqueIdentifier];

  const query = useQuery({
    queryKey,
    queryFn: async (): Promise<MicStatusData | null> => {
      if (!micUniqueIdentifier) return null;

      const { data, error } = await supabase
        .from('mic_verifications')
        .select('status, verified_at')
        .eq('mic_unique_identifier', micUniqueIdentifier)
        .order('verified_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      if (!data) return null;

      return {
        status: isMicStatus(data.status) ? data.status : 'verified',
        updatedAt: data.verified_at,
      };
    },
    enabled: !!micUniqueIdentifier,
    staleTime: 5 * 60 * 1000,
  });

  const updateStatusMutation = useMutation({
    mutationFn: async (newStatus: MicStatusType): Promise<MicStatusData> => {
      if (!micUniqueIdentifier) throw new Error('Missing mic identifier');

      const { data, error } = await supabase.functions.invoke('verify-mic', {
        body: {
          mic_unique_identifier: micUniqueIdentifier,
          status: newStatus,
        },
      });

      if (error) throw new Error(error.message || 'Failed to update mic status');
      if (data?.error) throw new Error(data.details || data.error);

      return {
        status: isMicStatus(data?.status) ? data.status : newStatus,
        updatedAt: data?.verifiedAt || new Date().toISOString(),
      };
    },
    onMutate: async (newStatus) => {
      await queryClient.cancelQueries({ queryKey });
      const previous = queryClient.getQueryData<MicStatusData | null>(queryKey);

      queryClient.setQueryData<MicStatusData>(queryKey, {
        status: newStatus,
        updatedAt: new Date().toISOString(),
      });

      return { previous };
    },
    onError: (error, _newStatus, context) => {
      queryClient.setQueryData(queryKey, context?.previous ?? null);
      toast({
        title: "Couldn't update mic status",
        description: error instanceof Error ? error.message : 'Please try again.',
        variant: 'destructive',
      });
    },
    onSuccess: (data) => {
      queryClient.setQueryData(queryKey, data);
      queryClient.invalidateQueries({ queryKey: ['latestVerification', micUniqueIdentifier] });
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey });
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
