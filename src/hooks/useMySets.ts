import { useQuery } from "@tanstack/react-query";

import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

/**
 * Sets, from the `recordings` table.
 *
 * "Sets" on the boards (Main.dc.html's SETS and SET REVIEW screens) is this
 * table: one row per recorded set, with the venue, the file and whatever the
 * transcription pipeline added. There is no separate `sets` table.
 */

export interface MySet {
  id: string;
  title: string | null;
  venueName: string | null;
  fileUrl: string | null;
  createdAt: string;
  status: string | null;
  transcription: string | null;
  /** Whatever the AI pass produced. Shape varies, so it stays unknown here. */
  aiSummary: unknown;
  performanceMetrics: unknown;
}

export const mySetsQueryKey = (userId: string | undefined) => ["my-sets", userId];

function mapRow(row: Record<string, unknown>): MySet {
  return {
    id: String(row.id),
    title: (row.title as string | null) ?? null,
    venueName: (row.venue_name as string | null) ?? null,
    fileUrl: (row.file_url as string | null) ?? null,
    createdAt: (row.created_at as string | null) ?? new Date().toISOString(),
    status: (row.status as string | null) ?? null,
    transcription: (row.transcription as string | null) ?? null,
    aiSummary: row.ai_summary ?? null,
    performanceMetrics: row.performance_metrics ?? null,
  };
}

export function useMySets() {
  const { user } = useAuth();

  return useQuery({
    queryKey: mySetsQueryKey(user?.id),
    queryFn: async (): Promise<MySet[]> => {
      const { data, error } = await supabase
        .from("recordings")
        .select(
          "id, title, venue_name, file_url, created_at, status, transcription, ai_summary, performance_metrics",
        )
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return (data ?? []).map((row) => mapRow(row as Record<string, unknown>));
    },
    enabled: Boolean(user?.id),
  });
}

export function useMySet(setId: string) {
  const { data: sets, isLoading } = useMySets();
  return {
    set: sets?.find((candidate) => candidate.id === setId) ?? null,
    isLoading,
  };
}
