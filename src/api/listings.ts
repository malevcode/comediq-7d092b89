import { supabase } from "@/integrations/supabase/client";
import type { ListingForm, ListingKind } from "@/utils/listingForm";
import { micRowFromForm, type MicChangeRequest } from "@/utils/micRowMapping";

/**
 * Host listings against the real tables, the same way the mobile app does
 * (malevcode/comediq-app, src/queries/listings.ts).
 *
 * The RLS already in place does the work:
 *   - users_can_insert_trial_open_mics lets a signed-in user INSERT their own
 *     mic as long as creator_id = auth.uid() and status = 'trial'.
 *   - admins_can_update_open_mics / admins_can_delete_open_mics keep editing
 *     and removal with admins.
 *   - users_can_insert_own_mic_requests and users_can_read_own_mic_requests
 *     make open_mics_requests the approval queue.
 *   - mic_skips is readable by everyone and writable by the mic's creator.
 *
 * So nothing here needs a new service.
 */

const db = supabase as any;

export const myMicsQueryKey = (userId: string | undefined) => ["my-mics", userId];
export const myRequestsQueryKey = (userId: string | undefined) => ["my-mic-requests", userId];
export const micSkipsQueryKey = (micIds: string[]) => [
  "mic-skips",
  [...micIds].sort().join(","),
];

/**
 * Postgres and PostgREST codes meaning "that migration has not been applied
 * here yet". Treated as a soft miss so the host screens keep working against
 * an older schema instead of throwing at the user.
 */
const MISSING_SCHEMA_CODES = new Set(["42703", "42P01", "PGRST205", "PGRST204", "42883"]);

export function isMissingSchemaError(error: unknown): boolean {
  const code = (error as { code?: string } | null)?.code;
  return code !== undefined && MISSING_SCHEMA_CODES.has(code);
}

export class MigrationNeededError extends Error {
  constructor(what: string) {
    super(
      `${what} needs a database migration that has not been applied yet. ` +
        "See the 2026-11-18 and 2026-11-22 files in supabase/migrations.",
    );
    this.name = "MigrationNeededError";
  }
}

// ---------------------------------------------------------------------------
// 1. Publish
// ---------------------------------------------------------------------------

export interface PublishResult {
  micId: string;
  /** False when the presentation columns are not there yet. */
  presentationSaved: boolean;
}

export async function publishListing(
  form: ListingForm,
  kind: ListingKind,
  userId: string,
): Promise<PublishResult> {
  const { data, error } = await db
    .from("open_mics_historical")
    .insert(micRowFromForm(form, kind, userId))
    .select("unique_identifier")
    .single();

  if (error) throw error;
  const micId = String(data.unique_identifier);

  // Tags, description and the map icon arrived with the 2026-11-18 migration,
  // so a listing publishes with or without them.
  const presentationSaved = await updateMicPresentation(micId, {
    tags: form.tags,
    description: form.desc.trim() || null,
    coverImageUrl: form.bannerSeed || null,
    mapIconUrl: form.iconSeed || null,
  }).then(
    () => true,
    (presentationError: unknown) => {
      if (
        isMissingSchemaError(presentationError) ||
        presentationError instanceof MigrationNeededError
      ) {
        return false;
      }
      throw presentationError;
    },
  );

  return { micId, presentationSaved };
}

// ---------------------------------------------------------------------------
// 2. Pending edits -> the approval queue
// ---------------------------------------------------------------------------

export interface MicRequestRow {
  unique_identifier: string;
  mic_id: string | null;
  user_id: string | null;
  reviewed: boolean;
  created_at: string | null;
  [key: string]: unknown;
}

/**
 * Files a change request against an existing mic.
 *
 * `day` is a column as of the 2026-11-22 migration. Where that has not run,
 * the insert is retried without it rather than failing: the rest of the
 * request still reaches the admin, and the day change is reported back to the
 * caller as dropped so the UI can say so.
 */
export async function requestMicChanges(params: {
  micId: string;
  userId: string;
  micName: string;
  changes: MicChangeRequest;
}): Promise<{ dayDropped: boolean }> {
  const base = {
    mic_id: params.micId,
    user_id: params.userId,
    open_mic: params.micName,
    status: "trial",
    reviewed: false,
  };

  const { error } = await db.from("open_mics_requests").insert({ ...base, ...params.changes });
  if (!error) return { dayDropped: false };

  if (isMissingSchemaError(error) && "day" in params.changes) {
    const { day: _day, ...withoutDay } = params.changes;
    const retry = await db.from("open_mics_requests").insert({ ...base, ...withoutDay });
    if (retry.error) {
      if (isMissingSchemaError(retry.error)) throw new MigrationNeededError("Filing a change request");
      throw retry.error;
    }
    return { dayDropped: true };
  }

  if (isMissingSchemaError(error)) throw new MigrationNeededError("Filing a change request");
  throw error;
}

/** The host's own change requests, for the Manage tab's Pending side. */
export async function fetchMyMicRequests(userId: string): Promise<MicRequestRow[]> {
  const { data, error } = await db
    .from("open_mics_requests")
    .select("*")
    .eq("user_id", userId)
    .eq("reviewed", false)
    .order("created_at", { ascending: false });

  if (error) {
    // Without mic_id there is no way to attribute a request to a mic, so show
    // none rather than guess.
    if (isMissingSchemaError(error)) return [];
    throw error;
  }

  return (data ?? []) as MicRequestRow[];
}

// ---------------------------------------------------------------------------
// 3. Instant edits, through the creator-only function
// ---------------------------------------------------------------------------

/**
 * Banner, map icon, tags and description go live right away, per the spec's
 * save rule.
 *
 * `update_own_mic_presentation_v1` is the creator-only door: SECURITY DEFINER,
 * but it names those four columns itself, so there is no path from here to
 * venue, day, time, price, signup method or status. An earlier
 * `update_own_mic_presentation` (no suffix) also exists on the live project
 * and is left in place, unused — see supabase/migrations.
 */
export async function updateMicPresentation(
  micId: string,
  fields: {
    coverImageUrl?: string | null;
    mapIconUrl?: string | null;
    tags?: string[] | null;
    description?: string | null;
  },
): Promise<void> {
  const { error } = await db.rpc("update_own_mic_presentation_v1", {
    p_mic_id: micId,
    p_cover_image_url: fields.coverImageUrl ?? null,
    p_map_icon_url: fields.mapIconUrl ?? null,
    p_tags: fields.tags ?? null,
    p_description: fields.description ?? null,
  });

  if (error) {
    if (isMissingSchemaError(error)) {
      throw new MigrationNeededError("Editing the banner, icon, tags or description");
    }
    throw error;
  }
}

// ---------------------------------------------------------------------------
// 4. Skipped dates
// ---------------------------------------------------------------------------

export interface MicSkipRow {
  id: string;
  mic_id: string;
  skip_date: string;
  reason: string | null;
}

export async function fetchMicSkips(micIds: string[]): Promise<MicSkipRow[]> {
  if (micIds.length === 0) return [];

  const { data, error } = await db
    .from("mic_skips")
    .select("id, mic_id, skip_date, reason")
    .in("mic_id", micIds);

  if (error) {
    // Before the migration there are simply no skips to hide.
    if (isMissingSchemaError(error)) return [];
    throw error;
  }
  return (data ?? []) as MicSkipRow[];
}

export async function addMicSkip(params: {
  micId: string;
  date: string;
  reason: string | null;
  userId: string;
}): Promise<void> {
  const { error } = await db.from("mic_skips").insert({
    mic_id: params.micId,
    skip_date: params.date,
    reason: params.reason,
    created_by: params.userId,
  });

  if (error) {
    if (isMissingSchemaError(error)) throw new MigrationNeededError("Skipping a date");
    throw error;
  }
}

/** Un-skipping removes that one date's row. The unique constraint on
 *  (mic_id, skip_date) is what makes this idempotent. */
export async function removeMicSkip(micId: string, date: string): Promise<void> {
  const { error } = await db
    .from("mic_skips")
    .delete()
    .eq("mic_id", micId)
    .eq("skip_date", date);

  if (error) {
    if (isMissingSchemaError(error)) throw new MigrationNeededError("Un-skipping a date");
    throw error;
  }
}

/** There is no UPDATE policy on mic_skips, so a reason change is delete + insert. */
export async function setMicSkipReason(params: {
  micId: string;
  date: string;
  reason: string;
  userId: string;
}): Promise<void> {
  await removeMicSkip(params.micId, params.date);
  await addMicSkip({
    micId: params.micId,
    date: params.date,
    reason: params.reason,
    userId: params.userId,
  });
}

// ---------------------------------------------------------------------------
// 5. The host's own mics
// ---------------------------------------------------------------------------

export async function fetchMyMicRows(userId: string): Promise<Array<Record<string, unknown>>> {
  const { data, error } = await db
    .from("open_mics_historical")
    .select("*")
    .eq("creator_id", userId)
    .order("submission_date", { ascending: false });

  if (error) throw error;
  return (data ?? []) as Array<Record<string, unknown>>;
}
