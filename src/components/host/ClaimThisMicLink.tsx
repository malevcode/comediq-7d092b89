import { Link } from "react-router-dom";

import { useMyMicClaims, micHasNoHost } from "@/hooks/useMicClaims";
import type { OpenMic } from "@/types/openMic";

/**
 * "Claim this mic", for a mic nobody looks after.
 *
 * Shows nothing when the mic already has a host, and swaps to a quiet
 * "Claim pending" once this user has claimed it, so the same link never
 * invites a second claim.
 *
 * It carries the mic id straight into the claim screen as a pre-tick, so one
 * tap from a mic page lands on that mic already selected and the host can add
 * their other rooms before sending.
 *
 * Logged-out visitors get the link too: the claim screen sends them to sign in
 * and brings them back with their picks.
 */
export default function ClaimThisMicLink({
  mic,
  className,
}: {
  mic: Pick<OpenMic, "uniqueIdentifier" | "creatorId">;
  className?: string;
}) {
  const { byMicId } = useMyMicClaims();
  const existing = byMicId.get(mic.uniqueIdentifier);

  if (existing?.status === "pending") {
    return (
      <span className={className ?? "text-sm text-muted-foreground"}>Claim pending</span>
    );
  }

  // An approved claim means they host it, so there is nothing to offer.
  if (existing?.status === "approved") return null;
  if (!micHasNoHost(mic)) return null;

  return (
    <Link
      to={`/claim-mics?picks=${encodeURIComponent(mic.uniqueIdentifier)}`}
      className={className ?? "text-sm font-semibold underline underline-offset-2"}
    >
      Claim this mic
    </Link>
  );
}
