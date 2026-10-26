import type { MicFrequency } from "@/types/openMic";

const DAY_NAMES = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

/** Which nth weekday of the month each frequency means. -1 stands for "the last one". */
const NTH_OF_MONTH: Partial<Record<MicFrequency, number>> = {
  "1st_of_month": 1,
  "2nd_of_month": 2,
  "3rd_of_month": 3,
  "4th_of_month": 4,
  last_of_month: -1,
};

/** Turns "Thursday" into 4. Returns null for anything that is not a weekday name. */
export function weekdayIndex(day?: string | null): number | null {
  if (!day) return null;
  const index = DAY_NAMES.findIndex(
    (name) => name.toLowerCase() === day.trim().toLowerCase(),
  );
  return index === -1 ? null : index;
}

/** Midnight today, so comparisons ignore the time of day. */
function startOfDay(date: Date): Date {
  const copy = new Date(date);
  copy.setHours(0, 0, 0, 0);
  return copy;
}

/** The date of the nth (or last, for -1) given weekday in a given month. */
function nthWeekdayOfMonth(
  year: number,
  month: number,
  weekday: number,
  nth: number,
): Date {
  if (nth === -1) {
    const lastDay = new Date(year, month + 1, 0);
    const shift = (lastDay.getDay() - weekday + 7) % 7;
    lastDay.setDate(lastDay.getDate() - shift);
    return startOfDay(lastDay);
  }

  const first = new Date(year, month, 1);
  const shift = (weekday - first.getDay() + 7) % 7;
  return startOfDay(new Date(year, month, 1 + shift + (nth - 1) * 7));
}

/**
 * The next few dates this mic runs, today included when today is its day.
 *
 * Only frequencies the schedule actually pins down get a list. Bi-weekly gets
 * one only when it carries an anchor date (see parseBiweeklyAnchor); one-offs do
 * not repeat and custom schedules live in free text, so those return an empty
 * list rather than a guess.
 */
export function getUpcomingOccurrences(
  day: string | undefined | null,
  frequency: MicFrequency,
  count = 5,
  from: Date = new Date(),
  anchor?: Date | null,
  listedDates?: Date[],
): Date[] {
  const weekday = weekdayIndex(day);
  if (weekday === null) return [];

  const today = startOfDay(from);

  if (frequency === "one_off" || frequency === "custom") {
    return (listedDates ?? []).filter((date) => startOfDay(date) >= today).slice(0, count);
  }

  if (frequency === "weekly") {
    const first = new Date(today);
    first.setDate(today.getDate() + ((weekday - today.getDay() + 7) % 7));
    return Array.from({ length: count }, (_, i) => {
      const date = new Date(first);
      date.setDate(first.getDate() + i * 7);
      return date;
    });
  }

  if (frequency === "bi_weekly") {
    if (!anchor) return [];
    // Step forward in weeks from today until we land on an on-week.
    const first = new Date(today);
    first.setDate(today.getDate() + ((weekday - today.getDay() + 7) % 7));
    while (!runsOnBiweeklyDate(anchor, first)) first.setDate(first.getDate() + 7);
    return Array.from({ length: count }, (_, i) => {
      const date = new Date(first);
      date.setDate(first.getDate() + i * 14);
      return date;
    });
  }

  const nth = NTH_OF_MONTH[frequency];
  if (nth === undefined) return [];

  const dates: Date[] = [];
  for (let offset = 0; dates.length < count && offset < count + 2; offset += 1) {
    const cursor = new Date(today.getFullYear(), today.getMonth() + offset, 1);
    const date = nthWeekdayOfMonth(
      cursor.getFullYear(),
      cursor.getMonth(),
      weekday,
      nth,
    );
    if (date >= today) dates.push(date);
  }
  return dates;
}

/**
 * A bi-weekly mic's anchor: any date it runs, written into its
 * frequency_custom_text as "anchor 2026-10-21". Returns null when none is there.
 */
export function parseBiweeklyAnchor(text?: string | null): Date | null {
  const match = text?.match(/anchor[:\s]+(\d{4})-(\d{2})-(\d{2})/i);
  if (!match) return null;
  return new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
}

/** True when the date is a whole number of two-week steps from the anchor. */
export function runsOnBiweeklyDate(anchor: Date, date: Date): boolean {
  const days = Math.round(
    (startOfDay(date).getTime() - startOfDay(anchor).getTime()) / 86400000,
  );
  return days % 14 === 0;
}

/** Local "YYYY-MM-DD". Not toISOString, which shifts the day in some time zones. */
export function toIsoDate(date: Date): string {
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${date.getFullYear()}-${month}-${day}`;
}

/**
 * The exact dates a pop-up or custom mic runs, written into frequency_custom_text
 * as "dates 2026-10-21,2026-11-04". Sorted. Empty when the mic has none.
 */
export function parseDateList(text?: string | null): Date[] {
  const match = text?.match(/dates[:\s]+(\d{4}-\d{2}-\d{2}(?:\s*,\s*\d{4}-\d{2}-\d{2})*)/i);
  if (!match) return [];
  return match[1]
    .split(",")
    .map((part) => part.trim().split("-").map(Number))
    .map(([y, m, d]) => new Date(y, m - 1, d))
    .sort((a, b) => a.getTime() - b.getTime());
}

/** The free text with the machine-readable anchor and dates removed, for display. */
export function stripScheduleTags(text?: string | null): string {
  return (text ?? "")
    .replace(/dates[:\s]+\d{4}-\d{2}-\d{2}(?:\s*,\s*\d{4}-\d{2}-\d{2})*/gi, "")
    .replace(/anchor[:\s]+\d{4}-\d{2}-\d{2}/gi, "")
    .replace(/[\s.;,]+$/g, "")
    .trim();
}

/** True when the date is one of the listed dates. */
export function isListedDate(dates: Date[], date: Date): boolean {
  return dates.some((listed) => startOfDay(listed).getTime() === startOfDay(date).getTime());
}

/** "Today", "Tomorrow", or "Thu, Sep 25". */
export function formatOccurrence(date: Date, from: Date = new Date()): string {
  const days = Math.round(
    (startOfDay(date).getTime() - startOfDay(from).getTime()) / 86400000,
  );
  if (days === 0) return "Today";
  if (days === 1) return "Tomorrow";
  return date.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

/** "Sep 25" for the compact upcoming chips. */
export function formatOccurrenceShort(date: Date): string {
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}
