import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

/**
 * Keep this in step with the CHECK constraint on mic_comments.comment_text
 * (supabase/migrations/20261001120000_mic_comments_for_corrections.sql). The
 * limit lived as a bare 180 in three places and the UI copy drifted from the
 * guards here, so a longer comment failed in the hook after the textarea had
 * already accepted it.
 */
export const MAX_COMMENT_LENGTH = 1000;

export interface MicComment {
  id: string;
  mic_unique_identifier: string;
  user_id: string;
  comment_text: string;
  created_at: string;
  updated_at: string;
  username?: string;
}

/**
 * @param enabled Pass false while the comment list is not on screen. The card's
 * comment section renders nothing until it is expanded, but hooks run
 * regardless, so without this every visible card fetched every comment body for
 * its mic to display nothing: 100 requests and 100 full result sets per page.
 */
export function useMicComments(micUniqueIdentifier: string, enabled = true) {
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
      if (userIds.length === 0) {
        return [] as MicComment[];
      }

      const { data: profiles } = await supabase
        .from("profile_display")
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
    enabled: !!micUniqueIdentifier && enabled,
    staleTime: 5 * 60 * 1000,
  });

  // Get comment count
  const commentCount = comments.length;

  // Add comment mutation
  const addCommentMutation = useMutation({
    mutationFn: async (commentText: string) => {
      if (!user) throw new Error("Must be logged in to comment");
      if (commentText.length > MAX_COMMENT_LENGTH) throw new Error(`Comment must be ${MAX_COMMENT_LENGTH} characters or less`);

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
      if (commentText.length > MAX_COMMENT_LENGTH) throw new Error(`Comment must be ${MAX_COMMENT_LENGTH} characters or less`);

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

export type MicCommentCounts = Record<string, number>;

export const MIC_COMMENT_COUNTS_KEY = ["micCommentCountsAll"] as const;

/**
 * Comment counts for every mic, in one request.
 *
 * The badge on a card needs a count before the thread is opened, and
 * useMicComments cannot supply it: its count is the length of a list it only
 * fetches once the thread is on screen. Asking per card would be the same N+1
 * that vote totals were cleaned up to avoid, so the list fetches this once and
 * hands it down, exactly like useSharedMicRatingData.
 *
 * Reads the mic_comment_counts view, which is security_invoker over
 * mic_comments. That is only safe because mic_comments grants SELECT to anon
 * and its RLS policy is USING (true); the same shape over a table anonymous
 * visitors had no policy on is what silently broke upvoting. A failure here
 * must not take the list down with it, so it logs and yields no badges.
 */
export function useMicCommentCounts() {
  const { data } = useQuery({
    queryKey: MIC_COMMENT_COUNTS_KEY,
    queryFn: async (): Promise<MicCommentCounts> => {
      const { data, error } = await supabase
        .from("mic_comment_counts")
        .select("mic_unique_identifier, comment_count");
      if (error) {
        console.error("mic comment counts failed to load", error);
        throw error;
      }
      const out: MicCommentCounts = {};
      ((data ?? []) as any[]).forEach((row) => {
        out[row.mic_unique_identifier] = Number(row.comment_count) || 0;
      });
      return out;
    },
    staleTime: 60 * 1000,
    refetchOnWindowFocus: false,
  });

  return data ?? {};
}
