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

export type MotdSource = 'admin_lock' | 'nomination' | 'weekly_default' | 'auto_pick' | 'unknown';

export function useMicOfTheDay() {
  const { data: mics = [] } = useOpenMics();
  const today = getTodayNY();

  // Resolve via priority chain: admin lock -> top vote -> weekly default -> auto-pick
  const query = useQuery({
    queryKey: ['micOfTheDay', 'resolved', today],
    queryFn: async () => {
      const winnerRes = await (supabase as any).rpc('resolve_motd_for', { target_date: today });
      if (winnerRes.error) throw winnerRes.error;
      const winner = (winnerRes.data as string | null) || null;
      if (!winner) return { winner: null as string | null, source: 'unknown' as MotdSource };

      // Detect which resolver step won, in same priority order
      const [lockRes, nomsRes] = await Promise.all([
        supabase
          .from('mic_of_the_day')
          .select('mic_unique_identifier, is_admin_locked')
          .eq('claim_date', today)
          .eq('is_admin_locked', true)
          .maybeSingle(),
        (supabase as any)
          .from('motd_nomination_tallies')
          .select('mic_unique_identifier, vote_count, created_at')
          .eq('nomination_date', today)
          .order('vote_count', { ascending: false })
          .order('created_at', { ascending: true })
          .limit(1)
          .maybeSingle(),
      ]);

      let source: MotdSource = 'auto_pick';
      if (lockRes.data?.mic_unique_identifier === winner) {
        source = 'admin_lock';
      } else if (nomsRes.data?.mic_unique_identifier === winner) {
        source = 'nomination';
      } else {
        const dow = new Date(today + 'T12:00:00').getUTCDay();
        const { data: wd } = await supabase
          .from('motd_weekly_defaults')
          .select('mic_unique_identifier')
          .eq('day_of_week', dow)
          .eq('mic_unique_identifier', winner)
          .maybeSingle();
        if (wd) source = 'weekly_default';
      }

      return { winner, source };
    },
    staleTime: 60 * 60 * 1000,
  });

  const winner = query.data?.winner || null;
  const mic: OpenMic | null = winner
    ? mics.find((m) => m.uniqueIdentifier === winner) || null
    : null;
  const source: MotdSource = query.data?.source || 'unknown';

  return { ...query, mic, source, claimDate: today };
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
