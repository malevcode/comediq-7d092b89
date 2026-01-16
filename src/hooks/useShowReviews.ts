import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import {
  fetchUserReviews,
  fetchUserReviewForShow,
  submitReview,
  updateReview,
  deleteReview,
  ReviewInput,
} from "@/api/showReviews";

export function useUserReviews() {
  return useQuery({
    queryKey: ["user-reviews"],
    queryFn: fetchUserReviews,
  });
}

export function useUserReviewForShow(showId: string | undefined) {
  return useQuery({
    queryKey: ["user-review", showId],
    queryFn: () => (showId ? fetchUserReviewForShow(showId) : null),
    enabled: !!showId,
  });
}

export function useSubmitReview() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: submitReview,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user-reviews"] });
      queryClient.invalidateQueries({ queryKey: ["user-review"] });
      toast({
        title: "Review submitted!",
        description: "Your review has been saved.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}

export function useUpdateReview() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ reviewId, updates }: { reviewId: string; updates: Partial<ReviewInput> }) =>
      updateReview(reviewId, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user-reviews"] });
      queryClient.invalidateQueries({ queryKey: ["user-review"] });
      toast({
        title: "Review updated!",
        description: "Your changes have been saved.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}

export function useDeleteReview() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: deleteReview,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user-reviews"] });
      queryClient.invalidateQueries({ queryKey: ["user-review"] });
      toast({
        title: "Review deleted",
        description: "Your review has been removed.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}
