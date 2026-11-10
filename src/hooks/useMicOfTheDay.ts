import { useMemo } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { useOpenMics } from '@/hooks/useOpenMics';
import { allFeaturedMics } from '@/config/featuredMics';
import { pickFeaturedMic } from '@/utils/featuredMic';

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

export type MotdSource = 'sponsor' | 'comediq_pick' | 'mic_of_the_month' | 'admin_lock' | 'nomination' | 'weekly_default' | 'auto_pick' | 'unknown';

/**
 * Today's featured mic: one mic that is really happening today, chosen from
 * src/config/featuredMics.ts (paid sponsor, then Comediq pick, then the Mic of the Month
 * winner). No database calls; it works from the mic list the page already has.
 */
export function useMicOfTheDay() {
  const today = getTodayNY();
  const { data: mics, isLoading } = useOpenMics();

  const pick = useMemo(() => pickFeaturedMic(mics ?? [], allFeaturedMics()), [mics, today]);

  return {
    data: pick,
    isLoading,
    mic: pick?.mic ?? null,
    source: (pick?.source ?? 'unknown') as MotdSource,
    claimDate: today,
  };
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
