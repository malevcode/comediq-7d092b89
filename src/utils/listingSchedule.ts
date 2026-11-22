// Ported verbatim from the mobile app (malevcode/comediq-app,
// src/utils/listingSchedule.ts). Pure, no React and no Supabase, so the two
// platforms share one copy of the rules rather than two that drift.
//
// The date maths behind "Add a listing".
//
// Source of truth: docs/design/storytime-redesign-v3/ListingFlow.dc.html
// (detectCadence / projectDates / summarizeDates) and SPEC.md's line about a
// "calendar with up to 3 next dates that auto-fills day and how often".
//
// Pure on purpose: `npm test` exercises all of it, because getting "every
// other Thursday" or "1st and 3rd Thu" wrong is both easy and invisible until
// a host complains.

export const DAY_SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] as const;
export const DAY_FULL = [
  'Sunday',
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
] as const;

export type DayShort = (typeof DAY_SHORT)[number];
export type Frequency = 'Weekly' | 'Every other week' | 'Monthly' | 'One time';

/** The most dates a host can hand-pick, per the spec. */
export const MAX_PICKS = 3;

const ORDINALS = ['1st', '2nd', '3rd', '4th', '5th'] as const;
const DAY_MS = 86_400_000;

function pad(value: number): string {
  return value < 10 ? `0${value}` : String(value);
}

/** "2026-11-19" for a Date, in local time. */
export function isoOf(date: Date): string {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

/** Noon avoids the date shifting under daylight-saving changes. */
export function parseIso(iso: string): Date {
  return new Date(`${iso}T12:00:00`);
}

export function todayIso(now: Date = new Date()): string {
  return isoOf(now);
}

/** "Thu, Nov 19". */
export function formatIsoDate(iso: string): string {
  if (!iso) return '';
  const date = parseIso(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
}

/** "11/19", for the compact "Next: ..." lines. */
export function formatIsoShort(iso: string): string {
  const date = parseIso(iso);
  return `${date.getMonth() + 1}/${date.getDate()}`;
}

/** "7:00pm" from "19:00". */
export function formatClock(value: string): string {
  if (!value) return '';
  const [hourText, minuteText = '00'] = value.split(':');
  let hour = Number.parseInt(hourText, 10);
  if (!Number.isFinite(hour)) return value;
  const period = hour >= 12 ? 'pm' : 'am';
  hour = hour % 12 || 12;
  return `${hour}:${minuteText}${period}`;
}

export interface Cadence {
  day?: DayShort;
  freq?: Frequency;
  /** "1st and 3rd Thu", only for Monthly. */
  note?: string;
  /** The sentence shown under the calendar explaining what was auto-filled. */
  autoNote: string;
}

/**
 * Reads the picked dates and guesses the day and how often it runs. This is
 * what "auto-fills day and how often" means in the spec.
 *
 * Dates on different weekdays are left alone: there is no single answer, so
 * nothing is filled in.
 */
export function detectCadence(dates: string[]): Cadence {
  if (dates.length === 0) return { autoNote: '' };

  const parsed = dates.map(parseIso);
  const weekdays = new Set(parsed.map((date) => date.getDay()));
  if (weekdays.size !== 1) return { autoNote: '' };

  const weekday = parsed[0].getDay();
  const short = DAY_SHORT[weekday];
  const full = DAY_FULL[weekday];

  if (parsed.length < 2) {
    return { day: short, autoNote: `Set day to ${full} from your date` };
  }

  const sorted = [...parsed].sort((a, b) => a.getTime() - b.getTime());
  const gaps: number[] = [];
  for (let index = 1; index < sorted.length; index += 1) {
    gaps.push(Math.round((sorted[index].getTime() - sorted[index - 1].getTime()) / DAY_MS));
  }

  if (gaps.every((gap) => gap === 7)) {
    return { day: short, freq: 'Weekly', autoNote: `Set to weekly on ${full}s from your dates` };
  }

  if (gaps.every((gap) => gap === 14)) {
    return {
      day: short,
      freq: 'Every other week',
      autoNote: `Set to every other ${full} from your dates`,
    };
  }

  const nths: string[] = [];
  for (const date of sorted) {
    const ordinal = ORDINALS[Math.ceil(date.getDate() / 7) - 1];
    if (ordinal && !nths.includes(ordinal)) nths.push(ordinal);
  }
  const note = `${nths.join(' and ')} ${short}`;

  return {
    day: short,
    freq: 'Monthly',
    note,
    autoNote: `Set to monthly, ${note}, from your dates`,
  };
}

export interface ScheduleInput {
  dates?: string[];
  day?: DayShort | '';
  freq?: Frequency;
}

/**
 * Every upcoming date the listing should run, from the hand-picked dates plus
 * the cadence. Skipped dates are NOT removed here — callers filter them, so
 * the calendar can still show a skipped date as struck through.
 */
export function projectDates(
  input: ScheduleInput,
  today: string,
  horizonDays: number
): string[] {
  const picks = [...(input.dates ?? [])].sort();
  const found = new Set<string>(picks.filter((pick) => pick >= today));

  const weekday = DAY_SHORT.indexOf(input.day as DayShort);
  if (input.freq === 'One time' || weekday < 0) {
    return [...found].sort();
  }

  const cursor = parseIso(picks[0] ?? today);
  while (cursor.getDay() !== weekday) cursor.setDate(cursor.getDate() + 1);
  const end = new Date(parseIso(today).getTime() + horizonDays * DAY_MS);

  if (input.freq === 'Weekly' || input.freq === 'Every other week') {
    const step = input.freq === 'Weekly' ? 7 : 14;
    for (const date = new Date(cursor); date <= end; date.setDate(date.getDate() + step)) {
      const iso = isoOf(date);
      if (iso >= today) found.add(iso);
    }
    return [...found].sort();
  }

  if (input.freq === 'Monthly') {
    const source = picks.length > 0 ? picks.map(parseIso) : [cursor];
    const nths: number[] = [];
    for (const date of source) {
      const nth = Math.ceil(date.getDate() / 7);
      if (!nths.includes(nth)) nths.push(nth);
    }

    for (let month = 0; month < 5; month += 1) {
      const monthStart = new Date(cursor.getFullYear(), cursor.getMonth() + month, 1);
      for (const nth of nths) {
        const date = new Date(monthStart);
        while (date.getDay() !== weekday) date.setDate(date.getDate() + 1);
        date.setDate(date.getDate() + (nth - 1) * 7);
        const iso = isoOf(date);
        if (date.getMonth() === monthStart.getMonth() && iso >= today && date <= end) {
          found.add(iso);
        }
      }
    }
  }

  return [...found].sort();
}

/** "Nov 5, 12, 19" — the month is only repeated when it changes. */
export function summarizeDates(dates: string[]): string {
  if (dates.length === 0) return 'Pick the next 1 to 3 times it happens';

  let lastMonth = '';
  return dates
    .map((iso) => {
      const date = parseIso(iso);
      const month = date.toLocaleDateString('en-US', { month: 'short' });
      const text = month === lastMonth ? String(date.getDate()) : `${month} ${date.getDate()}`;
      lastMonth = month;
      return text;
    })
    .join(', ');
}

/** "Every Thursday, starting Thu, Nov 5" for the preview's When row. */
export function describeWhen(
  input: ScheduleInput & { note?: string },
  firstDate: string
): string {
  const weekday = DAY_SHORT.indexOf(input.day as DayShort);
  const full = weekday >= 0 ? DAY_FULL[weekday] : '';

  if (input.freq === 'Weekly') {
    return `Every ${full}${firstDate ? `, starting ${formatIsoDate(firstDate)}` : ''}`;
  }
  if (input.freq === 'Every other week') {
    return `Every other ${full}${firstDate ? ` from ${formatIsoDate(firstDate)}` : ''}`;
  }
  if (input.freq === 'Monthly') {
    return `Monthly, ${input.note || summarizeDates(input.dates ?? [])}`;
  }
  return `One time, ${formatIsoDate(firstDate)}`;
}

/** "Weekly on Thursdays", for the host's listing rows. */
export function describeCadence(input: ScheduleInput, firstDate: string): string {
  if (input.freq === 'One time') return `One time, ${formatIsoDate(firstDate)}`;
  const weekday = DAY_SHORT.indexOf(input.day as DayShort);
  const full = weekday >= 0 ? DAY_FULL[weekday] : '';
  const label = input.freq ?? 'Weekly';
  return `${label} on ${full}s`;
}

export type DateCellState = 'picked' | 'skipped' | 'scheduled' | 'empty' | 'past';

/**
 * What a tap on the calendar does, per the boards:
 *   picked -> unpick, skipped -> unskip, scheduled -> skip (a cancellation),
 *   empty -> pick, but never more than three picks.
 */
export function toggleDate(
  iso: string,
  picks: string[],
  skips: string[],
  scheduled: string[]
): { dates: string[]; skips: string[]; cadence: Cadence | null } {
  if (picks.includes(iso)) {
    const dates = picks.filter((pick) => pick !== iso);
    return { dates, skips, cadence: detectCadence(dates) };
  }
  if (skips.includes(iso)) {
    return { dates: picks, skips: skips.filter((skip) => skip !== iso), cadence: null };
  }
  if (scheduled.includes(iso)) {
    return { dates: picks, skips: [...skips, iso], cadence: null };
  }
  if (picks.length >= MAX_PICKS) {
    return { dates: picks, skips, cadence: null };
  }
  const dates = [...picks, iso].sort();
  return { dates, skips, cadence: detectCadence(dates) };
}
