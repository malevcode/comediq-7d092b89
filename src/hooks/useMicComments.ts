import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface MicComment {
  id: string;
  mic_unique_identifier: string;
  user_id: string;
  comment_text: string;
  created_at: string;
  updated_at: string;
  username?: string;
}

export function useMicComments(micUniqueIdentifier: string) {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Fetch comments for a mic
  const { data: comments = [], isLoading, error } = useQuery({
    queryKey: ["mic-comments", micUniqueIdentifier],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("mic_comments")
        .select("*")
        .eq("mic_unique_identifier", micUniqueIdentifier)
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Fetch usernames for comments
      const userIds = [...new Set((data || []).map(c => c.user_id))];
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, username, stage_name")
        .in("user_id", userIds);

      const profileMap = new Map(
        (profiles || []).map(p => [p.user_id, p.stage_name || p.username || "Anonymous"])
      );

      return (data || []).map(comment => ({
        ...comment,
        username: profileMap.get(comment.user_id) || "Anonymous"
      })) as MicComment[];
    },
    enabled: !!micUniqueIdentifier,
    staleTime: 5 * 60 * 1000,
  });

  // Get comment count
  const commentCount = comments.length;

  // Add comment mutation
  const addCommentMutation = useMutation({
    mutationFn: async (commentText: string) => {
      if (!user) throw new Error("Must be logged in to comment");
      if (commentText.length > 180) throw new Error("Comment must be 180 characters or less");

      const { data, error } = await supabase
        .from("mic_comments")
        .insert({
          mic_unique_identifier: micUniqueIdentifier,
          user_id: user.id,
          comment_text: commentText.trim()
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["mic-comments", micUniqueIdentifier] });
    }
  });

  // Delete comment mutation
  const deleteCommentMutation = useMutation({
    mutationFn: async (commentId: string) => {
      if (!user) throw new Error("Must be logged in");

      const { error } = await supabase
        .from("mic_comments")
        .delete()
        .eq("id", commentId)
        .eq("user_id", user.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["mic-comments", micUniqueIdentifier] });
    }
  });

  // Update comment mutation
  const updateCommentMutation = useMutation({
    mutationFn: async ({ commentId, commentText }: { commentId: string; commentText: string }) => {
      if (!user) throw new Error("Must be logged in");
      if (commentText.length > 180) throw new Error("Comment must be 180 characters or less");

      const { data, error } = await supabase
        .from("mic_comments")
        .update({ comment_text: commentText.trim() })
        .eq("id", commentId)
        .eq("user_id", user.id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["mic-comments", micUniqueIdentifier] });
    }
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
