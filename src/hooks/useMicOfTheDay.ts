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
}

export function useMicOfTheDay() {
  const { data: mics = [] } = useOpenMics();
  const today = getTodayNY();

  const query = useQuery({
    queryKey: ['micOfTheDay', today],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('mic_of_the_day')
        .select('*')
        .eq('claim_date', today)
        .maybeSingle();
      if (error) throw error;
      return data as MicOfTheDayRow | null;
    },
    staleTime: 5 * 60 * 1000,
  });

  const mic: OpenMic | null = query.data
    ? mics.find((m) => m.uniqueIdentifier === query.data!.mic_unique_identifier) || null
    : null;

  return { ...query, mic, claimDate: today };
}

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
