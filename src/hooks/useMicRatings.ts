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
export const useSharedMicRatingData = (): SharedMicRatingData => {
  const { user } = useAuth();

  const { data: totals } = useQuery({
    queryKey: ['micRatingTotalsAll'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('mic_rating_totals')
        .select('mic_unique_identifier, likes, dislikes');
      if (error) throw error;
      const out: Record<string, { likes: number; dislikes: number }> = {};
      (data ?? []).forEach((r: any) => {
        out[r.mic_unique_identifier] = { likes: r.likes ?? 0, dislikes: r.dislikes ?? 0 };
      });
      return out;
    },
    staleTime: 60 * 1000,
    refetchOnWindowFocus: false,
  });

  const { data: myRatings } = useQuery({
    queryKey: ['myMicRatings', user?.id],
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

  // Get rating counts for a mic
  const { data: ratingCounts } = useQuery({
    queryKey: ['micRatingCounts', micUniqueIdentifier],
    queryFn: async () => {
      if (!micUniqueIdentifier) return { likes: 0, dislikes: 0 };
      
      const { data, error } = await supabase
        .from('mic_rating_totals')
        .select('likes, dislikes')
        .eq('mic_unique_identifier', micUniqueIdentifier)
        .maybeSingle(); // get back one row or null
      if (error) throw error;
      return data ?? { likes: 0, dislikes: 0 };
    },
    // Skipped when a list already fetched totals for every mic.
    enabled: !!micUniqueIdentifier && !shared,
  });

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
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['micRating', variables.micUniqueIdentifier] });
      queryClient.invalidateQueries({ queryKey: ['micRatingCounts', variables.micUniqueIdentifier] });
      queryClient.invalidateQueries({ queryKey: ['micLeaderboardCounts'] });
      queryClient.invalidateQueries({ queryKey: ['userLikedMics', user?.id] });
      toast({
        title: variables.rating === 'like' ? 'Liked!' : 'Disliked!',
        description: `You ${variables.rating}d this open mic.`,
      });
    },
    onError: (error) => {
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
    onSuccess: (_, micUniqueIdentifier) => {
      queryClient.invalidateQueries({ queryKey: ['micRating', micUniqueIdentifier] });
      queryClient.invalidateQueries({ queryKey: ['micRatingCounts', micUniqueIdentifier] });
      queryClient.invalidateQueries({ queryKey: ['micLeaderboardCounts'] });
      queryClient.invalidateQueries({ queryKey: ['userLikedMics', user?.id] });
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
