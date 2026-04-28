import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

function getTodayNY(): string {
  const fmt = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/New_York',
    year: 'numeric', month: '2-digit', day: '2-digit',
  });
  return fmt.format(new Date());
}

export interface NominationTally {
  nomination_id: string;
  mic_unique_identifier: string;
  nomination_date: string;
  nominated_by: string;
  created_at: string;
  vote_count: number;
}

export function useMotdNominations(date?: string) {
  const target = date || getTodayNY();
  const { user } = useAuth();

  const nominations = useQuery({
    queryKey: ['motd-nominations', target],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('motd_nomination_tallies' as any)
        .select('*')
        .eq('nomination_date', target)
        .order('vote_count', { ascending: false });
      if (error) throw error;
      return (data || []) as unknown as NominationTally[];
    },
    staleTime: 30_000,
  });

  const myVotes = useQuery({
    queryKey: ['motd-nominations', target, 'my-votes', user?.id],
    enabled: !!user,
    queryFn: async () => {
      if (!user) return new Set<string>();
      const ids = (nominations.data || []).map((n) => n.nomination_id);
      if (ids.length === 0) return new Set<string>();
      const { data, error } = await supabase
        .from('motd_nomination_votes')
        .select('nomination_id')
        .eq('user_id', user.id)
        .in('nomination_id', ids);
      if (error) throw error;
      return new Set((data || []).map((r: any) => r.nomination_id));
    },
  });

  const myNomination = useQuery({
    queryKey: ['motd-nominations', target, 'mine', user?.id],
    enabled: !!user,
    queryFn: async () => {
      if (!user) return null;
      const { data, error } = await supabase
        .from('motd_nominations')
        .select('id, mic_unique_identifier')
        .eq('nominated_by', user.id)
        .eq('nomination_date', target)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  return { nominations, myVotes, myNomination, date: target };
}

export function useNominateMic() {
  const { user } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (micUniqueIdentifier: string) => {
      if (!user) throw new Error('Sign in required');
      const { data, error } = await supabase
        .from('motd_nominations')
        .insert({ mic_unique_identifier: micUniqueIdentifier, nominated_by: user.id })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['motd-nominations'] });
    },
  });
}

export function useToggleNominationVote() {
  const { user } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ nominationId, hasVoted }: { nominationId: string; hasVoted: boolean }) => {
      if (!user) throw new Error('Sign in required');
      if (hasVoted) {
        const { error } = await supabase
          .from('motd_nomination_votes')
          .delete()
          .eq('nomination_id', nominationId)
          .eq('user_id', user.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('motd_nomination_votes')
          .insert({ nomination_id: nominationId, user_id: user.id });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['motd-nominations'] });
    },
  });
}
