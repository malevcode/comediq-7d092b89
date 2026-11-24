import { useMemo, useState } from "react";
import { COMEDIQ_Q_INSET, COMEDIQ_Q_LOGO } from "@/lib/brand";

import { useMicSkips } from "@/hooks/useMicSkips";
import { useNow } from "@/hooks/useNow";
import type { OpenMic } from "@/types/openMic";
import { v3bubblePalette, v3colors, V3_DISPLAY_STYLE } from "@/theme/v3";
import {
  buildVenues,
  eventWhenLabel,
  formatMinutes,
  sortVenuesForList,
  type Venue,
} from "@/utils/venues";
import OpenMicsMapRefactored from "./OpenMicsMapRefactored";
import { VenueEventCards } from "./VenueEventCards";

/**
 * The desktop map, per docs/design/storytime-redesign-v3/WebMap.dc.html:
 * a 420px list on the left and the map on the right.
 *
 * WEB_AND_HOST_PLAN.md: "Split view: list on the left (420px, scrolls, same
 * order as map), map on the right. Hover a list row highlights its bubble;
 * tapping a bubble scrolls the list to it. Venue preview card opens over the
 * map, top right."
 *
 * Only rendered at >= 1024px. Below that `OpenMicsMapRefactored` is used on
 * its own, which is the phone layout from MapBubbles.dc.html.
 */


function hashKey(value: string): number {
  let hash = 0;
  for (let index = 0; index < value.length; index += 1) {
    hash = (hash * 31 + value.charCodeAt(index)) % 100000;
  }
  return hash;
}

/** "Happening now: Bringer Show until 7 PM · Next: Minute Mic 9:30 PM". */
function venueRowMeta(venue: Venue): string {
  if (venue.liveEvents.length === 0) {
    return venue.events.length > 0 ? "Nothing left tonight" : "No mics listed";
  }

  return venue.liveEvents
    .slice(0, 2)
    .map((event) => {
      if (event.status === "now") {
        const until = event.endMinutes === null ? "" : ` until ${formatMinutes(event.endMinutes)}`;
        return `Happening now: ${event.name}${until}`;
      }
      if (event.status === "next") {
        const at = event.startMinutes === null ? "" : ` ${formatMinutes(event.startMinutes)}`;
        return `Next: ${event.name}${at}`;
      }
      return `${event.name} · ${eventWhenLabel(event)}`;
    })
    .join(" · ");
}

function VenueRowAvatar({ venue }: { venue: Venue }) {
  const [fill, textColor] = v3bubblePalette[hashKey(venue.key) % v3bubblePalette.length];
  const image = venue.iconUrl ?? (venue.tier === "comediq" ? COMEDIQ_Q_LOGO : null);

  return (
    <span
      aria-hidden="true"
      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full shadow-sm"
      style={{
        backgroundColor: image ? v3colors.white : fill,
        color: image ? undefined : textColor,
        backgroundImage: image ? `url("${image.replace(/"/g, "%22")}")` : undefined,
        backgroundSize: venue.iconUrl ? "cover" : COMEDIQ_Q_INSET,
        backgroundRepeat: "no-repeat",
        backgroundPosition: "center",
        ...(image ? {} : { ...V3_DISPLAY_STYLE, fontSize: 13 }),
        opacity: venue.isUnverified ? 0.6 : 1,
      }}
    >
      {image ? "" : venue.initials}
    </span>
  );
}

interface Props {
  mics: OpenMic[];
  onMicSelect: (mic: OpenMic) => void;
  /** Rendered above the list, e.g. the search field and filter chips. */
  listHeader?: React.ReactNode;
  /** The list's own heading. Sentence case, per the spec. */
  title?: string;
}

export function MapSplitView({
  mics,
  onMicSelect,
  listHeader,
  title = "Mics tonight near you",
}: Props) {
  const now = useNow();
  const { skips } = useMicSkips();
  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  const [hoveredKey, setHoveredKey] = useState<string | null>(null);

  const venues = useMemo(() => buildVenues(mics, now, skips), [mics, now, skips]);
  // Same order the map paints in importance terms: what is on tonight first.
  const rows = useMemo(() => sortVenuesForList(venues), [venues]);
  const selected = useMemo(
    () => venues.find((venue) => venue.key === selectedKey) ?? null,
    [venues, selectedKey],
  );

  return (
    <div className="flex h-full min-h-0 font-dmsans">
      <aside
        className="flex w-[420px] shrink-0 flex-col border-r bg-white"
        style={{ borderColor: v3colors.border }}
        aria-label="Mics on the map"
      >
        <div className="px-5 pb-2.5 pt-4">
          <h2 className="text-[22px] font-bold" style={{ color: v3colors.ink }}>
            {title}
          </h2>
          {listHeader && <div className="mt-3">{listHeader}</div>}
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-3 pb-3">
          {rows.length === 0 ? (
            <p className="px-3 py-6 text-sm" style={{ color: v3colors.muted }}>
              No mics with a location yet. Try widening the filters.
            </p>
          ) : (
            <ul className="flex flex-col gap-1.5">
              {rows.map((venue) => {
                const isActive = venue.key === selectedKey || venue.key === hoveredKey;
                return (
                  <li key={venue.key}>
                    <button
                      type="button"
                      onClick={() => setSelectedKey(venue.key)}
                      onMouseEnter={() => setHoveredKey(venue.key)}
                      onMouseLeave={() => setHoveredKey(null)}
                      onFocus={() => setHoveredKey(venue.key)}
                      onBlur={() => setHoveredKey(null)}
                      aria-current={venue.key === selectedKey}
                      className="flex w-full items-center gap-3 rounded-2xl px-3 py-2.5 text-left transition-colors"
                      style={{ background: isActive ? v3colors.surfaceBlue : "transparent" }}
                    >
                      <VenueRowAvatar venue={venue} />
                      <span className="min-w-0 flex-1">
                        <span
                          className="block truncate text-[15px]"
                          style={{ ...V3_DISPLAY_STYLE, color: v3colors.ink }}
                        >
                          {venue.name}
                        </span>
                        <span
                          className="mt-0.5 block truncate text-[13px]"
                          style={{ color: v3colors.muted }}
                        >
                          {venueRowMeta(venue)}
                        </span>
                      </span>
                      {venue.nowCount > 0 && (
                        <span
                          className="shrink-0 whitespace-nowrap text-[13px] font-semibold"
                          style={{ color: v3colors.royal }}
                        >
                          On now
                        </span>
                      )}
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </aside>

      <main className="relative min-w-0 flex-1">
        <OpenMicsMapRefactored
          variant="full"
          mics={mics}
          onMicSelect={onMicSelect}
          selectedVenueKey={selectedKey}
          onSelectVenue={setSelectedKey}
          highlightedVenueKey={hoveredKey}
          hidePreviewCard
        />

        {/* The preview opens over the map, top right, per the plan. */}
        {selected && (
          <div className="absolute right-5 top-5 z-30">
            <VenueEventCards
              venue={selected}
              now={now}
              layout="stack"
              onClose={() => setSelectedKey(null)}
              onSelectEvent={(event) => onMicSelect(event.mic)}
            />
          </div>
        )}
      </main>
    </div>
  );
}

export default MapSplitView;
