import { useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Bell, ChevronRight, MapPin } from "lucide-react";

import SEO from "@/components/SEO";
import { V3Chip, VenueArtwork, VenueBubble, VenueName } from "@/components/v3/V3Primitives";
import { useIsDesktop } from "@/hooks/useIsDesktop";
import { useMicSkips } from "@/hooks/useMicSkips";
import { useNow } from "@/hooks/useNow";
import { useOpenMics } from "@/hooks/useOpenMics";
import { useMicOfTheDay } from "@/hooks/useMicOfTheDay";
import { v3colors, V3_DISPLAY_STYLE } from "@/theme/v3";
import { buildHomeRows, type HomeEntry } from "@/utils/homeRows";
import {
  buildVenues,
  eventWhenLabel,
  formatMinutes,
  micIdOf,
  type Venue,
} from "@/utils/venues";

/**
 * Home, from Main.dc.html: a Comediq blue header with the wordmark, then rows
 * of venue cards.
 *
 * Phone keeps the horizontal carousels from the boards. Desktop turns each row
 * into a 4-column grid with a "See all" link, and pins Mic of the Day as a
 * wide hero card at the top — per the Home line in
 * docs/design/storytime-redesign/WEB_AND_HOST_PLAN.md.
 *
 * The rows themselves come from `buildHomeRows`, shared with the app.
 */

function micHref(entry: HomeEntry): string {
  const id = micIdOf(entry.event.mic);
  return id ? `/v3/mic/${encodeURIComponent(id)}` : "/open-mics";
}

function MicCard({ entry, wide = false }: { entry: HomeEntry; wide?: boolean }) {
  const { venue, event } = entry;

  return (
    <Link
      to={micHref(entry)}
      className={`flex flex-col gap-2 text-left ${wide ? "w-full" : "w-44 shrink-0"}`}
    >
      <div className="relative aspect-square w-full overflow-hidden rounded-[28px] shadow-[0_8px_22px_rgba(18,26,51,0.12)]">
        <VenueArtwork
          seed={venue.key}
          bannerUrl={venue.bannerUrl}
          alt={`${venue.name} stage`}
          className="h-full w-full"
        />
        <span className="absolute bottom-2.5 right-2.5">
          <VenueBubble
            seed={venue.key}
            initials={venue.initials}
            iconUrl={venue.iconUrl}
            isComediqRun={event.isComediqRun}
            size={46}
          />
        </span>
      </div>
      <div className="px-1">
        <VenueName className="block truncate text-base" style={{ color: v3colors.ink }}>
          {venue.name}
        </VenueName>
        <div className="mt-0.5 truncate text-[15px]" style={{ color: v3colors.muted }}>
          {event.startMinutes === null
            ? event.name
            : `${formatMinutes(event.startMinutes)} · ${event.name}`}
        </div>
      </div>
    </Link>
  );
}

function MicOfTheDayHero({ venues }: { venues: Venue[] }) {
  // useMicOfTheDay hands back the winning OpenMic row itself; this finds the
  // venue it belongs to so the hero can reuse the same artwork and bubble.
  const { mic: motdMic } = useMicOfTheDay();

  const entry = useMemo(() => {
    const micId = motdMic?.uniqueIdentifier;
    if (!micId) return null;
    for (const venue of venues) {
      const event = venue.events.find((candidate) => micIdOf(candidate.mic) === micId);
      if (event) return { venue, event };
    }
    return null;
  }, [motdMic, venues]);

  if (!entry) return null;

  return (
    <Link
      to={micHref(entry)}
      className="flex items-center gap-6 overflow-hidden rounded-[32px] bg-white p-5 shadow-[0_10px_30px_rgba(18,26,51,0.08)]"
      style={{ border: `1px solid ${v3colors.borderSoft}` }}
    >
      <div className="relative h-36 w-36 shrink-0 overflow-hidden rounded-[26px]">
        <VenueArtwork
          seed={entry.venue.key}
          bannerUrl={entry.venue.bannerUrl}
          className="h-full w-full"
        />
      </div>
      <div className="min-w-0 flex-1">
        <V3Chip tone="blue">Mic of the day</V3Chip>
        <VenueName className="mt-3 block truncate text-3xl" style={{ color: v3colors.ink }}>
          {entry.venue.name}
        </VenueName>
        <p className="mt-1 text-lg" style={{ color: v3colors.muted }}>
          {entry.event.name} · {eventWhenLabel(entry.event)}
        </p>
      </div>
      <ChevronRight className="h-7 w-7 shrink-0" style={{ color: v3colors.royal }} />
    </Link>
  );
}

export default function V3Home() {
  const isDesktop = useIsDesktop();
  const navigate = useNavigate();
  const now = useNow();
  const { skips } = useMicSkips();
  const { data: mics = [], isLoading } = useOpenMics();

  const venues = useMemo(() => buildVenues(mics, now, skips), [mics, now, skips]);
  const rows = useMemo(() => buildHomeRows(venues), [venues]);

  /**
   * The boards show "East Village, NY" under the wordmark. There is no reverse
   * geocoding here, so this names the borough most of the listed mics sit in
   * rather than the visitor's actual neighbourhood — same compromise the app
   * makes, and the same TODO.
   */
  const area = useMemo(() => {
    const counts = new Map<string, number>();
    for (const venue of venues) {
      if (!venue.borough) continue;
      counts.set(venue.borough, (counts.get(venue.borough) ?? 0) + 1);
    }
    let best: string | null = null;
    let bestCount = 0;
    for (const [borough, count] of counts) {
      if (count > bestCount) {
        bestCount = count;
        best = borough;
      }
    }
    return best;
  }, [venues]);

  return (
    <div className="min-h-screen font-dmsans" style={{ background: v3colors.cream }}>
      <SEO
        title="Comediq - NYC comedy open mics and shows"
        description="Find an open mic in New York tonight. What is happening now, what is on next, and where."
      />

      {/* Desktop gets the top nav from V3TabBar, so it does not repeat the
          blue hero header the phone needs. */}
      {!isDesktop && (
        <header
          className="rounded-b-[32px] px-6 pb-6 pt-14"
          style={{ background: v3colors.royal, color: v3colors.cream }}
        >
          <div className="flex items-start justify-between">
            <div className="flex flex-col gap-2.5">
              <div className="flex items-center gap-2.5">
                <img src="/map-pins/comediq_logo_pin.png" alt="" className="h-9 w-6 object-contain" />
                <span style={{ ...V3_DISPLAY_STYLE, fontSize: 36 }}>Comediq</span>
              </div>
              <div
                className="flex items-center gap-1 text-base font-semibold"
                style={{ color: v3colors.sky }}
              >
                <MapPin className="h-4 w-4" aria-hidden="true" />
                {area ? `${area}, NY` : "New York, NY"}
              </div>
            </div>
            <Link
              to="/profile"
              aria-label="Notifications"
              className="flex h-12 w-12 items-center justify-center"
            >
              <Bell className="h-6 w-6" aria-hidden="true" />
            </Link>
          </div>
        </header>
      )}

      <div className={isDesktop ? "mx-auto max-w-6xl px-8 py-8" : "pb-40"}>
        {isDesktop && (
          <div className="mb-8">
            <MicOfTheDayHero venues={venues} />
          </div>
        )}

        {isLoading && rows.length === 0 && (
          <p className={isDesktop ? "text-base" : "px-6 pt-6 text-base"} style={{ color: v3colors.muted }}>
            Loading tonight's mics…
          </p>
        )}

        {!isLoading && rows.length === 0 && (
          <div className={isDesktop ? "" : "px-6 pt-6"}>
            <p className="text-base" style={{ color: v3colors.muted }}>
              Nothing listed right now. The map has every mic we know about.
            </p>
            <button
              type="button"
              onClick={() => navigate("/open-mics")}
              className="mt-4 h-12 rounded-full px-6 text-base font-bold text-white"
              style={{ background: v3colors.royal }}
            >
              Open the map
            </button>
          </div>
        )}

        {rows.map((row) => (
          <section key={row.id} className={isDesktop ? "mb-10" : "mt-6"}>
            <div
              className={`mb-3 flex items-center justify-between ${isDesktop ? "" : "pl-6 pr-4"}`}
            >
              <h2 className="text-[22px] font-bold" style={{ color: v3colors.ink }}>
                {row.title}
              </h2>
              {/* Desktop gets the worded "See all" the plan asks for; the
                  phone keeps the boards' chevron. */}
              <Link
                to="/open-mics"
                className="flex items-center gap-1 text-base font-semibold"
                style={{ color: v3colors.royal }}
                aria-label={`See all: ${row.title}`}
              >
                {isDesktop && "See all"}
                <ChevronRight className="h-5 w-5" aria-hidden="true" />
              </Link>
            </div>

            {isDesktop ? (
              <div className="grid grid-cols-2 gap-5 md:grid-cols-3 xl:grid-cols-4">
                {row.entries.slice(0, 8).map((entry) => (
                  <MicCard key={`${row.id}-${entry.event.id}`} entry={entry} wide />
                ))}
              </div>
            ) : (
              <div className="flex gap-3.5 overflow-x-auto px-6 pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                {row.entries.map((entry) => (
                  <MicCard key={`${row.id}-${entry.event.id}`} entry={entry} />
                ))}
              </div>
            )}
          </section>
        ))}
      </div>
    </div>
  );
}
