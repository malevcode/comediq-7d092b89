import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';

export interface NominationTally {
  nomination_id: string;
  mic_unique_identifier: string;
  nomination_date: string;
  nominated_by: string;
  created_at: string;
  vote_count: number;
}

// Disabled to eliminate Supabase egress until billing cycle resets (July 5)
export function useMotdNominations(_date?: string) {
  const { user } = useAuth();

  const nominations = useQuery({
    queryKey: ['motd-nominations', 'disabled'],
    queryFn: async () => [] as NominationTally[],
    staleTime: Infinity,
  });

  const myVotes = useQuery({
    queryKey: ['motd-nominations', 'disabled', 'my-votes', user?.id],
    enabled: false,
    queryFn: async () => new Set<string>(),
  });

  const myNomination = useQuery({
    queryKey: ['motd-nominations', 'disabled', 'mine', user?.id],
    enabled: false,
    queryFn: async () => null,
  });

  return { nominations, myVotes, myNomination, date: '' };
}

export function useNominateMic() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (_micUniqueIdentifier: string) => {
      throw new Error('MOTD nominations temporarily disabled to conserve database quota');
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['motd-nominations'] });
    },
  });
}

export function useToggleNominationVote() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (_args: { nominationId: string; hasVoted: boolean }) => {
      throw new Error('MOTD voting temporarily disabled to conserve database quota');
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['motd-nominations'] });
    },
  });
}
