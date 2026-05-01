import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { fetchUserRating, fetchRatingCounts, rateMic, removeRating, fetchUserLikedMics } from '@/api/pb/ratings';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

export const useMicRatings = (micUniqueIdentifier?: string) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: userRating } = useQuery({
    queryKey: ['micRating', micUniqueIdentifier, user?.id],
    queryFn: () => fetchUserRating(user!.id, micUniqueIdentifier!),
    enabled: !!user && !!micUniqueIdentifier,
  });

  const { data: ratingCounts } = useQuery({
    queryKey: ['micRatingCounts', micUniqueIdentifier],
    queryFn: () => fetchRatingCounts(micUniqueIdentifier!),
    enabled: !!micUniqueIdentifier,
    staleTime: 60 * 1000,
  });

  const rateMicMutation = useMutation({
    mutationFn: ({ micUniqueIdentifier, rating }: { micUniqueIdentifier: string; rating: 'like' | 'dislike' }) =>
      rateMic(user!.id, micUniqueIdentifier, rating),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['micRating', variables.micUniqueIdentifier] });
      queryClient.invalidateQueries({ queryKey: ['micRatingCounts', variables.micUniqueIdentifier] });
      queryClient.invalidateQueries({ queryKey: ['userLikedMics', user?.id] });
      toast({ title: variables.rating === 'like' ? 'Liked!' : 'Disliked!' });
    },
    onError: () => {
      toast({ title: 'Error', description: 'Failed to rate this mic.', variant: 'destructive' });
    },
  });

  const removeRatingMutation = useMutation({
    mutationFn: (micUniqueIdentifier: string) => removeRating(user!.id, micUniqueIdentifier),
    onSuccess: (_, micUniqueIdentifier) => {
      queryClient.invalidateQueries({ queryKey: ['micRating', micUniqueIdentifier] });
      queryClient.invalidateQueries({ queryKey: ['micRatingCounts', micUniqueIdentifier] });
      queryClient.invalidateQueries({ queryKey: ['userLikedMics', user?.id] });
      toast({ title: 'Rating removed' });
    },
  });

  return {
    userRating,
    ratingCounts: ratingCounts ?? { likes: 0, dislikes: 0 },
    rateMic: rateMicMutation.mutate,
    removeRating: removeRatingMutation.mutate,
    isRating: rateMicMutation.isPending || removeRatingMutation.isPending,
  };
};

export const useUserLikedMics = () => {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['userLikedMics', user?.id],
    queryFn: () => fetchUserLikedMics(user!.id),
    enabled: !!user,
  });
};
