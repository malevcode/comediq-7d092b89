import { useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { usePendingMicClaims, useDecideMicClaims } from "@/hooks/useMicClaims";
import { useOpenMics } from "@/hooks/useOpenMics";

/**
 * Pending mic claims, for the admin approval area.
 *
 * Grouped by claimer, because a host usually claims several rooms at once and
 * they get checked together: one "Approve all from this user" is the common
 * action, with per-row Approve and Reject for the rest.
 *
 * Approving goes through approve_mic_claims_v1, which sets the mic's
 * creator_id as well as the claim's status, so the mic lands in that host's
 * Manage tab.
 */
export default function AdminClaimsPanel() {
  const { toast } = useToast();
  const { data: claims = [], isLoading } = usePendingMicClaims();
  const { data: mics = [] } = useOpenMics();
  const { approve, reject } = useDecideMicClaims();
  const [busyId, setBusyId] = useState<string | null>(null);

  const micById = useMemo(() => {
    const map = new Map<string, (typeof mics)[number]>();
    for (const mic of mics) map.set(mic.uniqueIdentifier, mic);
    return map;
  }, [mics]);

  /** Claims gathered per claimer, newest group first. */
  const groups = useMemo(() => {
    const byUser = new Map<string, typeof claims>();
    for (const claim of claims) {
      const list = byUser.get(claim.user_id) ?? [];
      list.push(claim);
      byUser.set(claim.user_id, list);
    }
    return [...byUser.entries()].map(([userId, list]) => ({ userId, list }));
  }, [claims]);

  const describe = (micId: string) => {
    const mic = micById.get(micId);
    if (!mic) return micId;
    return [mic.openMic, mic.venueName, [mic.day, mic.startTime].filter(Boolean).join(" ")]
      .filter(Boolean)
      .join(" · ");
  };

  const run = async (
    label: string,
    ids: string[],
    action: "approve" | "reject",
    key: string,
  ) => {
    setBusyId(key);
    try {
      if (action === "approve") {
        const count = await approve.mutateAsync(ids);
        toast({
          title: count === 1 ? "Claim approved" : `${count} claims approved`,
          description: "The mics are now in that host's Manage tab.",
        });
      } else {
        await reject.mutateAsync(ids);
        toast({ title: ids.length === 1 ? "Claim rejected" : `${ids.length} claims rejected` });
      }
    } catch (error) {
      toast({
        title: `Could not ${action} ${label}`,
        description: error instanceof Error ? error.message : "Something went wrong.",
        variant: "destructive",
      });
    } finally {
      setBusyId(null);
    }
  };

  return (
    <Card className="mb-8 rounded-2xl border-0 shadow-lg">
      <CardContent className="p-8">
        <div className="mb-6 flex items-center gap-3">
          <h2 className="text-xl font-bold text-foreground">Mic claims</h2>
          <span className="inline-flex items-center justify-center rounded-full bg-blue-600 px-2 py-1 text-xs font-bold leading-none text-white">
            {claims.length}
          </span>
        </div>

        {isLoading && <div className="text-muted-foreground">Loading claims...</div>}

        {!isLoading && claims.length === 0 && (
          <div className="text-muted-foreground">No pending claims.</div>
        )}

        <div className="flex w-full flex-col gap-6">
          {groups.map(({ userId, list }) => (
            <div key={userId} className="rounded-xl border border-border p-4">
              <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <div className="text-sm font-semibold text-foreground">
                    {list.length} {list.length === 1 ? "claim" : "claims"} from one user
                  </div>
                  {/* The user id is what we have: profiles are not joinable
                      from here under the claims policy. */}
                  <div className="font-mono text-xs text-muted-foreground">{userId}</div>
                </div>
                <Button
                  size="sm"
                  disabled={busyId !== null}
                  onClick={() =>
                    run(
                      "these claims",
                      list.map((claim) => claim.id),
                      "approve",
                      `group-${userId}`,
                    )
                  }
                >
                  {busyId === `group-${userId}` ? "Approving..." : "Approve all from this user"}
                </Button>
              </div>

              <ul className="flex flex-col gap-2">
                {list.map((claim) => (
                  <li
                    key={claim.id}
                    className="flex flex-wrap items-center justify-between gap-3 rounded-lg bg-muted/40 px-3 py-2"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm text-foreground">
                        {describe(claim.mic_id)}
                      </div>
                      {claim.note && (
                        <div className="truncate text-xs text-muted-foreground">
                          Note: {claim.note}
                        </div>
                      )}
                    </div>
                    <div className="flex shrink-0 gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={busyId !== null}
                        onClick={() => run("this claim", [claim.id], "approve", claim.id)}
                      >
                        Approve
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        disabled={busyId !== null}
                        onClick={() => run("this claim", [claim.id], "reject", claim.id)}
                      >
                        Reject
                      </Button>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
