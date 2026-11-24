import { useMemo } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  approveClaims,
  claimMics,
  fetchMyClaims,
  fetchPendingClaims,
  myClaimsQueryKey,
  pendingClaimsQueryKey,
  rejectClaims,
  type MicClaim,
} from "@/api/micClaims";
import { useAuth } from "@/contexts/AuthContext";
import type { OpenMic } from "@/types/openMic";

/**
 * Whether a mic is going spare.
 *
 * "No host" means `creator_id` is null. That is the column the host Manage tab
 * reads and the column an approved claim sets, so it is the one that decides
 * whether a mic is actually looked after.
 *
 * The older `mic_hosts` table is deliberately not consulted: it has RLS on
 * with no policies at all, so the client cannot read it (which also means the
 * existing ClaimMicButton's "you manage this mic" state never shows - worth
 * fixing separately). Reading it here would need a new policy, and creator_id
 * answers the question we are actually asking.
 */
export function micHasNoHost(mic: Pick<OpenMic, "creatorId">): boolean {
  return !mic.creatorId;
}

/** The signed-in user's claims, with quick lookups by mic. */
export function useMyMicClaims() {
  const { user } = useAuth();

  const query = useQuery({
    queryKey: myClaimsQueryKey(user?.id),
    queryFn: () => fetchMyClaims(user!.id),
    enabled: Boolean(user?.id),
    staleTime: 60 * 1000,
  });

  const byMicId = useMemo(() => {
    const map = new Map<string, MicClaim>();
    for (const claim of query.data ?? []) map.set(claim.mic_id, claim);
    return map;
  }, [query.data]);

  return {
    claims: query.data ?? [],
    byMicId,
    pending: (query.data ?? []).filter((claim) => claim.status === "pending"),
    isLoading: query.isLoading,
  };
}

export function useClaimMics() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ micIds, note }: { micIds: string[]; note?: string }) => {
      if (!user) throw new Error("Sign in to claim a mic.");
      return claimMics(micIds, user.id, note);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: myClaimsQueryKey(user?.id) });
      queryClient.invalidateQueries({ queryKey: pendingClaimsQueryKey });
    },
  });
}

/* ------------------------------- admin side ------------------------------ */

export function usePendingMicClaims() {
  return useQuery({
    queryKey: pendingClaimsQueryKey,
    queryFn: fetchPendingClaims,
    staleTime: 30 * 1000,
  });
}

export function useDecideMicClaims() {
  const queryClient = useQueryClient();

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: pendingClaimsQueryKey });
    queryClient.invalidateQueries({ queryKey: ["mic-claims"] });
    // An approval sets creator_id, so the host's listings change too.
    queryClient.invalidateQueries({ queryKey: ["my-mics"] });
    queryClient.invalidateQueries({ queryKey: ["openMics"] });
  };

  return {
    approve: useMutation({ mutationFn: approveClaims, onSuccess: invalidate }),
    reject: useMutation({ mutationFn: rejectClaims, onSuccess: invalidate }),
  };
}
