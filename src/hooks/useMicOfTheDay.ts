import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { useOpenMics } from '@/hooks/useOpenMics';
import { supabase } from '@/integrations/supabase/client';
import { MOTD_FALLBACK_CONFIG, motdWeekday, type MotdConfig } from '@/config/micOfTheDay';

/**
 * Mic of the Day, daily draw version.
 *
 * Everything comes from ONE small database call, motd_week(): today plus the next few days,
 * the pricing settings, and the signed-in host's own entries. It is cached for 15 minutes.
 *
 * The earlier version picked from src/config/featuredMics.ts (sponsor, Comediq pick, Mic of
 * the Month winner). That file and src/utils/featuredMic.ts are still in the repo but nothing
 * calls them now.
 */

export type MotdDay = {
  date: string;
  mic_id: string | null;
  source: 'standing' | 'draw' | 'admin' | null;
  state: 'pinned' | 'awaiting_payment' | 'cleared' | 'open';
  /** Hosts in the draw for this date so far. */
  entries: number;
};

export type MotdMyEntry = {
  id: string;
  date: string;
  mic_id: string | null;
  status: 'entered' | 'won' | 'lost' | 'paid' | 'forfeited';
  pay_by: string | null;
};

export type MotdWeek = {
  today: string;
  config: MotdConfig;
  days: MotdDay[];
  mine: MotdMyEntry[];
};

// The generated Supabase types do not know the motd_* functions yet.
export const motdRpc = (name: string, args?: Record<string, unknown>) => (supabase as any).rpc(name, args);

export function useMotdWeek() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['micOfTheDay', 'week', user?.id ?? 'anon'],
    queryFn: async (): Promise<MotdWeek> => {
      const { data, error } = await motdRpc('motd_week');
      if (error) throw error;
      return { ...data, config: { ...MOTD_FALLBACK_CONFIG, ...(data?.config ?? {}) } } as MotdWeek;
    },
    staleTime: 15 * 60 * 1000,
    gcTime: 60 * 60 * 1000,
    refetchOnWindowFocus: false,
    retry: false,
  });
}

/** The day a listings tab is showing: "next" is today, "Friday" is the coming Friday. */
export function motdDayForTab(week: MotdWeek | undefined, tab: string): MotdDay | null {
  if (!week) return null;
  if (tab === 'next') return week.days.find((d) => d.date === week.today) ?? null;
  return week.days.find((d) => motdWeekday(d.date) === tab) ?? null;
}

/** Enter one of your mics in the draw for a date. Entering is always free. */
export function useEnterMicOfTheDay() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ micId, date }: { micId: string; date: string }) => {
      const { data, error } = await motdRpc('motd_enter', { p_mic_id: micId, p_date: date });
      if (error) throw error;
      return data as { id: string; date: string; mic_id: string; host_verified: boolean };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['micOfTheDay'] });
    },
  });
}

/** Loose on purpose: the older card still compares this against its old source names. */
export type MotdSource = string;

/** Today's pinned mic, if there is one. Kept for the older card and button that still import it. */
export function useMicOfTheDay() {
  const { data: week, isLoading } = useMotdWeek();
  const { data: mics } = useOpenMics();

  const day = motdDayForTab(week, 'next');
  const mic =
    day?.state === 'pinned' && day.mic_id
      ? mics?.find((m) => m.uniqueIdentifier === day.mic_id) ?? null
      : null;

  return {
    data: mic ? { mic, source: day?.source } : null,
    isLoading,
    mic,
    source: (day?.source ?? 'unknown') as MotdSource,
    claimDate: week?.today ?? '',
  };
}

/** Deactivated. The old instant claim is replaced by the draw; see useEnterMicOfTheDay. */
export function useClaimMicOfTheDay() {
  return useMutation({
    mutationFn: async (_micUniqueIdentifier: string) => {
      throw new Error('Mic of the Day is now a daily draw. Use "Claim Mic of the Day" at the top of the list.');
    },
  });
}
