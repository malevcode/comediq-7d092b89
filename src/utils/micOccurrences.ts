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
 * Only frequencies the schedule actually pins down get a list. Bi-weekly needs
 * an anchor date we do not store, one-offs do not repeat, and custom schedules
 * live in free text, so all three return an empty list rather than a guess.
 */
export function getUpcomingOccurrences(
  day: string | undefined | null,
  frequency: MicFrequency,
  count = 5,
  from: Date = new Date(),
): Date[] {
  const weekday = weekdayIndex(day);
  if (weekday === null) return [];

  const today = startOfDay(from);

  if (frequency === "weekly") {
    const first = new Date(today);
    first.setDate(today.getDate() + ((weekday - today.getDay() + 7) % 7));
    return Array.from({ length: count }, (_, i) => {
      const date = new Date(first);
      date.setDate(first.getDate() + i * 7);
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
