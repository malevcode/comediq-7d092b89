import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';


export interface SharedMicRatingData {
  totals: Record<string, { likes: number; dislikes: number }>;
  myRatings: Record<string, string>;
}

/**
 * Every mic's vote totals, and this user's own votes, in two requests.
 *
 * A list screen renders one MicActionBar per card, and each one used to fetch
 * its own counts. At 100 visible cards that is 100 requests per page load, and
 * since the counts query is no longer gated on being signed in, signed-out
 * visitors pay it too. A voting contest promoted by a public form sends mostly
 * signed-out traffic, which made this the largest single consumer of the
 * database egress budget by an order of magnitude.
 *
 * Call this once in a list and hand the result to each row. Screens showing a
 * single mic should not use it: they are better served by the per-mic query in
 * useMicRatings, which fetches one row instead of all of them.
 */
export type MicRatingTotals = Record<string, { likes: number; dislikes: number }>;

/**
 * Vote totals for every mic, through the security definer RPC.
 *
 * Not a direct select. Anonymous visitors have no select policy on
 * user_mic_ratings, and mic_rating_totals only exists once its migration has
 * run, so reading either table straight returned nothing for exactly the
 * signed-out audience a public voting contest sends here. Every count showed
 * zero and no vote appeared to register. get_mic_like_counts is granted to
 * anon and authenticated and is the same call the leaderboard already relies
 * on, which is why the leaderboard worked while the cards did not.
 */
export async function fetchMicRatingTotals(): Promise<MicRatingTotals> {
  const { data, error } = await (supabase as any).rpc('get_mic_like_counts', {
    min_likes: 0,
    row_limit: 500,
  });
  if (error) throw error;
  const out: MicRatingTotals = {};
  ((data ?? []) as any[]).forEach((r) => {
    out[r.mic_unique_identifier] = { likes: r.likes ?? 0, dislikes: r.dislikes ?? 0 };
  });
  return out;
}

export const useSharedMicRatingData = (): SharedMicRatingData => {
  const { user } = useAuth();

  const { data: totals, error: totalsError } = useQuery({
    queryKey: TOTALS_KEY,
    queryFn: fetchMicRatingTotals,
    staleTime: 60 * 1000,
    refetchOnWindowFocus: false,
  });

  if (totalsError) {
    // Silence here is what hid this for weeks: a failed read renders as every
    // mic sitting on zero, which looks exactly like nobody having voted.
    console.error('[useSharedMicRatingData] vote totals failed to load:', totalsError);
  }

  const { data: myRatings } = useQuery({
    queryKey: myRatingsKey(user?.id),
    queryFn: async () => {
      if (!user) return {};
      const { data, error } = await supabase
        .from('user_mic_ratings')
        .select('mic_unique_identifier, rating')
        .eq('user_id', user.id);
      if (error) throw error;
      const out: Record<string, string> = {};
      (data ?? []).forEach((r: any) => { out[r.mic_unique_identifier] = r.rating; });
      return out;
    },
    enabled: !!user,
    staleTime: 60 * 1000,
    refetchOnWindowFocus: false,
  });

  return { totals: totals ?? {}, myRatings: myRatings ?? {} };
};


const TOTALS_KEY = ['micRatingTotalsAll'] as const;
const myRatingsKey = (userId?: string) => ['myMicRatings', userId] as const;

/**
 * Moves the number on screen the moment someone taps, and tells every query
 * that holds vote data to refetch.
 *
 * The list screens read from the two shared queries above, not from the
 * per-mic ones. Those shared keys were missing from the invalidation list, so
 * a vote was written, the toast fired, and the count sat there unchanged for a
 * full staleTime with refetchOnWindowFocus off. It looked like the vote had
 * been swallowed.
 */
function applyVoteToCache(
  queryClient: ReturnType<typeof useQueryClient>,
  userId: string | undefined,
  micId: string,
  next: 'like' | 'dislike' | null,
) {
  const mine = queryClient.getQueryData<Record<string, string>>(myRatingsKey(userId));
  const previous = mine?.[micId] ?? null;
  if (previous === next) return;

  queryClient.setQueryData<Record<string, { likes: number; dislikes: number }>>(
    TOTALS_KEY,
    (totals) => {
      if (!totals) return totals;
      const row = totals[micId] ?? { likes: 0, dislikes: 0 };
      const updated = { ...row };
      if (previous === 'like') updated.likes = Math.max(0, updated.likes - 1);
      if (previous === 'dislike') updated.dislikes = Math.max(0, updated.dislikes - 1);
      if (next === 'like') updated.likes += 1;
      if (next === 'dislike') updated.dislikes += 1;
      return { ...totals, [micId]: updated };
    },
  );

  queryClient.setQueryData<Record<string, string>>(myRatingsKey(userId), (mineNow) => {
    const copy = { ...(mineNow ?? {}) };
    if (next) copy[micId] = next;
    else delete copy[micId];
    return copy;
  });
}

/** Every query holding vote data, so none of them is left behind again. */
function invalidateVoteQueries(
  queryClient: ReturnType<typeof useQueryClient>,
  userId: string | undefined,
  micId: string,
) {
  queryClient.invalidateQueries({ queryKey: ['micRating', micId] });
  queryClient.invalidateQueries({ queryKey: ['micRatingCounts', micId] });
  queryClient.invalidateQueries({ queryKey: TOTALS_KEY });
  queryClient.invalidateQueries({ queryKey: myRatingsKey(userId) });
  queryClient.invalidateQueries({ queryKey: ['micLeaderboardCounts'] });
  queryClient.invalidateQueries({ queryKey: ['userLikedMics', userId] });
}

export const useMicRatings = (micUniqueIdentifier?: string, shared?: SharedMicRatingData) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Get user's rating for a specific mic
  const { data: userRating } = useQuery({
    queryKey: ['micRating', micUniqueIdentifier, user?.id],
    queryFn: async () => {
      if (!user || !micUniqueIdentifier) return null;
      
      const { data, error } = await supabase
        .from('user_mic_ratings')
        .select('rating')
        .eq('user_id', user.id)
        .eq('mic_unique_identifier', micUniqueIdentifier)
        .maybeSingle();

      if (error) throw error;
      return data?.rating || null;
    },
    // Skipped when a list already fetched every rating this user has.
    enabled: !!user && !!micUniqueIdentifier && !shared,
  });

  // Counts come from the same shared read as the lists. One cached request
  // serves every screen, and there is only one key to invalidate.
  const { data: allTotals } = useQuery({
    queryKey: TOTALS_KEY,
    queryFn: fetchMicRatingTotals,
    enabled: !!micUniqueIdentifier && !shared,
    staleTime: 60 * 1000,
    refetchOnWindowFocus: false,
  });
  const ratingCounts = micUniqueIdentifier ? allTotals?.[micUniqueIdentifier] : undefined;

  // Rate a mic (like or dislike)
  const rateMicMutation = useMutation({
    mutationFn: async ({ micUniqueIdentifier, rating }: { micUniqueIdentifier: string, rating: 'like' | 'dislike' }) => {
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('user_mic_ratings')
        .upsert({
          user_id: user.id,
          mic_unique_identifier: micUniqueIdentifier,
          rating: rating,
        }, {
          onConflict: 'user_id,mic_unique_identifier'
        });

      if (error) throw error;
      return data;
    },
    onMutate: ({ micUniqueIdentifier, rating }) => {
      const totals = queryClient.getQueryData(TOTALS_KEY);
      const mine = queryClient.getQueryData(myRatingsKey(user?.id));
      applyVoteToCache(queryClient, user?.id, micUniqueIdentifier, rating);
      return { totals, mine };
    },
    onSuccess: (_, variables) => {
      invalidateVoteQueries(queryClient, user?.id, variables.micUniqueIdentifier);
      toast({
        title: variables.rating === 'like' ? 'Liked!' : 'Disliked!',
        description: `You ${variables.rating}d this open mic.`,
      });
    },
    onError: (_error, _variables, context) => {
      // Put the number back, then say so. A count that stayed bumped after a
      // failed write is the same lie in the other direction.
      if (context) {
        queryClient.setQueryData(TOTALS_KEY, context.totals);
        queryClient.setQueryData(myRatingsKey(user?.id), context.mine);
      }
      toast({
        title: 'Error',
        description: 'Failed to rate this mic. Please try again.',
        variant: 'destructive',
      });
    },
  });

  // Remove rating
  const removeRatingMutation = useMutation({
    mutationFn: async (micUniqueIdentifier: string) => {
      if (!user) throw new Error('User not authenticated');

      const { error } = await supabase
        .from('user_mic_ratings')
        .delete()
        .eq('user_id', user.id)
        .eq('mic_unique_identifier', micUniqueIdentifier);

      if (error) throw error;
    },
    onMutate: (micUniqueIdentifier) => {
      const totals = queryClient.getQueryData(TOTALS_KEY);
      const mine = queryClient.getQueryData(myRatingsKey(user?.id));
      applyVoteToCache(queryClient, user?.id, micUniqueIdentifier, null);
      return { totals, mine };
    },
    onError: (_error, _variables, context) => {
      if (context) {
        queryClient.setQueryData(TOTALS_KEY, context.totals);
        queryClient.setQueryData(myRatingsKey(user?.id), context.mine);
      }
    },
    onSuccess: (_, micUniqueIdentifier) => {
      invalidateVoteQueries(queryClient, user?.id, micUniqueIdentifier);
      toast({
        title: 'Rating removed',
        description: 'Your rating has been removed.',
      });
    },
  });

  const sharedCounts = shared && micUniqueIdentifier ? shared.totals[micUniqueIdentifier] : undefined;
  const sharedRating = shared && micUniqueIdentifier ? shared.myRatings[micUniqueIdentifier] : undefined;

  return {
    userRating: shared ? (sharedRating ?? null) : userRating,
    ratingCounts: (shared ? sharedCounts : ratingCounts) ?? { likes: 0, dislikes: 0 },
    rateMic: rateMicMutation.mutate,
    removeRating: removeRatingMutation.mutate,
    isRating: rateMicMutation.isPending || removeRatingMutation.isPending,
  };
};

// Hook to get user's liked mics
export const useUserLikedMics = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['userLikedMics', user?.id],
    queryFn: async () => {
      if (!user) return [];
      
      const { data, error } = await supabase
        .from('user_mic_ratings')
        .select('mic_unique_identifier')
        .eq('user_id', user.id)
        .eq('rating', 'like');

      if (error) throw error;
      return data?.map(r => r.mic_unique_identifier) || [];
    },
    enabled: !!user,
  });
};
