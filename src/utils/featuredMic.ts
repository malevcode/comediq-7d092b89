import type { FeaturedMicEntry, FeaturedSource } from "@/config/featuredMics";
import { micKnownToRunOn, toIsoDate } from "@/utils/micOccurrences";
import type { OpenMic } from "@/types/openMic";

const PRIORITY: FeaturedSource[] = ["sponsor", "comediq_pick", "mic_of_the_month"];

/** Today's date in New York, as a Date at local midnight with that calendar day. */
function nyToday(now: Date): Date {
  const [y, m, d] = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/New_York",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  })
    .format(now)
    .split("-")
    .map(Number);
  return new Date(y, m - 1, d);
}

/**
 * The one mic to feature today, or null. Takes entries in priority order (sponsor, then
 * Comediq pick, then Mic of the Month winner; first listed wins within a source), skips
 * ones outside their dates, and only returns a mic that is actually happening today.
 */
export function pickFeaturedMic(
  mics: OpenMic[],
  entries: FeaturedMicEntry[],
  now: Date = new Date(),
): { mic: OpenMic; source: FeaturedSource } | null {
  const today = nyToday(now);
  const iso = toIsoDate(today);
  const ordered = [...entries].sort((a, b) => PRIORITY.indexOf(a.source) - PRIORITY.indexOf(b.source));

  for (const entry of ordered) {
    if (entry.from && iso < entry.from) continue;
    if (entry.through && iso > entry.through) continue;
    const mic = mics.find((m) => m.uniqueIdentifier === entry.micUniqueIdentifier);
    if (!mic) continue;
    if (!micKnownToRunOn(mic, today)) continue;
    return { mic, source: entry.source };
  }
  return null;
}
