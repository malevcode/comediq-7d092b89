/**
 * Is this mic confirmed? A mic is "Unconfirmed" when nobody (host, admin, or enough people
 * checking in at the venue) has confirmed it for 60 days. Unconfirmed mics stay listed, with a
 * grey label, and sort after confirmed ones on the Next tab. Nothing is hidden.
 *
 * Grace period: most mics were last confirmed long before this rule existed, so the 60 days
 * count from GRACE_STARTS at the earliest. Until then nobody is labeled; it gives hosts time to
 * hear from us first. Change GRACE_STARTS (or set it to "1970-01-01") to turn the grace off.
 */
export const UNCONFIRMED_AFTER_DAYS = 60;
export const GRACE_STARTS = "2026-11-16";

type ConfirmationFields = { lastConfirmedAt?: string | null; lastVerifiedAt?: string | null };

const DAY_MS = 24 * 60 * 60 * 1000;

const parse = (value?: string | null): number | null => {
  if (!value) return null;
  const t = new Date(value).getTime();
  return Number.isNaN(t) ? null : t;
};

/** When the mic was last confirmed, or null if we have no date at all. */
export function lastConfirmedTime(mic: ConfirmationFields): Date | null {
  const times = [parse(mic.lastConfirmedAt), parse(mic.lastVerifiedAt)].filter((t): t is number => t !== null);
  return times.length ? new Date(Math.max(...times)) : null;
}

export function isUnconfirmed(mic: ConfirmationFields, now: Date = new Date()): boolean {
  const confirmed = lastConfirmedTime(mic)?.getTime() ?? 0;
  const clockStart = Math.max(confirmed, new Date(`${GRACE_STARTS}T00:00:00Z`).getTime());
  return now.getTime() - clockStart > UNCONFIRMED_AFTER_DAYS * DAY_MS;
}

/** Whole days since the last confirmation, or null if never. */
export function daysSinceConfirmed(mic: ConfirmationFields, now: Date = new Date()): number | null {
  const confirmed = lastConfirmedTime(mic);
  return confirmed ? Math.floor((now.getTime() - confirmed.getTime()) / DAY_MS) : null;
}

/** Stable: confirmed mics keep their order and come first; unconfirmed ones follow, in their order. */
export function confirmedFirst<T extends ConfirmationFields>(mics: T[], now: Date = new Date()): T[] {
  const flagged = mics.map((mic) => ({ mic, unconfirmed: isUnconfirmed(mic, now) }));
  return [...flagged.filter((m) => !m.unconfirmed), ...flagged.filter((m) => m.unconfirmed)].map((m) => m.mic);
}
