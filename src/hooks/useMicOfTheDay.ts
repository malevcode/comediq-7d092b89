import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { useOpenMics } from '@/hooks/useOpenMics';
import { supabase } from '@/integrations/supabase/client';
import { MOTD_FALLBACK_CONFIG, motdWeekday, type MotdConfig } from '@/config/micOfTheDay';

/**
 * Mic of the Day, auction version.
 *
 * Everything comes from ONE small database call, motd_week(): today plus the next few days
 * (who is pinned and what it costs to take the spot), the settings, and the signed-in
 * host's own latest bid per date. It is cached for 15 minutes.
 *
 * Earlier versions are still in the repo but nothing calls them: the config-file picker
 * (src/config/featuredMics.ts, src/utils/featuredMic.ts) and, in the database, the random
 * draw (motd_enter, motd_draw, motd_tick).
 */

export type MotdDay = {
  date: string;
  mic_id: string | null;
  source: 'standing' | 'bid' | 'free' | 'admin' | 'draw' | null;
  state: 'pinned' | 'cleared' | 'open';
  /** What a host pays to take this date now. 0 = free claim. null = not available. */
  price_cents: number | null;
  /** What the current holder paid. */
  holder_price_cents: number;
  /** The signed-in host holds this date. */
  mine: boolean;
};

export type MotdMyBid = {
  id: string;
  date: string;
  mic_id: string | null;
  status: 'won' | 'paid' | 'outbid' | 'void';
  price_cents: number | null;
  refund_cents: number | null;
};

export type MotdWeek = {
  today: string;
  config: MotdConfig;
  days: MotdDay[];
  mine: MotdMyBid[];
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

/** Claim a free date (only before the paid start date). Paid claims go through checkout. */
export function useClaimFreeMicOfTheDay() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ micId, date }: { micId: string; date: string }) => {
      const { data, error } = await motdRpc('motd_claim_free', { p_mic_id: micId, p_date: date });
      if (error) throw error;
      return data as { id: string; date: string; mic_id: string };
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

/** Deactivated. The old instant claim is replaced; see MicOfTheDaySlot. */
export function useClaimMicOfTheDay() {
  return useMutation({
    mutationFn: async (_micUniqueIdentifier: string) => {
      throw new Error('Use "Claim Mic of the Day" at the top of the list.');
    },
  });
}
