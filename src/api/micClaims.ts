import { supabase } from "@/integrations/supabase/client";

/**
 * Claiming mics.
 *
 * This sits alongside the older `mic_hosts` claim (see `claimMicHosts` in
 * src/api/hostTools.ts), which is untouched. The difference that matters:
 * approving a `mic_claims` row sets `open_mics_historical.creator_id`, and
 * creator_id is what the host Manage tab reads. A mic claimed the old way
 * granted hosting but never appeared in Manage.
 */

export type MicClaimStatus = "pending" | "approved" | "rejected";

export interface MicClaim {
  id: string;
  mic_id: string;
  user_id: string;
  status: MicClaimStatus;
  note: string | null;
  created_at: string;
}

const db = supabase as any;

/** Treated as "that migration has not run here", not as a failure to show. */
const MISSING_SCHEMA_CODES = new Set(["42703", "42P01", "PGRST205", "PGRST204", "42883"]);

function isMissingSchema(error: unknown): boolean {
  const code = (error as { code?: string } | null)?.code;
  return code !== undefined && MISSING_SCHEMA_CODES.has(code);
}

export const myClaimsQueryKey = (userId: string | undefined) => ["mic-claims", "mine", userId];
export const pendingClaimsQueryKey = ["mic-claims", "pending"];

/**
 * Files one claim per mic.
 *
 * The unique constraint on (mic_id, user_id) means re-claiming a mic you have
 * already claimed is a no-op rather than a second row, so submitting twice is
 * safe. `upsert` with ignoreDuplicates is how that is expressed.
 */
export async function claimMics(
  micIds: string[],
  userId: string,
  note?: string,
): Promise<number> {
  if (micIds.length === 0) return 0;

  const rows = micIds.map((micId) => ({
    mic_id: micId,
    user_id: userId,
    status: "pending" as const,
    note: note?.trim() || null,
  }));

  const { data, error } = await db
    .from("mic_claims")
    .upsert(rows, { onConflict: "mic_id,user_id", ignoreDuplicates: true })
    .select("id");

  if (error) throw error;
  return (data ?? []).length;
}

/** The signed-in user's own claims, for the Pending list on Manage. */
export async function fetchMyClaims(userId: string): Promise<MicClaim[]> {
  const { data, error } = await db
    .from("mic_claims")
    .select("id, mic_id, user_id, status, note, created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) {
    if (isMissingSchema(error)) return [];
    throw error;
  }
  return (data ?? []) as MicClaim[];
}

/** Every pending claim, for the admin queue. Admin-only by RLS. */
export async function fetchPendingClaims(): Promise<MicClaim[]> {
  const { data, error } = await db
    .from("mic_claims")
    .select("id, mic_id, user_id, status, note, created_at")
    .eq("status", "pending")
    .order("created_at", { ascending: true });

  if (error) {
    if (isMissingSchema(error)) return [];
    throw error;
  }
  return (data ?? []) as MicClaim[];
}

/**
 * Approve one claim or many.
 *
 * One call, because approving is two writes that must not come apart: the
 * claim's status and the mic's creator_id. The function does both and checks
 * the caller is an admin.
 */
export async function approveClaims(claimIds: string[]): Promise<number> {
  if (claimIds.length === 0) return 0;
  const { data, error } = await db.rpc("approve_mic_claims_v1", { p_claim_ids: claimIds });
  if (error) throw error;
  return (data as number) ?? 0;
}

/** Rejecting is just a status change, which the admin update policy allows. */
export async function rejectClaims(claimIds: string[]): Promise<void> {
  if (claimIds.length === 0) return;
  const { error } = await db
    .from("mic_claims")
    .update({ status: "rejected" })
    .in("id", claimIds);
  if (error) throw error;
}
