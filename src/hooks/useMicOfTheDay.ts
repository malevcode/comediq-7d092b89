import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { useOpenMics } from '@/hooks/useOpenMics';
import { OpenMic } from '@/types/openMic';

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

export type MotdSource = 'admin_lock' | 'nomination' | 'weekly_default' | 'auto_pick' | 'unknown';

// MOTD disabled to eliminate Supabase egress until billing cycle resets
export function useMicOfTheDay() {
  const today = getTodayNY();

  const query = useQuery({
    queryKey: ['micOfTheDay', 'disabled', today],
    queryFn: async () => ({ winner: null as string | null, source: 'unknown' as MotdSource }),
    staleTime: Infinity,
  });

  return { ...query, mic: null as OpenMic | null, source: 'unknown' as MotdSource, claimDate: today };
}

export function useClaimMicOfTheDay() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (_micUniqueIdentifier: string) => {
      throw new Error('MOTD temporarily disabled to conserve database quota');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['micOfTheDay'] });
    },
  });
}
