import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchMicComments, addComment, updateComment, deleteComment, MicComment } from "@/api/pb/micComments";
import { useAuth } from "@/contexts/AuthContext";

export type { MicComment };

export function useMicComments(micUniqueIdentifier: string) {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: comments = [], isLoading, error } = useQuery({
    queryKey: ["mic-comments", micUniqueIdentifier],
    queryFn: () => fetchMicComments(micUniqueIdentifier),
    enabled: !!micUniqueIdentifier,
    staleTime: 30 * 1000,
  });

  const commentCount = comments.length;

  const addCommentMutation = useMutation({
    mutationFn: async (commentText: string) => {
      if (!user) throw new Error("Must be logged in to comment");
      if (commentText.length > 180) throw new Error("Comment must be 180 characters or less");
      return addComment(micUniqueIdentifier, user.id, commentText);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["mic-comments", micUniqueIdentifier] });
    },
  });

  const deleteCommentMutation = useMutation({
    mutationFn: async (commentId: string) => {
      if (!user) throw new Error("Must be logged in");
      return deleteComment(commentId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["mic-comments", micUniqueIdentifier] });
    },
  });

  const updateCommentMutation = useMutation({
    mutationFn: async ({ commentId, commentText }: { commentId: string; commentText: string }) => {
      if (!user) throw new Error("Must be logged in");
      if (commentText.length > 180) throw new Error("Comment must be 180 characters or less");
      return updateComment(commentId, commentText);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["mic-comments", micUniqueIdentifier] });
    },
  });

  return {
    comments,
    commentCount,
    isLoading,
    error,
    addComment: addCommentMutation.mutateAsync,
    deleteComment: deleteCommentMutation.mutateAsync,
    updateComment: updateCommentMutation.mutateAsync,
    isAddingComment: addCommentMutation.isPending,
    isDeletingComment: deleteCommentMutation.isPending,
  };
}
