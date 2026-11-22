import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";

import {
  fetchMicSkips,
  fetchMyMicRequests,
  fetchMyMicRows,
  myMicsQueryKey,
  myRequestsQueryKey,
  type MicRequestRow,
  type MicSkipRow,
} from "@/api/listings";
import { useAuth } from "@/contexts/AuthContext";
import { mapSupabaseRow } from "@/hooks/useOpenMics";
import type { OpenMic } from "@/types/openMic";

/**
 * Everything the host Manage tab needs: the listings this user created, the
 * change requests still waiting for an admin, and the skipped dates.
 *
 * The Live / Pending rule is the app's: a listing is Pending when it has an
 * unreviewed row in `open_mics_requests`, and Live otherwise. The live
 * listing keeps running either way — SPEC.md: "the live listing keeps running
 * until approved".
 */

export interface HostListing {
  mic: OpenMic;
  /** True while an unreviewed change request exists for this mic. */
  isPending: boolean;
  /** The pending request, so the Pending tab can show what changed. */
  request: MicRequestRow | null;
  /** Upcoming skipped dates for this mic, soonest first. */
  skips: MicSkipRow[];
}

export function useMyListings() {
  const { user } = useAuth();
  const userId = user?.id;

  const micsQuery = useQuery({
    queryKey: myMicsQueryKey(userId),
    queryFn: async () => {
      const rows = await fetchMyMicRows(userId!);
      return rows.map(mapSupabaseRow);
    },
    enabled: Boolean(userId),
  });

  const requestsQuery = useQuery({
    queryKey: myRequestsQueryKey(userId),
    queryFn: () => fetchMyMicRequests(userId!),
    enabled: Boolean(userId),
  });

  const micIds = useMemo(
    () => (micsQuery.data ?? []).map((mic) => mic.uniqueIdentifier).filter(Boolean),
    [micsQuery.data],
  );

  const skipsQuery = useQuery({
    queryKey: ["mic-skips", "mine", micIds.join(",")],
    queryFn: () => fetchMicSkips(micIds),
    enabled: micIds.length > 0,
  });

  const listings = useMemo((): HostListing[] => {
    const mics = micsQuery.data ?? [];
    const requests = requestsQuery.data ?? [];
    const skips = skipsQuery.data ?? [];

    return mics.map((mic) => {
      const request =
        requests.find((candidate) => candidate.mic_id === mic.uniqueIdentifier) ?? null;
      return {
        mic,
        isPending: request !== null,
        request,
        skips: skips
          .filter((skip) => skip.mic_id === mic.uniqueIdentifier)
          .sort((a, b) => a.skip_date.localeCompare(b.skip_date)),
      };
    });
  }, [micsQuery.data, requestsQuery.data, skipsQuery.data]);

  return {
    listings,
    isLoading: micsQuery.isLoading,
    error: micsQuery.error,
  };
}

export function useMyListing(micId: string) {
  const { listings, isLoading, error } = useMyListings();
  return {
    listing: listings.find((candidate) => candidate.mic.uniqueIdentifier === micId) ?? null,
    isLoading,
    error,
  };
}
