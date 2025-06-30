import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

export const useMicRatings = (micUniqueIdentifier?: string) => {
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
    enabled: !!user && !!micUniqueIdentifier,
  });

  // Get rating counts for a mic
  const { data: ratingCounts } = useQuery({
    queryKey: ['micRatingCounts', micUniqueIdentifier],
    queryFn: async () => {
      if (!micUniqueIdentifier) return { likes: 0, dislikes: 0 };
      
      const { data, error } = await supabase
        .from('user_mic_ratings')
        .select('rating')
        .eq('mic_unique_identifier', micUniqueIdentifier);

      if (error) throw error;
      
      const likes = data?.filter(r => r.rating === 'like').length || 0;
      const dislikes = data?.filter(r => r.rating === 'dislike').length || 0;
      
      return { likes, dislikes };
    },
    enabled: !!micUniqueIdentifier,
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
      toast({
        title: 'Rating removed',
        description: 'Your rating has been removed.',
      });
    },
  });

  return {
    userRating,
    ratingCounts,
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
