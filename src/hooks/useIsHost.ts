import { useQuery } from "@tanstack/react-query";

import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

/**
 * Whether to show the host Manage tab.
 *
 * SPEC.md: the tab is "only for users who host a claimed mic or show". Two
 * things count, exactly as in the mobile app's `useIsHost`:
 *   - an `open_mics_historical` row where creator_id = auth.uid(), i.e. a mic
 *     they listed themselves, and
 *   - a row in `mic_hosts`, which is how a mic someone else listed gets
 *     claimed.
 *
 * `mic_hosts.mic_id` is text live, matching
 * `open_mics_historical.unique_identifier`, not a uuid.
 */

export const isHostQueryKey = (userId: string | undefined) => ["is-host", userId];

async function fetchIsHost(userId: string): Promise<boolean> {
  const [created, claimed] = await Promise.all([
    supabase
      .from("open_mics_historical")
      .select("unique_identifier", { count: "exact", head: true })
      .eq("creator_id", userId),
    supabase
      .from("mic_hosts")
      .select("mic_id", { count: "exact", head: true })
      .eq("user_id", userId),
  ]);

  // A failure here should hide the tab, not break the page it sits on.
  if (created.error) console.warn("[useIsHost] created mics lookup failed", created.error);
  if (claimed.error) console.warn("[useIsHost] claimed mics lookup failed", claimed.error);

  return (created.count ?? 0) > 0 || (claimed.count ?? 0) > 0;
}

export function useIsHost(): boolean {
  const { user } = useAuth();

  const { data } = useQuery({
    queryKey: isHostQueryKey(user?.id),
    queryFn: () => fetchIsHost(user!.id),
    enabled: Boolean(user?.id),
    staleTime: 5 * 60 * 1000,
  });

  return data ?? false;
}
