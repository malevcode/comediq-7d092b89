// Mapping between the listing form and `open_mics_historical` /
// `open_mics_requests` rows.
//
// Based on the mobile app's `src/utils/micRowMapping.ts`, with three
// deliberate differences, each because the live schema is not what the app
// assumes:
//
//   1. `open_mics_historical` has NO `show_title` column (checked against the
//      live table on 2026-11-22). The app writes one, which would fail the
//      insert outright. A show's title goes in `open_mic`, same as a mic's.
//      `open_mics_requests` does have show_title, so the request path keeps it.
//   2. `price_per_slot` is `numeric`, and the form's price is free text like
//      "$15" or "5 + 1 drink". Passing that straight through is a write error
//      or a bad coercion, so a number is parsed out and anything unparseable
//      becomes null. The human-readable price stays in `cost`.
//   3. `slot_duration_minutes` is `integer` and must not be NaN.
//
// Pure, so it can be reasoned about without the Supabase client. Getting an
// enum or a time format wrong here writes bad data nothing downstream catches.

import {
  costText,
  resolvedVenue,
  type ListingForm,
  type ListingKind,
} from "@/utils/listingForm";
import { DAY_FULL, DAY_SHORT, formatClock } from "@/utils/listingSchedule";

// ---------------------------------------------------------------------------
// Form -> column mapping
// ---------------------------------------------------------------------------

/** The form's labels to the mic_frequency enum. */
function toFrequency(form: ListingForm): {
  frequency: string;
  frequency_custom_text: string | null;
} {
  switch (form.freq) {
    case "Weekly":
      return { frequency: "weekly", frequency_custom_text: null };
    case "Every other week":
      return { frequency: "bi_weekly", frequency_custom_text: null };
    case "One time":
      return { frequency: "one_off", frequency_custom_text: null };
    case "Monthly":
      // The enum has 'last_of_month', which is narrower than what the form can
      // express ("1st and 3rd Thu"), so monthly goes in as custom and carries
      // the detected pattern as text.
      return { frequency: "custom", frequency_custom_text: form.note || "Monthly" };
    default:
      return { frequency: "custom", frequency_custom_text: form.freq };
  }
}

/** The form's labels to the signup_method enum: in_person | online | comediq_slots | other. */
function toSignupMethod(form: ListingForm): string {
  if (form.signup === "Online link") return "online";
  if (form.signup === "In person") return "in_person";
  // 'Lineup order' has no enum member of its own; the order itself is written
  // into sign_up_instructions.
  return "other";
}

/** "7:00 PM", matching how every existing row stores a time. */
function toStoredTime(value: string): string | null {
  const formatted = formatClock(value);
  return formatted
    ? formatted.replace(/(am|pm)$/i, (match) => ` ${match.toUpperCase()}`)
    : null;
}

export function dayFullName(short: string): string | null {
  const index = DAY_SHORT.indexOf(short as (typeof DAY_SHORT)[number]);
  return index === -1 ? null : DAY_FULL[index];
}

/**
 * A number for a numeric column, out of free text. "$15" -> 15,
 * "5 + 1 drink" -> 5, "Free" -> null.
 */
function toNumericOrNull(value: string): number | null {
  const match = value.match(/\d+(?:\.\d+)?/);
  if (!match) return null;
  const parsed = Number(match[0]);
  return Number.isFinite(parsed) ? parsed : null;
}

function toIntegerOrNull(value: string): number | null {
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) ? parsed : null;
}

/**
 * The row a published listing becomes.
 *
 * Every column here was checked against the live table. A listing starts as
 * 'trial' with active true, which is what `users_can_insert_trial_open_mics`
 * requires and what `open_mics_public_read_active_approved` needs for the
 * listing to be visible to anyone but its creator.
 */
export function micRowFromForm(form: ListingForm, kind: ListingKind, userId: string) {
  const venue = resolvedVenue(form);
  const { frequency, frequency_custom_text } = toFrequency(form);

  return {
    creator_id: userId,
    status: "trial",
    active: true,
    is_comediq_run: false,

    // A show's title lives here too: there is no show_title column on this
    // table, and inventing one silently would break the insert.
    open_mic: form.name.trim(),
    venue_name: venue.name,
    location: venue.address || null,
    neighborhood: venue.hood || null,
    borough: venue.hood || null,
    city: "New York",
    latitude: venue.latitude ?? null,
    longitude: venue.longitude ?? null,

    day: kind === "mic" ? dayFullName(form.day) : null,
    start_time: toStoredTime(form.start),
    latest_end_time: toStoredTime(kind === "mic" ? form.end : form.doors),
    frequency,
    frequency_custom_text,

    cost: costText(form) || null,
    price_per_slot: form.cost === "Paid" ? toNumericOrNull(form.price) : null,
    stage_time: form.setLen === "Other" ? form.otherMins || null : form.setLen || null,
    slot_duration_minutes: toIntegerOrNull(
      form.setLen === "Other" ? form.otherMins : form.setLen,
    ),

    signup_method: toSignupMethod(form),
    signup_url: form.signup === "Online link" ? form.link.trim() || null : null,
    sign_up_instructions:
      form.signup === "Lineup order" ? form.order || null : form.link.trim() || null,
    signup_enabled: form.signup === "Online link",

    hosts_organizers: form.host.trim() || null,
    other_rules: form.desc.trim() || null,
  };
}

// ---------------------------------------------------------------------------
// Row -> form, for edit mode
// ---------------------------------------------------------------------------

/** 19:00 from "7:00 PM", which is what a time input wants. */
function toFieldTime(stored: unknown): string {
  if (typeof stored !== "string") return "";
  const match = stored.trim().match(/^(\d{1,2})(?::(\d{2}))?\s*(a\.?m\.?|p\.?m\.?)?/i);
  if (!match) return "";
  const [, hourText, minute = "00", period] = match;
  let hour = Number.parseInt(hourText, 10);
  if (!Number.isFinite(hour)) return "";
  if (period) {
    hour = hour % 12;
    if (/^p/i.test(period)) hour += 12;
  }
  return `${`${hour}`.padStart(2, "0")}:${minute}`;
}

/** The camelCase OpenMic the web reads, rather than the app's raw row. */
interface MicLike {
  openMic?: string | null;
  venueName?: string | null;
  location?: string | null;
  neighborhood?: string | null;
  borough?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  day?: string | null;
  startTime?: string | null;
  latestEndTime?: string | null;
  frequency?: string | null;
  frequencyCustomText?: string | null;
  cost?: string | null;
  stageTime?: string | null;
  signupMethod?: string | null;
  signupUrl?: string | null;
  signUpInstructions?: string | null;
  hosts?: string | null;
  tags?: string[] | null;
  description?: string | null;
  otherRules?: string | null;
  coverImageUrl?: string | null;
  mapIconUrl?: string | null;
}

function frequencyLabel(mic: MicLike): ListingForm["freq"] {
  switch (mic.frequency) {
    case "weekly":
      return "Weekly";
    case "bi_weekly":
      return "Every other week";
    case "one_off":
      return "One time";
    case "last_of_month":
    case "custom":
      return "Monthly";
    default:
      return "Weekly";
  }
}

function signupLabel(mic: MicLike): string {
  switch (mic.signupMethod) {
    case "online":
    case "comediq_slots":
      return "Online link";
    case "in_person":
      return "In person";
    case "other":
      return "Lineup order";
    default:
      return "";
  }
}

/** Fills the edit form from a live row. */
export function formFromMic(mic: MicLike, base: ListingForm): ListingForm {
  const day = typeof mic.day === "string" ? mic.day.slice(0, 3) : "";
  const cost = mic.cost ?? "";
  const isPaid = /^\$|\d/.test(cost) && !/free/i.test(cost);

  return {
    ...base,
    name: mic.openMic ?? "",
    venue: {
      name: mic.venueName ?? "",
      address: mic.location ?? "",
      hood: mic.neighborhood ?? mic.borough ?? "New York",
      latitude: typeof mic.latitude === "number" ? mic.latitude : null,
      longitude: typeof mic.longitude === "number" ? mic.longitude : null,
    },
    addVenue: false,
    day: (day as ListingForm["day"]) || "",
    start: toFieldTime(mic.startTime),
    end: toFieldTime(mic.latestEndTime),
    freq: frequencyLabel(mic),
    note: mic.frequencyCustomText ?? "",
    cost: /free/i.test(cost) ? "Free" : isPaid ? "Paid" : cost ? "Bringer" : "",
    price: isPaid ? cost : "",
    setLen: mic.stageTime ?? "",
    signup: signupLabel(mic),
    link: mic.signupUrl ?? "",
    order: mic.signUpInstructions ?? "",
    host: mic.hosts ?? "",
    tags: Array.isArray(mic.tags) ? mic.tags : [],
    desc: mic.description ?? mic.otherRules ?? "",
    bannerSeed: mic.coverImageUrl ?? "",
    iconSeed: mic.mapIconUrl ?? "",
    verify: true,
  };
}

/**
 * Only the fields an admin has to approve.
 *
 * `day` is a real column on `open_mics_requests` as of the 2026-11-22
 * migration. `callers` drop it and retry if a given environment has not had
 * that migration run yet - see requestMicChanges in src/api/listings.ts.
 */
export interface MicChangeRequest {
  venue_name?: string | null;
  location?: string | null;
  day?: string | null;
  time?: string | null;
  latest_end_time?: string | null;
  frequency?: string | null;
  frequency_custom_text?: string | null;
  cost?: string | null;
  signup_method?: string | null;
  signup_url?: string | null;
  sign_up_instructions?: string | null;
}

/** Builds the request row from what actually changed between two forms. */
export function changeRequestFromForms(
  current: ListingForm,
  next: ListingForm,
): MicChangeRequest {
  const request: MicChangeRequest = {};
  const currentVenue = resolvedVenue(current);
  const nextVenue = resolvedVenue(next);

  if (nextVenue.name !== currentVenue.name) request.venue_name = nextVenue.name;
  if (nextVenue.address !== currentVenue.address) request.location = nextVenue.address || null;
  if (next.day !== current.day) request.day = dayFullName(next.day);
  if (next.start !== current.start) request.time = toStoredTime(next.start);
  if (next.end !== current.end) request.latest_end_time = toStoredTime(next.end);
  if (next.freq !== current.freq || next.note !== current.note) {
    const { frequency, frequency_custom_text } = toFrequency(next);
    request.frequency = frequency;
    request.frequency_custom_text = frequency_custom_text;
  }
  if (next.cost !== current.cost || next.price !== current.price) {
    request.cost = costText(next) || null;
  }
  if (
    next.signup !== current.signup ||
    next.link !== current.link ||
    next.order !== current.order
  ) {
    request.signup_method = toSignupMethod(next);
    request.signup_url = next.signup === "Online link" ? next.link.trim() || null : null;
    request.sign_up_instructions =
      next.signup === "Lineup order" ? next.order || null : next.link.trim() || null;
  }

  return request;
}
