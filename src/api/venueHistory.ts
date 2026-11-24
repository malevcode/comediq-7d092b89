import { supabase } from "@/integrations/supabase/client";

/**
 * Historical mics: every venue Comediq has ever tracked.
 *
 * Reads the `venue_history_v1` view, which rolls up venues,
 * open_mics_historical, mic_edit_history, mic_skips, nyc_comedy_shows and
 * audience_shows. Nothing is duplicated here.
 */

const db = supabase as any;

export interface VenueHistoryRow {
  slug: string;
  name: string;
  address: string | null;
  borough: string | null;
  neighborhood: string | null;
  latitude: number | null;
  longitude: number | null;
  total_open_mics: number;
  total_shows: number;
  currently_running: boolean;
  has_comediq_run: boolean;
  /** ISO date, or null when we never recorded one. Show "Unknown". */
  first_listed_at: string | null;
  last_active_at: string | null;
  /** Sum of each mic's own run, in days. Drives the "longest listed" sort. */
  days_listed: number;
  last_mic_name: string | null;
  last_mic_day: string | null;
  last_mic_time: string | null;
  last_mic_ended_at: string | null;
  last_mic_ended_reason: string | null;
  last_mic_active: boolean;
  /** A running mic at this venue takes sign-ups through Comediq. */
  comediq_signup?: boolean;
  /** When a RUNNING mic was last confirmed. Null means never. */
  active_last_verified_at?: string | null;
}

export interface VenueDeal {
  id: string;
  venue_slug: string;
  reported_by: string;
  show_type: "open mic" | "show";
  door_price_cents: number | null;
  producer_split_pct: number | null;
  venue_split_pct: number | null;
  bar_split_pct: number | null;
  minimum_cents: number | null;
  minimum_hours: number | null;
  notes: string | null;
  reported_at: string;
  status: "pending" | "approved";
}

export type OpenToNew = "yes" | "maybe" | "no" | "unknown";

export interface VenueOutreach {
  id: string;
  venue_slug: string;
  open_to_new: OpenToNew;
  contact_name: string | null;
  contact_email: string | null;
  contact_ig: string | null;
  notes: string | null;
  updated_at: string;
}

const MISSING_SCHEMA_CODES = new Set(["42703", "42P01", "PGRST205", "PGRST204", "42883"]);

function isMissingSchema(error: unknown): boolean {
  const code = (error as { code?: string } | null)?.code;
  return code !== undefined && MISSING_SCHEMA_CODES.has(code);
}

export const venueHistoryQueryKey = ["venue-history"];
export const approvedDealsQueryKey = ["venue-deals", "approved"];
export const pendingDealsQueryKey = ["venue-deals", "pending"];
export const openToNewQueryKey = ["venue-open-to-new"];

export async function fetchVenueHistory(): Promise<VenueHistoryRow[]> {
  // v2 is v1 plus the two fields the map colours by. Where that migration has
  // not run, v1 still answers and the map falls back to colouring by whether a
  // mic is running at all.
  for (const view of ["venue_history_v2", "venue_history_v1"]) {
    const { data, error } = await db
      .from(view)
      .select("*")
      .order("total_open_mics", { ascending: false });

    if (!error) return (data ?? []) as VenueHistoryRow[];
    if (!isMissingSchema(error)) throw error;
  }
  return [];
}

/**
 * The admin answer to "is this room open to a new mic", where one exists.
 *
 * Read from `venue_open_to_new_v1`, which carries only that one column, so
 * contact names, emails and notes never reach the public page.
 */
export async function fetchOpenToNew(): Promise<Record<string, OpenToNew>> {
  const { data, error } = await db.from("venue_open_to_new_v1").select("venue_slug, open_to_new");
  if (error) {
    if (isMissingSchema(error)) return {};
    throw error;
  }
  const out: Record<string, OpenToNew> = {};
  for (const row of (data ?? []) as Array<{ venue_slug: string; open_to_new: OpenToNew }>) {
    out[row.venue_slug] = row.open_to_new;
  }
  return out;
}

/**
 * Deal reports a signed-in user may see: approved ones, plus their own while
 * pending. RLS decides, so this does not filter by status.
 */
export async function fetchVisibleDeals(): Promise<VenueDeal[]> {
  const { data, error } = await db
    .from("venue_deals")
    .select("*")
    .order("reported_at", { ascending: false });

  if (error) {
    if (isMissingSchema(error)) return [];
    throw error;
  }
  return (data ?? []) as VenueDeal[];
}

export async function fetchPendingDeals(): Promise<VenueDeal[]> {
  const { data, error } = await db
    .from("venue_deals")
    .select("*")
    .eq("status", "pending")
    .order("reported_at", { ascending: true });

  if (error) {
    if (isMissingSchema(error)) return [];
    throw error;
  }
  return (data ?? []) as VenueDeal[];
}

export interface DealReportInput {
  venueSlug: string;
  showType: "open mic" | "show";
  doorPriceCents: number | null;
  producerSplitPct: number | null;
  venueSplitPct: number | null;
  barSplitPct: number | null;
  minimumCents: number | null;
  minimumHours: number | null;
  notes: string;
}

export async function reportDeal(input: DealReportInput, userId: string): Promise<void> {
  const { error } = await db.from("venue_deals").insert({
    venue_slug: input.venueSlug,
    reported_by: userId,
    show_type: input.showType,
    door_price_cents: input.doorPriceCents,
    producer_split_pct: input.producerSplitPct,
    venue_split_pct: input.venueSplitPct,
    bar_split_pct: input.barSplitPct,
    minimum_cents: input.minimumCents,
    minimum_hours: input.minimumHours,
    notes: input.notes.trim() || null,
    status: "pending",
  });
  if (error) throw error;
}

export async function approveDeal(id: string): Promise<void> {
  const { error } = await db.from("venue_deals").update({ status: "approved" }).eq("id", id);
  if (error) throw error;
}

/**
 * Rejecting leaves the row pending rather than deleting it: nothing in this
 * project deletes a report, and a rejected report is still a record that
 * someone told us something. The note records the decision.
 */
export async function rejectDeal(id: string, note: string): Promise<void> {
  const { error } = await db.from("venue_deals").update({ notes: note }).eq("id", id);
  if (error) throw error;
}

/* ----------------------------- admin outreach ---------------------------- */

export async function fetchOutreach(): Promise<VenueOutreach[]> {
  const { data, error } = await db.from("venue_outreach").select("*");
  if (error) {
    if (isMissingSchema(error)) return [];
    throw error;
  }
  return (data ?? []) as VenueOutreach[];
}

/** One row per venue, so saving is an upsert on venue_slug. */
export async function saveOutreach(input: {
  venueSlug: string;
  openToNew: OpenToNew;
  contactName: string;
  contactEmail: string;
  contactIg: string;
  notes: string;
}): Promise<void> {
  const { error } = await db.from("venue_outreach").upsert(
    {
      venue_slug: input.venueSlug,
      open_to_new: input.openToNew,
      contact_name: input.contactName.trim() || null,
      contact_email: input.contactEmail.trim() || null,
      contact_ig: input.contactIg.trim() || null,
      notes: input.notes.trim() || null,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "venue_slug" },
  );
  if (error) throw error;
}
