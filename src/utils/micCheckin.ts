import { calculateDistance } from "@/components/map/MapUtils";
import type { OpenMic } from "@/types/openMic";

/** How close you have to be to the venue to count as "there". */
export const CHECKIN_RADIUS_METERS = 150;

/** GPS in a basement bar is bad. Forgive up to this much reported error. */
export const MAX_ACCURACY_ALLOWANCE_METERS = 200;

/** The window opens this long before the listed start time. */
export const WINDOW_OPENS_BEFORE_MINUTES = 30;

/** ...and closes this long after it. Long enough to survive a slow list. */
export const WINDOW_CLOSES_AFTER_MINUTES = 180;

const DAY_NAMES = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

const MILES_TO_METERS = 1609.344;

/**
 * Turns "9:30 PM", "9 PM", or "21:30" into minutes past midnight.
 * Returns null for anything it cannot make sense of.
 */
export function parseStartTimeToMinutes(raw?: string | null): number | null {
  if (!raw) return null;

  const match = raw.trim().match(/^(\d{1,2})(?::(\d{2}))?\s*([ap]\.?m\.?)?$/i);
  if (!match) return null;

  let hours = Number(match[1]);
  const minutes = Number(match[2] ?? 0);
  const meridiem = match[3]?.toLowerCase().replace(/\./g, "");

  if (Number.isNaN(hours) || Number.isNaN(minutes)) return null;
  if (minutes > 59) return null;

  if (meridiem === "pm" && hours < 12) hours += 12;
  if (meridiem === "am" && hours === 12) hours = 0;
  if (hours > 23) return null;

  return hours * 60 + minutes;
}

export type CheckinWindow = {
  /** Whether a check-in is allowed right now. */
  isOpen: boolean;
  /** True when the mic has no parseable start time, so we could not gate on it. */
  isUnscheduled: boolean;
  /** When the current or next window opens and closes, if we could work it out. */
  opensAt?: Date;
  closesAt?: Date;
  reason: string;
};

/**
 * Is this mic happening right now?
 *
 * Checks today AND yesterday, because a Wednesday 11pm mic is still the
 * Wednesday mic when it is 12:30am on Thursday and you finally got your spot.
 */
export function evaluateCheckinWindow(
  mic: Pick<OpenMic, "day" | "startTime" | "openMic">,
  now: Date = new Date()
): CheckinWindow {
  const startMinutes = parseStartTimeToMinutes(mic.startTime);

  if (startMinutes === null || !mic.day || !DAY_NAMES.includes(mic.day)) {
    return {
      isOpen: true,
      isUnscheduled: true,
      reason: "This mic has no reliable schedule, so we skipped the time check.",
    };
  }

  let nextOpensAt: Date | undefined;

  // Yesterday first, so a late-night mic that spilled past midnight wins.
  for (const dayOffset of [-1, 0]) {
    const day = new Date(now);
    day.setDate(day.getDate() + dayOffset);
    day.setHours(0, 0, 0, 0);

    if (DAY_NAMES[day.getDay()] !== mic.day) continue;

    const opensAt = new Date(day);
    opensAt.setMinutes(startMinutes - WINDOW_OPENS_BEFORE_MINUTES);

    const closesAt = new Date(day);
    closesAt.setMinutes(startMinutes + WINDOW_CLOSES_AFTER_MINUTES);

    if (now >= opensAt && now <= closesAt) {
      return {
        isOpen: true,
        isUnscheduled: false,
        opensAt,
        closesAt,
        reason: "The mic is running now.",
      };
    }

    if (now < opensAt) nextOpensAt = opensAt;
  }

  return {
    isOpen: false,
    isUnscheduled: false,
    opensAt: nextOpensAt,
    reason: nextOpensAt
      ? `Check-in opens at ${formatClock(nextOpensAt)}, ${WINDOW_OPENS_BEFORE_MINUTES} minutes before the mic starts.`
      : `You can only check in on ${mic.day}, around ${mic.startTime}.`,
  };
}

function formatClock(date: Date) {
  return date.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
}

export type ProximityResult = {
  /** Whether the reading puts you close enough to the venue. */
  isNearby: boolean;
  /** Straight-line distance to the venue in metres. */
  distanceMeters: number;
  /** The radius actually used, after forgiving the reading's own error. */
  allowedMeters: number;
};

/**
 * How far the reading is from the venue, and whether that counts as "there".
 *
 * The allowance grows with the reading's own reported error: a phone that says
 * "you are here, give or take 120m" should not be punished for saying so.
 */
export function evaluateProximity(
  userLat: number,
  userLng: number,
  venueLat: number,
  venueLng: number,
  accuracyMeters?: number | null
): ProximityResult {
  const distanceMeters =
    calculateDistance(userLat, userLng, venueLat, venueLng) * MILES_TO_METERS;

  const allowance = Math.min(
    Math.max(accuracyMeters ?? 0, 0),
    MAX_ACCURACY_ALLOWANCE_METERS
  );
  const allowedMeters = CHECKIN_RADIUS_METERS + allowance;

  return {
    isNearby: distanceMeters <= allowedMeters,
    distanceMeters,
    allowedMeters,
  };
}

/** "80m away" / "1.2km away", for telling someone why they were turned down. */
export function formatMeters(meters: number): string {
  if (meters < 1000) return `${Math.round(meters)}m`;
  return `${(meters / 1000).toFixed(1)}km`;
}
