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

const MOTD_UNIQUE_ID = '41aab682-878f-4c2e-a304-f568ebb719cc';

export function useMicOfTheDay() {
  const today = getTodayNY();
  const { data: mics } = useOpenMics();

  const mic = mics?.find((m) => m.uniqueIdentifier === MOTD_UNIQUE_ID) ?? null;

  const query = useQuery({
    queryKey: ['micOfTheDay', today],
    queryFn: async () => ({ winner: MOTD_UNIQUE_ID, source: 'admin_lock' as MotdSource }),
    staleTime: Infinity,
  });

  return { ...query, mic, source: 'admin_lock' as MotdSource, claimDate: today };
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
