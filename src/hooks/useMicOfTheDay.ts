import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useOpenMics } from '@/hooks/useOpenMics';
import { OpenMic } from '@/types/openMic';

// Get "today" in America/New_York as YYYY-MM-DD
function getTodayNY(): string {
  const fmt = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/New_York',
    year: 'numeric', month: '2-digit', day: '2-digit',
  });
  return fmt.format(new Date());
}

export interface MicOfTheDayRow {
  id: string;
  mic_unique_identifier: string;
  claimed_by: string;
  claim_date: string;
  claimed_at: string;
  is_admin_locked?: boolean;
}

export function useMicOfTheDay() {
  const { data: mics = [] } = useOpenMics();
  const today = getTodayNY();

  // Resolve via priority chain: admin lock -> top vote -> weekly default -> auto-pick
  const query = useQuery({
    queryKey: ['micOfTheDay', 'resolved', today],
    queryFn: async () => {
      const { data, error } = await (supabase as any).rpc('resolve_motd_for', { target_date: today });
      if (error) throw error;
      return (data as string | null) || null;
    },
    staleTime: 5 * 60 * 1000,
  });

  const mic: OpenMic | null = query.data
    ? mics.find((m) => m.uniqueIdentifier === query.data) || null
    : null;

  return { ...query, mic, claimDate: today };
}

// Legacy claim hook (kept for verified-host claim button)
export function useClaimMicOfTheDay() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (micUniqueIdentifier: string) => {
      if (!user) throw new Error('Sign in required');
      const { data, error } = await supabase
        .from('mic_of_the_day')
        .insert({
          mic_unique_identifier: micUniqueIdentifier,
          claimed_by: user.id,
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['micOfTheDay'] });
    },
  });
}
