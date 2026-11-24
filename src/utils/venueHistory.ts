// The judgements the Historical mics page makes, kept pure so they can be
// reasoned about on their own.
//
// Two of them are estimates rather than facts, and both are labelled as such
// in the UI. Nothing here invents a date: a missing date stays missing and the
// caller shows "Unknown".

import type { OpenToNew, VenueDeal, VenueHistoryRow } from "@/api/venueHistory";

/* -------------------------------------------------------------------------- */
/* Dates                                                                      */
/* -------------------------------------------------------------------------- */

/**
 * Listings before March 2026 came off the original spreadsheet, where the date
 * recorded is when the row was imported rather than when the mic began. The
 * page says so next to anything this old.
 */
export const SHEET_IMPORT_CUTOFF = "2026-03-05";

export function isApproximateDate(iso: string | null): boolean {
  return iso !== null && iso < SHEET_IMPORT_CUTOFF;
}

/** "Mar 2026", or null so the caller can print "Unknown" itself. */
export function formatMonthYear(iso: string | null): string | null {
  if (!iso) return null;
  const date = new Date(`${iso.slice(0, 10)}T12:00:00`);
  if (Number.isNaN(date.getTime())) return null;
  return date.toLocaleDateString("en-US", { month: "short", year: "numeric" });
}

export function monthsBetween(iso: string | null, now: Date = new Date()): number | null {
  if (!iso) return null;
  const date = new Date(`${iso.slice(0, 10)}T12:00:00`);
  if (Number.isNaN(date.getTime())) return null;
  const months =
    (now.getFullYear() - date.getFullYear()) * 12 + (now.getMonth() - date.getMonth());
  return Math.max(0, months);
}

/**
 * "Listed on Comediq" for the card.
 *
 * Deliberately from `first_listed_at`, not `days_listed`. days_listed is the
 * sum of every mic's own run, so The Buddha Room, with 68 mics, totals 9,715
 * days. Printing that as months would read "319 months", which is nonsense to
 * a reader. days_listed is for the "longest listed" sort; this is for the
 * sentence.
 */
export function listedForLabel(row: VenueHistoryRow, now: Date = new Date()): string {
  const months = monthsBetween(row.first_listed_at, now);
  if (months === null) return "Unknown";
  const since = formatMonthYear(row.first_listed_at);
  if (months < 1) return since ? `since ${since}` : "under a month";
  if (months === 1) return "1 month";
  if (months < 24) return `${months} months`;
  return `${Math.floor(months / 12)} years`;
}

/** "Rusty Thursdays, Thursday 7:00 PM, ended Unknown". */
export function lastMicLabel(row: VenueHistoryRow): string | null {
  if (!row.last_mic_name) return null;
  const when = [row.last_mic_day, row.last_mic_time].filter(Boolean).join(" ");
  const parts = [row.last_mic_name];
  if (when) parts.push(when);
  if (row.last_mic_active) {
    parts.push("running now");
  } else {
    const ended = formatMonthYear(row.last_mic_ended_at);
    parts.push(ended ? `ended ${ended}` : "ended Unknown");
  }
  return parts.join(", ");
}

/* -------------------------------------------------------------------------- */
/* Open to a new mic                                                          */
/* -------------------------------------------------------------------------- */

export type OpenToNewVerdict = {
  label: "Likely" | "Maybe" | "Unlikely";
  /** False when an admin has confirmed it, true when we worked it out. */
  estimated: boolean;
};

const MS_PER_DAY = 86_400_000;

/**
 * Whether a room might take a new mic.
 *
 * An admin's answer in venue_outreach always wins. Otherwise this estimates,
 * and the UI marks it "Estimated" so nobody mistakes it for a confirmation:
 *
 *   Likely    ran 2 or more mics, or ran one for 6 months or more, and the
 *             last one ended within the past 12 months
 *   Unlikely  every past mic ended after fewer than 2 months
 *   Maybe     anything else, including a single mic, or one that ended over a
 *             year ago
 *
 * A venue running a mic right now is not a candidate for a new one, so it
 * returns null and the card shows nothing.
 */
export function openToNewVerdict(
  row: VenueHistoryRow,
  adminAnswer: OpenToNew | undefined,
  now: Date = new Date(),
): OpenToNewVerdict | null {
  if (adminAnswer === "yes") return { label: "Likely", estimated: false };
  if (adminAnswer === "maybe") return { label: "Maybe", estimated: false };
  if (adminAnswer === "no") return { label: "Unlikely", estimated: false };

  if (row.currently_running) return null;

  const endedIso = row.last_mic_ended_at ?? row.last_active_at;
  const endedWithinYear =
    endedIso !== null &&
    (now.getTime() - new Date(endedIso).getTime()) / MS_PER_DAY <= 365;

  // Average run per mic, which is what "ran for 6+ months" and "fewer than 2
  // months" are really asking about.
  const avgDaysPerMic =
    row.total_open_mics > 0 ? row.days_listed / row.total_open_mics : 0;

  if (row.total_open_mics > 0 && avgDaysPerMic < 60) {
    return { label: "Unlikely", estimated: true };
  }
  if ((row.total_open_mics >= 2 || avgDaysPerMic >= 183) && endedWithinYear) {
    return { label: "Likely", estimated: true };
  }
  return { label: "Maybe", estimated: true };
}

/* -------------------------------------------------------------------------- */
/* Deal terms against the fair standard                                       */
/* -------------------------------------------------------------------------- */

/** A producer keeping 70% or more of the door is the fair line. */
export const FAIR_PRODUCER_SPLIT_PCT = 70;
/** $250 for a two hour show, scaled by however long the room is booked. */
export const FAIR_MINIMUM_CENTS_PER_2H = 25_000;

export type Judgement = "Great" | "Fair" | "Below standard" | "High" | "None";

export function judgeSplit(deal: VenueDeal): { text: string; verdict: Judgement } | null {
  const producer = deal.producer_split_pct;
  if (producer === null) return null;

  // Keeping the whole door, or getting a cut of the bar on top, is better
  // than the standard rather than merely fair.
  const hasBar = deal.bar_split_pct !== null && deal.bar_split_pct > 0;
  if (producer >= 100 || hasBar) {
    const bar = hasBar ? `, plus ${deal.bar_split_pct}% of the bar` : "";
    return { text: `${producer}% to the producer${bar}`, verdict: "Great" };
  }
  return {
    text: `${producer}% to the producer`,
    verdict: producer >= FAIR_PRODUCER_SPLIT_PCT ? "Fair" : "Below standard",
  };
}

export function judgeMinimum(deal: VenueDeal): { text: string; verdict: Judgement } | null {
  if (deal.minimum_cents === null || deal.minimum_cents === 0) {
    return { text: "No minimum", verdict: "None" };
  }
  const hours = deal.minimum_hours && deal.minimum_hours > 0 ? Number(deal.minimum_hours) : 2;
  const fairForThisLength = (FAIR_MINIMUM_CENTS_PER_2H * hours) / 2;
  const dollars = Math.round(deal.minimum_cents / 100);
  const hoursText = hours === 1 ? "1 hour" : `${hours} hours`;
  return {
    text: `$${dollars} minimum over ${hoursText}`,
    verdict: deal.minimum_cents <= fairForThisLength ? "Fair" : "High",
  };
}

export function formatDoorPrice(deal: VenueDeal): string | null {
  if (deal.door_price_cents === null) return null;
  if (deal.door_price_cents === 0) return "Free at the door";
  return `$${Math.round(deal.door_price_cents / 100)} at the door`;
}

/** The newest approved report wins when a venue has several. */
export function latestDealFor(deals: VenueDeal[], slug: string): VenueDeal | null {
  const forVenue = deals
    .filter((deal) => deal.venue_slug === slug && deal.status === "approved")
    .sort((a, b) => b.reported_at.localeCompare(a.reported_at));
  return forVenue[0] ?? null;
}

/* -------------------------------------------------------------------------- */
/* Activity status, which is what the map colours by                          */
/* -------------------------------------------------------------------------- */

/**
 * How alive a venue is, from most to least confidence.
 *
 *   active    a mic is running and someone confirmed it recently
 *   comediq   a running mic takes sign-ups through Comediq
 *   unverified a mic is running but nobody has confirmed it in 30 days
 *   inactive  no mic runs here now
 *
 * The order below is the precedence, and it is deliberate. "Running" is
 * checked first, because a room with no mic is a room with no mic whatever
 * else is true of it. Then freshness, because an unconfirmed listing is the
 * thing most likely to waste a comic's evening, and hiding that behind a
 * Comediq badge would be the wrong trade. A Comediq-signup room that has gone
 * 30 days unconfirmed shows as unverified, not as Comediq blue.
 */
export type VenueActivity = "active" | "comediq" | "unverified" | "inactive";

/** The window the page treats a confirmation as still current for. */
export const VERIFIED_WITHIN_DAYS = 30;

export function venueActivity(
  row: VenueHistoryRow,
  now: Date = new Date(),
): VenueActivity {
  if (!row.currently_running) return "inactive";

  // Where the v2 view is missing, this field is undefined and every running
  // venue reads as active rather than being wrongly marked unverified.
  const lastVerified =
    row.active_last_verified_at === undefined ? undefined : row.active_last_verified_at;
  if (lastVerified !== undefined) {
    const fresh =
      lastVerified !== null &&
      (now.getTime() - new Date(lastVerified).getTime()) / MS_PER_DAY <= VERIFIED_WITHIN_DAYS;
    if (!fresh) return "unverified";
  }

  if (row.comediq_signup) return "comediq";
  return "active";
}

/**
 * Blue and white only, as the brand requires.
 *
 * Darkest reads as most alive and white as gone, so the ramp carries the
 * meaning on its own. `fg` keeps the two-letter initials legible on each.
 */
export const ACTIVITY_STYLE: Record<
  VenueActivity,
  { bg: string; fg: string; label: string }
> = {
  active: { bg: "#0F2A5C", fg: "#FFFFFF", label: "Active" },
  comediq: { bg: "#1E4894", fg: "#FFFFFF", label: "Signs up on Comediq" },
  unverified: { bg: "#8FC2F5", fg: "#08142B", label: "Not confirmed in 30 days" },
  inactive: { bg: "#FFFFFF", fg: "#08142B", label: "No mic here now" },
};

/** The legend's order: most alive first. */
export const ACTIVITY_ORDER: VenueActivity[] = [
  "active",
  "comediq",
  "unverified",
  "inactive",
];

/* -------------------------------------------------------------------------- */
/* Sorting and filtering                                                      */
/* -------------------------------------------------------------------------- */

export type VenueSort = "most-mics" | "longest-listed" | "recently-ended";

export function sortVenues(rows: VenueHistoryRow[], sort: VenueSort): VenueHistoryRow[] {
  const copy = [...rows];
  if (sort === "most-mics") {
    copy.sort((a, b) => b.total_open_mics - a.total_open_mics || a.name.localeCompare(b.name));
  } else if (sort === "longest-listed") {
    copy.sort((a, b) => b.days_listed - a.days_listed || a.name.localeCompare(b.name));
  } else {
    // Most recently ended first; rooms still running have no end date, so they
    // sort last rather than pretending to have ended today.
    copy.sort((a, b) => {
      const aEnd = a.currently_running ? "" : (a.last_mic_ended_at ?? a.last_active_at ?? "");
      const bEnd = b.currently_running ? "" : (b.last_mic_ended_at ?? b.last_active_at ?? "");
      if (aEnd === bEnd) return a.name.localeCompare(b.name);
      if (!aEnd) return 1;
      if (!bEnd) return -1;
      return bEnd.localeCompare(aEnd);
    });
  }
  return copy;
}

export interface VenueFilters {
  search: string;
  borough: string;
  running: "all" | "running" | "not-running";
  likelyOpen: boolean;
  hasDeal: boolean;
}

export const EMPTY_VENUE_FILTERS: VenueFilters = {
  search: "",
  borough: "",
  running: "all",
  likelyOpen: false,
  hasDeal: false,
};

export function filterVenues(
  rows: VenueHistoryRow[],
  filters: VenueFilters,
  context: {
    openToNew: Record<string, OpenToNew>;
    dealSlugs: Set<string>;
    now?: Date;
  },
): VenueHistoryRow[] {
  const needle = filters.search.trim().toLowerCase();

  return rows.filter((row) => {
    if (needle && !row.name.toLowerCase().includes(needle)) return false;
    if (filters.borough && row.borough !== filters.borough) return false;
    if (filters.running === "running" && !row.currently_running) return false;
    if (filters.running === "not-running" && row.currently_running) return false;
    if (filters.hasDeal && !context.dealSlugs.has(row.slug)) return false;
    if (filters.likelyOpen) {
      const verdict = openToNewVerdict(row, context.openToNew[row.slug], context.now);
      if (verdict?.label !== "Likely") return false;
    }
    return true;
  });
}
