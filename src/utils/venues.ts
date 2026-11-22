// Turns the flat mic rows into the venue-and-event shape the v3 map needs:
// one bubble per venue, and per venue the events that have not ended yet.
//
// Source of truth: docs/design/storytime-redesign-v3/SPEC.md, "Map rules".
//
// This is the web port of the mobile app's `src/utils/venues.ts`
// (malevcode/comediq-app). The two files are kept deliberately close so a
// comic sees the same "Happening now" on the phone and on the site. The only
// real difference is the input shape: the app reads snake_case rows straight
// from Postgres, the web reads the camelCase `OpenMic` that
// `useOpenMics`/mics.json already produce.
//
// Pure on purpose: no React, no Supabase, so the grouping and the time maths
// can be reasoned about on their own.

import type { OpenMic } from '@/types/openMic';

export const DAY_NAMES = [
  'Sunday',
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
] as const;

/**
 * Fallback length, used only when a row has no `latestEndTime`.
 *
 * `open_mics_historical.latest_end_time` is a real column, so the end time is
 * read rather than assumed wherever it is filled in. Plenty of the scraped
 * historical rows leave it empty, hence the fallback.
 */
export const ASSUMED_EVENT_MINUTES = 120;

export type EventStatus = 'now' | 'next' | 'ended' | 'other-day';

/** Comediq-run mics are largest and use the Q logo, per the spec. */
export type VenueTier = 'comediq' | 'today' | 'other';

export interface VenueEvent {
  /** Stable id for list keys and navigation. */
  id: string;
  /** The mic row this came from, so screens can link through to detail. */
  mic: OpenMic;
  name: string;
  /** 0 = Sunday, matching Date#getDay. Null when the row has no usable day. */
  dayIndex: number | null;
  /** Minutes past midnight, or null when the row has no usable time. */
  startMinutes: number | null;
  endMinutes: number | null;
  status: EventStatus;
  signupStyle: string | null;
  host: string | null;
  isComediqRun: boolean;
}

export interface Venue {
  key: string;
  name: string;
  /** Square banner, from open_mics_historical.cover_image_url. */
  bannerUrl: string | null;
  /** Circular map bubble image, from open_mics_historical.map_icon_url. */
  iconUrl: string | null;
  /** Host-written labels, from open_mics_historical.tags. */
  tags: string[];
  /** Up to two letters, shown inside the bubble when there is no logo. */
  initials: string;
  latitude: number;
  longitude: number;
  borough: string | null;
  tier: VenueTier;
  /** Faded on the map. */
  isUnverified: boolean;
  /** Every event at this venue, including ones that already ended. */
  events: VenueEvent[];
  /** Events that have not ended: "now" first, then "next", then other days. */
  liveEvents: VenueEvent[];
  /**
   * Just tonight: "now" first, then "next". This is what the tapped-venue
   * cards show.
   *
   * `liveEvents` also carries this venue's mics on *other* days, which the
   * host screens and the venue page want. The map preview does not: the
   * boards show two cards for Rodney's, and the header only ever counts "N
   * now, N next". Rendering `liveEvents` there gives The Buddha Room — a real
   * row with 30 weekly mics — a 27-card swipe, which is not the approved
   * design. Hence the narrower list.
   */
  tonightEvents: VenueEvent[];
  /** Mics here on other days, for the "also on" line under the cards. */
  otherDayCount: number;
  nowCount: number;
  nextCount: number;
}

function text(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

export function venueNameOf(mic: OpenMic): string {
  return text(mic.venueName) ?? text(mic.location) ?? text(mic.openMic) ?? 'Unnamed venue';
}

export function micNameOf(mic: OpenMic): string {
  return text(mic.openMic) ?? venueNameOf(mic);
}

export function hostOf(mic: OpenMic): string | null {
  return text(mic.hosts);
}

export function signupStyleOf(mic: OpenMic): string | null {
  return text(mic.signupMethod);
}

export function micIdOf(mic: OpenMic): string | null {
  return text(mic.uniqueIdentifier) ?? text(mic.id);
}

/**
 * `isComediqRun` comes from the real `is_comediq_run` boolean column. The
 * host-name check stays only as a fallback for rows predating the column.
 */
export function isComediqRun(mic: OpenMic): boolean {
  if (typeof mic.isComediqRun === 'boolean') return mic.isComediqRun;
  const host = hostOf(mic);
  return host !== null && /comediq/i.test(host);
}

/** "RM" from "The Rusty Mic". Leading articles are skipped. */
export function initialsOf(name: string): string {
  const words = name
    .replace(/[^A-Za-z0-9 ]/g, ' ')
    .split(/\s+/)
    .filter((word) => word.length > 0 && !/^(the|a|an|at|of)$/i.test(word));

  const source = words.length > 0 ? words : name.split(/\s+/).filter(Boolean);
  if (source.length === 0) return '?';
  if (source.length === 1) return source[0].slice(0, 2).toUpperCase();
  return (source[0][0] + source[1][0]).toUpperCase();
}

export function dayIndexOf(mic: OpenMic): number | null {
  const raw = text(mic.day);
  if (!raw) return null;
  const lower = raw.toLowerCase();
  const found = DAY_NAMES.findIndex((day) => lower.startsWith(day.slice(0, 3).toLowerCase()));
  return found === -1 ? null : found;
}

/** Minutes past midnight from "7:00 PM", "19:00", "7pm", "7". */
export function parseStartMinutes(value: unknown): number | null {
  const raw = text(value);
  if (!raw) return null;

  const twelveHour = raw.match(/^(\d{1,2})(?::(\d{2}))?\s*(a\.?m\.?|p\.?m\.?)/i);
  if (twelveHour) {
    const [, hourText, minuteText = '00', period] = twelveHour;
    let hour = Number(hourText) % 12;
    if (/^p/i.test(period)) hour += 12;
    const minute = Number(minuteText);
    if (!Number.isFinite(hour) || !Number.isFinite(minute) || minute > 59) return null;
    return hour * 60 + minute;
  }

  const twentyFourHour = raw.match(/^(\d{1,2}):(\d{2})/);
  if (twentyFourHour) {
    const hour = Number(twentyFourHour[1]);
    const minute = Number(twentyFourHour[2]);
    if (hour > 23 || minute > 59) return null;
    return hour * 60 + minute;
  }

  return null;
}

export function startMinutesOf(mic: OpenMic): number | null {
  return parseStartMinutes(mic.startTime);
}

/** The row's own end time, falling back to start + ASSUMED_EVENT_MINUTES. */
export function endMinutesOf(mic: OpenMic, startMinutes: number | null): number | null {
  if (startMinutes === null) return null;
  const stated = parseStartMinutes(mic.latestEndTime);
  if (stated === null) return startMinutes + ASSUMED_EVENT_MINUTES;
  // A mic that runs past midnight ends "before" it starts on a 24h clock.
  return stated <= startMinutes ? stated + 1440 : stated;
}

/** "6:10 PM" from 1090. */
export function formatMinutes(minutes: number): string {
  const wrapped = ((minutes % 1440) + 1440) % 1440;
  const hour24 = Math.floor(wrapped / 60);
  const minute = wrapped % 60;
  const period = hour24 >= 12 ? 'PM' : 'AM';
  const hour = hour24 % 12 || 12;
  return `${hour}:${String(minute).padStart(2, '0')} ${period}`;
}

export function minutesOfDay(date: Date): number {
  return date.getHours() * 60 + date.getMinutes();
}

function statusOf(
  dayIndex: number | null,
  startMinutes: number | null,
  endMinutes: number | null,
  today: number,
  nowMinutes: number,
): EventStatus {
  if (dayIndex === null || dayIndex !== today) return 'other-day';
  if (startMinutes === null || endMinutes === null) return 'other-day';
  if (nowMinutes >= endMinutes) return 'ended';
  if (nowMinutes >= startMinutes) return 'now';
  return 'next';
}

/** Ordering for the swipeable cards: happening now first, then by start time. */
const STATUS_ORDER: Record<EventStatus, number> = {
  now: 0,
  next: 1,
  'other-day': 2,
  ended: 3,
};

function coordinateOf(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string') {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

/** ~11 m, so two rows at the same address land in the same venue. */
function coordinateKey(latitude: number, longitude: number): string {
  return `${latitude.toFixed(4)},${longitude.toFixed(4)}`;
}

/** "<micId>|<YYYY-MM-DD>" for every date a mic is not happening. */
export type SkipKeys = ReadonlySet<string>;

export function skipKey(micId: string, isoDate: string): string {
  return `${micId}|${isoDate}`;
}

export function isoDateOf(date: Date): string {
  const month = `${date.getMonth() + 1}`.padStart(2, '0');
  const day = `${date.getDate()}`.padStart(2, '0');
  return `${date.getFullYear()}-${month}-${day}`;
}

export function buildVenues(
  mics: OpenMic[],
  now: Date = new Date(),
  skips: SkipKeys = new Set<string>(),
): Venue[] {
  const today = now.getDay();
  const nowMinutes = minutesOfDay(now);
  const todayIsoDate = isoDateOf(now);
  const groups = new Map<string, { mics: OpenMic[]; latitude: number; longitude: number }>();

  for (const mic of mics) {
    const latitude = coordinateOf(mic.latitude);
    const longitude = coordinateOf(mic.longitude);
    if (latitude === null || longitude === null) continue;

    const name = venueNameOf(mic).toLowerCase();
    const key = `${name}@${coordinateKey(latitude, longitude)}`;
    const existing = groups.get(key);
    if (existing) {
      existing.mics.push(mic);
    } else {
      groups.set(key, { mics: [mic], latitude, longitude });
    }
  }

  const venues: Venue[] = [];

  for (const [key, group] of groups) {
    const events: VenueEvent[] = group.mics.map((mic, index) => {
      const dayIndex = dayIndexOf(mic);
      const startMinutes = startMinutesOf(mic);
      const endMinutes = endMinutesOf(mic, startMinutes);
      const micId = micIdOf(mic);
      // A host can take one night off without delisting the mic. A skipped
      // date is treated as already over, so it drops out of the map and the
      // lists exactly like an ended event.
      const skippedToday = micId !== null && skips.has(skipKey(micId, todayIsoDate));

      return {
        id: micId ?? `${key}#${index}`,
        mic,
        name: micNameOf(mic),
        dayIndex,
        startMinutes,
        endMinutes,
        status: skippedToday
          ? 'ended'
          : statusOf(dayIndex, startMinutes, endMinutes, today, nowMinutes),
        signupStyle: signupStyleOf(mic),
        host: hostOf(mic),
        isComediqRun: isComediqRun(mic),
      };
    });

    const liveEvents = events
      .filter((event) => event.status !== 'ended')
      .sort((a, b) => {
        const byStatus = STATUS_ORDER[a.status] - STATUS_ORDER[b.status];
        if (byStatus !== 0) return byStatus;
        return (
          (a.startMinutes ?? Number.MAX_SAFE_INTEGER) - (b.startMinutes ?? Number.MAX_SAFE_INTEGER)
        );
      });

    const tonightEvents = liveEvents.filter(
      (event) => event.status === 'now' || event.status === 'next',
    );
    const nowCount = events.filter((event) => event.status === 'now').length;
    const nextCount = events.filter((event) => event.status === 'next').length;
    const otherDayCount = events.filter((event) => event.status === 'other-day').length;
    const name = venueNameOf(group.mics[0]);

    const tier: VenueTier = events.some((event) => event.isComediqRun)
      ? 'comediq'
      : nowCount + nextCount > 0
        ? 'today'
        : 'other';

    const withBanner = group.mics.find((mic) => text(mic.coverImageUrl) !== null);
    const withIcon = group.mics.find((mic) => text(mic.mapIconUrl) !== null);
    const withTags = group.mics.find((mic) => Array.isArray(mic.tags) && mic.tags.length > 0);

    venues.push({
      key,
      name,
      bannerUrl: text(withBanner?.coverImageUrl),
      iconUrl: text(withIcon?.mapIconUrl),
      tags: withTags?.tags ?? [],
      initials: initialsOf(name),
      latitude: group.latitude,
      longitude: group.longitude,
      borough: text(group.mics[0].borough),
      tier,
      // `status` is the real signal: a host's new listing comes in as 'trial'
      // and an admin promotes it to 'verified'. Rows with no status at all are
      // the scraped historical ones, which are treated as verified.
      isUnverified: group.mics.every(
        (mic) => typeof mic.status === 'string' && mic.status !== 'verified',
      ),
      events,
      liveEvents,
      tonightEvents,
      otherDayCount,
      nowCount,
      nextCount,
    });
  }

  return venues;
}

/** Header line for a tapped venue: "6:10 PM · 1 now, 1 next". */
export function venueHeaderSummary(venue: Venue, now: Date = new Date()): string {
  return `${formatMinutes(minutesOfDay(now))} · ${venue.nowCount} now, ${venue.nextCount} next`;
}

/** "Happening now · until 7:00 PM" / "Next · 9:30 PM" / "Thursday · 7:00 PM". */
export function eventWhenLabel(event: VenueEvent): string {
  if (event.status === 'now') {
    return event.endMinutes === null
      ? 'Happening now'
      : `Happening now · until ${formatMinutes(event.endMinutes)}`;
  }
  if (event.status === 'next') {
    return event.startMinutes === null ? 'Next' : `Next · ${formatMinutes(event.startMinutes)}`;
  }
  const day = event.dayIndex === null ? null : DAY_NAMES[event.dayIndex];
  const time = event.startMinutes === null ? null : formatMinutes(event.startMinutes);
  if (day && time) return `${day} · ${time}`;
  return day ?? time ?? 'Time to be confirmed';
}

/** The spec gives "now" a Join now button and everything else Sign up. */
export function eventCtaLabel(event: VenueEvent): string {
  return event.status === 'now' ? 'Join now' : 'Sign up';
}

/** The grey line under an event's name on the preview cards. */
export function eventMetaLine(event: VenueEvent): string {
  const parts: string[] = [];

  if (event.status === 'now' && event.startMinutes !== null) {
    parts.push(`Started ${formatMinutes(event.startMinutes)}`);
  }
  if (event.signupStyle) parts.push(event.signupStyle);
  if (event.isComediqRun) parts.push('By Comediq');
  else if (event.host) parts.push(`Hosted by ${event.host}`);

  return parts.join(' · ');
}

/**
 * Venues the map should draw, smaller tiers first so the bigger bubbles are
 * painted on top ("Bigger on top" in the spec).
 */
const TIER_SORT: Record<VenueTier, number> = { comediq: 3, today: 2, other: 1 };

export function sortVenuesForDrawing(venues: Venue[]): Venue[] {
  return [...venues].sort((a, b) => TIER_SORT[a.tier] - TIER_SORT[b.tier]);
}

/** Map list order: what is on tonight first, then everything else by name. */
export function sortVenuesForList(venues: Venue[]): Venue[] {
  return [...venues].sort((a, b) => {
    const aLive = a.nowCount + a.nextCount > 0 ? 0 : 1;
    const bLive = b.nowCount + b.nextCount > 0 ? 0 : 1;
    if (aLive !== bLive) return aLive - bLive;
    if (aLive === 0) {
      const aStart = a.liveEvents[0]?.startMinutes ?? Number.MAX_SAFE_INTEGER;
      const bStart = b.liveEvents[0]?.startMinutes ?? Number.MAX_SAFE_INTEGER;
      if (aStart !== bStart) return aStart - bStart;
    }
    return a.name.localeCompare(b.name);
  });
}
