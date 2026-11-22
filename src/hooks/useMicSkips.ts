import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";

import { supabase } from "@/integrations/supabase/client";
import { skipKey, type SkipKeys } from "@/utils/venues";

/**
 * Dates a recurring mic is not happening, read from `mic_skips`.
 *
 * Web port of the mobile app's `src/hooks/useMicSkips.ts`, so a skipped night
 * disappears from the site and the app at the same moment.
 *
 * Anyone can SELECT `mic_skips`, so this works for signed-out browsing too.
 * The table arrives with the 2026-11-18 migration; where that has not been run
 * the query comes back empty rather than throwing, and the map simply shows
 * every date as happening.
 */

export interface MicSkip {
  id: string;
  mic_id: string;
  skip_date: string;
  reason: string | null;
}

/** Postgres / PostgREST codes meaning "that migration is not applied here". */
const MISSING_SCHEMA_CODES = new Set(["42703", "42P01", "PGRST205", "PGRST204", "42883"]);

export function isMissingSchemaError(error: unknown): boolean {
  const code = (error as { code?: string } | null)?.code;
  return code !== undefined && MISSING_SCHEMA_CODES.has(code);
}

export async function fetchUpcomingMicSkips(): Promise<MicSkip[]> {
  const today = new Date().toISOString().slice(0, 10);
  const { data, error } = await (supabase as any)
    .from("mic_skips")
    .select("id, mic_id, skip_date, reason")
    .gte("skip_date", today);

  if (error) {
    if (isMissingSchemaError(error)) return [];
    throw error;
  }
  return (data ?? []) as MicSkip[];
}

export function useMicSkips(): { skips: SkipKeys; isLoading: boolean } {
  const { data, isLoading } = useQuery({
    queryKey: ["mic-skips", "upcoming"],
    queryFn: fetchUpcomingMicSkips,
    // Skips change rarely, and a stale one only ever shows a mic that is off.
    staleTime: 1000 * 60 * 5,
  });

  const skips = useMemo(
    () => new Set((data ?? []).map((skip) => skipKey(skip.mic_id, skip.skip_date))),
    [data],
  );

  return { skips, isLoading };
}
