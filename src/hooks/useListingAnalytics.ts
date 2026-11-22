import { useQuery } from "@tanstack/react-query";

import { supabase } from "@/integrations/supabase/client";

/**
 * The host's analytics card.
 *
 * SPEC.md: "analytics (only stats we already track)", and
 * WEB_AND_HOST_PLAN.md lists what the boards draw: "views, map taps,
 * saves/likes, check-ins, sign-ups, recorded sets. Only show the ones we
 * already track; add the rest later."
 *
 * Checked against the live database on 2026-11-22. What we actually track,
 * per mic:
 *   saves      saved_mics             (also aggregated in mic_saved_counts)
 *   likes      mic_like_counts
 *   check-ins  user_mic_checkins
 *   sign-ups   mic_signups -> mic_signup_events.mic_id
 *
 * What we do NOT track, and so is not shown:
 *   views      analytics_events records page views by route name, and no mic
 *              detail page has ever logged one - 0 rows with a /mic/ path out
 *              of ~26k events. A "Views: 0" tile on every listing would read
 *              as "nobody looked", which is false.
 *   map taps   nothing records a bubble tap.
 *   recorded   `recordings` carries a free-text venue_name and no mic_id, so
 *     sets     a set cannot be attributed to a mic without guessing.
 *
 * Adding any of those means instrumenting them first; the card grows on its
 * own once the numbers are real.
 */

export interface ListingAnalytics {
  saves: number;
  likes: number;
  checkIns: number;
  signUps: number;
}

export const listingAnalyticsQueryKey = (micId: string) => ["listing-analytics", micId];

async function fetchListingAnalytics(micId: string): Promise<ListingAnalytics> {
  const db = supabase as any;

  const [saves, likes, checkIns, events] = await Promise.all([
    db
      .from("saved_mics")
      .select("id", { count: "exact", head: true })
      .eq("mic_unique_identifier", micId),
    db.from("mic_like_counts").select("likes").eq("mic_unique_identifier", micId).maybeSingle(),
    db
      .from("user_mic_checkins")
      .select("id", { count: "exact", head: true })
      .eq("mic_id", micId),
    // Sign-ups hang off the sheets, not the mic, so the ids come first.
    db.from("mic_signup_events").select("id").eq("mic_id", micId),
  ]);

  let signUps = 0;
  const eventIds = ((events.data ?? []) as Array<{ id: string }>).map((row) => row.id);
  if (eventIds.length > 0) {
    const signups = await db
      .from("mic_signups")
      .select("id", { count: "exact", head: true })
      .in("event_id", eventIds);
    signUps = signups.count ?? 0;
  }

  // A missing table or column means "nothing recorded", not an error the host
  // should see on their own listing page.
  return {
    saves: saves.count ?? 0,
    likes: (likes.data as { likes?: number } | null)?.likes ?? 0,
    checkIns: checkIns.count ?? 0,
    signUps,
  };
}

export function useListingAnalytics(micId: string) {
  return useQuery({
    queryKey: listingAnalyticsQueryKey(micId),
    queryFn: () => fetchListingAnalytics(micId),
    enabled: Boolean(micId),
    staleTime: 5 * 60 * 1000,
  });
}
