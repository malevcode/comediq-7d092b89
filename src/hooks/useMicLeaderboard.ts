import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useOpenMics } from "@/hooks/useOpenMics";
import type { OpenMic } from "@/types/openMic";

export interface LeaderboardMic {
  rank: number;
  upvotes: number;
  mic: OpenMic;
}

interface LikeCountRow {
  mic_unique_identifier: string;
  likes: number | null;
}

/**
 * Mic leaderboard, ranked by upvotes.
 *
 * An upvote is a `like` in user_mic_ratings, the same thing the arrows on a mic
 * card record. Counting happens in the mic_like_counts view rather than here,
 * so this pulls one small aggregate rather than every vote row.
 *
 * Mic details come from useOpenMics, which reads the static mics.json, so the
 * only database traffic is the count query. That also means the leaderboard
 * lists active, non-pending mics only: a mic the site does not show cannot
 * appear on a board of the site's mics.
 */
export function useMicLeaderboard(limit = 50) {
  const { data: mics, isLoading: micsLoading } = useOpenMics();

  const counts = useQuery({
    queryKey: ["micLeaderboardCounts"],
    queryFn: async (): Promise<LikeCountRow[]> => {
      const { data, error } = await supabase
        .from("mic_like_counts")
        .select("mic_unique_identifier, likes")
        .order("likes", { ascending: false })
        .limit(500);
      if (error) throw error;
      return (data ?? []) as LikeCountRow[];
    },
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
    retry: 1,
  });

  const byId = new Map((mics ?? []).map((m) => [m.uniqueIdentifier, m]));

  const rows: LeaderboardMic[] = (counts.data ?? [])
    .map((c) => ({ upvotes: c.likes ?? 0, mic: byId.get(c.mic_unique_identifier) }))
    // A count can outlive its mic: the mic was deactivated, or went pending, and
    // dropped out of mics.json while its votes stayed in the database.
    .filter((r): r is { upvotes: number; mic: OpenMic } => !!r.mic && r.upvotes > 0)
    .sort((a, b) => b.upvotes - a.upvotes || a.mic.openMic.localeCompare(b.mic.openMic))
    .slice(0, limit)
    .map((r, i) => ({ rank: i + 1, upvotes: r.upvotes, mic: r.mic }));

  return {
    rows,
    isLoading: micsLoading || counts.isLoading,
    error: counts.error,
    totalVotes: rows.reduce((sum, r) => sum + r.upvotes, 0),
  };
}
