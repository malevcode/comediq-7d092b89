/**
 * One place that turns whatever a person types into the time format the database
 * uses everywhere: "7:00 PM". The SQL function normalize_mic_time (see
 * supabase/migrations/20261110140000_normalize_mic_times.sql) does the same thing, so
 * mics added or edited by any path end up the same.
 *
 * Rules:
 * - "7", "7pm", "7:30p", "730", "19:30" all work.
 * - Hours 1 to 12 with no AM or PM are read as PM. Comedy happens at night.
 * - Anything unreadable is left as typed.
 */

const TIME_RE = /^(\d{1,2})(?::?(\d{2}))?\s*([ap])?\.?m?\.?$/i;
const CANONICAL_RE = /^(1[0-2]|[1-9]):[0-5][0-9] (AM|PM)$/;

export const isCanonicalMicTime = (t: string | null | undefined): boolean => !!t && CANONICAL_RE.test(t);

/** Minutes after midnight for a canonical "7:00 PM". */
const toMinutes = (canonical: string): number => {
  const [, h, m, ap] = canonical.match(/^(\d{1,2}):(\d{2}) (AM|PM)$/)!;
  return (parseInt(h, 10) % 12) * 60 + parseInt(m, 10) + (ap === 'PM' ? 12 * 60 : 0);
};

export function normalizeMicTime(raw: string | null | undefined): string {
  const text = (raw ?? '').trim();
  const m = text.match(TIME_RE);
  if (!m) return text;
  let hours = parseInt(m[1], 10);
  const mins = m[2] ? parseInt(m[2], 10) : 0;
  if (mins > 59 || hours > 23) return text;
  const pm = m[3] ? m[3].toLowerCase() === 'p' : hours !== 0;
  if (hours > 12) hours -= 12;
  if (hours === 0) hours = 12;
  return `${hours}:${mins.toString().padStart(2, '0')} ${pm ? 'PM' : 'AM'}`;
}

const hasSuffix = (t: string) => /[ap]\.?m?\.?\s*$/i.test(t.trim());

/**
 * Cleans a start and end time together.
 * - "7-9" typed in the start box becomes 7:00 PM and 9:00 PM.
 * - An end time typed with no AM or PM that would land at or before the start is read as
 *   after midnight: "11" to "1" is 11:00 PM to 1:00 AM.
 */
export function resolveMicTimes(startRaw: string, endRaw = ''): { start: string; end: string } {
  let startText = startRaw.trim();
  let endText = endRaw.trim();

  const range = startText.match(/^(.+?)\s*[-–—]\s*(.+)$/);
  if (range && isCanonicalMicTime(normalizeMicTime(range[1])) && isCanonicalMicTime(normalizeMicTime(range[2]))) {
    startText = range[1];
    if (!endText) endText = range[2];
  }

  const start = normalizeMicTime(startText);
  let end = normalizeMicTime(endText);
  if (isCanonicalMicTime(start) && isCanonicalMicTime(end) && !hasSuffix(endText) && toMinutes(end) <= toMinutes(start)) {
    const flipped = (toMinutes(end) + 12 * 60) % (24 * 60);
    end = minutesToLabel(flipped);
  }
  return { start, end };
}

function minutesToLabel(total: number): string {
  const h24 = Math.floor(total / 60) % 24;
  const mm = total % 60;
  return `${h24 % 12 || 12}:${mm.toString().padStart(2, '0')} ${h24 >= 12 ? 'PM' : 'AM'}`;
}
