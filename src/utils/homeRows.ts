// The rows on Home.
//
// Port of the mobile app's `buildRows` (src/components/home/HomeScreen.tsx),
// so the site and the app group the night the same way.
//
// Main.dc.html's own row titles ("Tonight Near You", "Bringer Mics") are
// hard-coded demo data. These rows are derived from the mic rows we actually
// have, and the titles are sentence case, per the spec.

import type { Venue, VenueEvent } from "@/utils/venues";

export interface HomeEntry {
  venue: Venue;
  event: VenueEvent;
}

export interface HomeRow {
  /** Stable id, used for the "See all" link and React keys. */
  id: string;
  title: string;
  entries: HomeEntry[];
}

/** Every event at every venue, flattened, so a row shows one card per mic. */
function flatten(venues: Venue[]): HomeEntry[] {
  return venues.flatMap((venue) => venue.liveEvents.map((event) => ({ venue, event })));
}

function byStart(a: HomeEntry, b: HomeEntry): number {
  return (a.event.startMinutes ?? 1e9) - (b.event.startMinutes ?? 1e9);
}

/** A row's text match looks at the mic's cost and signup wording. */
function micText(entry: HomeEntry): string {
  const mic = entry.event.mic;
  return [mic.cost, mic.signUpInstructions, mic.legacyTag, entry.event.signupStyle]
    .filter(Boolean)
    .join(" ");
}

export function buildHomeRows(venues: Venue[]): HomeRow[] {
  const all = flatten(venues);

  const rows: HomeRow[] = [
    {
      id: "now",
      title: "Happening now",
      entries: all.filter((item) => item.event.status === "now").sort(byStart),
    },
    {
      id: "next",
      title: "On later tonight",
      entries: all.filter((item) => item.event.status === "next").sort(byStart),
    },
    {
      id: "comediq",
      title: "Comediq mics",
      entries: all.filter((item) => item.event.isComediqRun).sort(byStart),
    },
    {
      id: "bringer",
      title: "Bringer mics",
      entries: all.filter((item) => /bringer|bring a guest|bring 1/i.test(micText(item))).sort(byStart),
    },
    {
      id: "free",
      title: "Free mics",
      entries: all
        .filter((item) => /^\s*free|no cover|\$0/i.test(item.event.mic.cost ?? ""))
        .sort(byStart),
    },
    {
      id: "week",
      title: "Later this week",
      entries: all.filter((item) => item.event.status === "other-day").sort(byStart),
    },
  ];

  return rows.filter((row) => row.entries.length > 0);
}
