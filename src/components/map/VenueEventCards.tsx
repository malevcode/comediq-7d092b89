import { v3bubblePalette, v3colors, V3_DISPLAY_STYLE } from "@/theme/v3";
import {
  eventCtaLabel,
  eventMetaLine,
  eventWhenLabel,
  venueHeaderSummary,
  type Venue,
  type VenueEvent,
} from "@/utils/venues";

/**
 * The overlay shown after tapping a venue bubble: a header pill naming the
 * venue and the counts, then one card per event that has not ended.
 *
 * Spec (docs/design/storytime-redesign-v3/SPEC.md, "Map rules"):
 * header "<Venue> · <now time> · N now, N next", then "Happening now · until
 * <end>" first with a Join now button, then "Next · <time>" with Sign up, in
 * time order. Ended events are hidden — that filtering happens in
 * `buildVenues`, so this renders `venue.tonightEvents` as-is. Mics here on
 * other days are summarised in one line rather than given a card each; see
 * the note on `tonightEvents` in src/utils/venues.ts.
 *
 * Two layouts off one component, per WEB_AND_HOST_PLAN.md:
 *   - `layout="carousel"` (phone, MapBubbles.dc.html): swipeable cards.
 *   - `layout="stack"` (desktop, WebMap.dc.html): a column of wide rows
 *     pinned to the top right of the map.
 */

const LOGO_URL = "/map-pins/comediq_logo_pin.png";

function hashKey(value: string): number {
  let hash = 0;
  for (let index = 0; index < value.length; index += 1) {
    hash = (hash * 31 + value.charCodeAt(index)) % 100000;
  }
  return hash;
}

function VenueAvatar({ venue, size }: { venue: Venue; size: number }) {
  const [fill, textColor] = v3bubblePalette[hashKey(venue.key) % v3bubblePalette.length];
  const isComediq = venue.tier === "comediq";
  const image = venue.iconUrl ?? (isComediq ? LOGO_URL : null);

  return (
    <span
      aria-hidden="true"
      className="flex shrink-0 items-center justify-center rounded-full border-[3px] border-white bg-cover bg-center shadow-md"
      style={{
        width: size,
        height: size,
        backgroundColor: image ? v3colors.white : fill,
        color: image ? undefined : textColor,
        backgroundImage: image ? `url("${image.replace(/"/g, "%22")}")` : undefined,
        // The Q mark is a logo on white, so it is inset rather than bled to
        // the edge the way a host's own photo is.
        backgroundSize: venue.iconUrl ? "cover" : "62%",
        backgroundRepeat: "no-repeat",
        ...(image ? {} : { ...V3_DISPLAY_STYLE, fontSize: Math.round(size * 0.34) }),
      }}
    >
      {image ? "" : venue.initials}
    </span>
  );
}

interface HeaderProps {
  venue: Venue;
  now: Date;
  onClose: () => void;
}

function HeaderPill({ venue, now, onClose }: HeaderProps) {
  return (
    <div className="mb-2 flex items-center justify-between gap-2 rounded-full bg-white/95 py-1.5 pl-4 pr-1.5 shadow-lg">
      <span className="min-w-0 truncate text-sm font-bold" style={{ color: v3colors.ink }}>
        {venue.name}
        <span className="ml-1.5 font-medium" style={{ color: v3colors.muted }}>
          {venueHeaderSummary(venue, now)}
        </span>
      </span>
      <button
        type="button"
        onClick={onClose}
        aria-label={`Close ${venue.name}`}
        className="flex h-[30px] w-[30px] shrink-0 items-center justify-center rounded-full text-lg leading-none"
        style={{ background: v3colors.surfaceBlue, color: v3colors.royal }}
      >
        ×
      </button>
    </div>
  );
}

function WhenRow({ event }: { event: VenueEvent }) {
  return (
    <div
      className="flex items-center gap-1.5 text-xs font-semibold"
      style={{ color: v3colors.royal }}
    >
      <span
        aria-hidden="true"
        className="h-2 w-2 shrink-0 rounded-full"
        style={
          event.status === "now"
            ? { background: "#3D6FD1", boxShadow: "0 0 0 4px rgba(61,111,209,.2)" }
            : { border: `2px solid ${v3colors.royal}` }
        }
      />
      {eventWhenLabel(event)}
    </div>
  );
}

function OtherDaysLine({ venue }: { venue: Venue }) {
  if (venue.otherDayCount === 0 || venue.tonightEvents.length === 0) return null;
  return (
    <p className="mt-2 inline-block rounded-full bg-white/95 px-3 py-1 text-xs font-semibold shadow"
       style={{ color: v3colors.royal }}>
      {venue.otherDayCount === 1
        ? "1 more mic here on another day"
        : `${venue.otherDayCount} more mics here on other days`}
    </p>
  );
}

interface Props {
  venue: Venue;
  now?: Date;
  layout?: "carousel" | "stack";
  onClose: () => void;
  onSelectEvent: (event: VenueEvent) => void;
}

export function VenueEventCards({
  venue,
  now,
  layout = "carousel",
  onClose,
  onSelectEvent,
}: Props) {
  const resolvedNow = now ?? new Date();
  const [bannerFill] = v3bubblePalette[hashKey(venue.key) % v3bubblePalette.length];

  const empty = (
    <div
      className="rounded-[24px] bg-white p-4 shadow-xl"
      style={{ color: v3colors.ink }}
    >
      <p className="text-sm font-bold">Nothing left tonight</p>
      <p className="mt-1.5 text-sm" style={{ color: v3colors.muted }}>
        {venue.otherDayCount > 0
          ? `Nothing more at ${venue.name} tonight. It has ${
              venue.otherDayCount === 1 ? "a mic" : `${venue.otherDayCount} mics`
            } on other days.`
          : `Everything at ${venue.name} has already ended. Check back another day.`}
      </p>
    </div>
  );

  if (layout === "stack") {
    return (
      <div role="dialog" aria-label={`Mics at ${venue.name}`} className="w-[360px]">
        <HeaderPill venue={venue} now={resolvedNow} onClose={onClose} />
        {venue.tonightEvents.length === 0 ? (
          empty
        ) : (
          <div className="flex flex-col gap-2.5">
            {venue.tonightEvents.map((event) => (
              <article
                key={event.id}
                className="flex items-center gap-3.5 rounded-[22px] bg-white px-4 py-3.5 shadow-xl"
                style={{ color: v3colors.ink }}
              >
                <VenueAvatar venue={venue} size={52} />
                <div className="min-w-0 flex-1">
                  <WhenRow event={event} />
                  <div className="mt-0.5 truncate text-base" style={V3_DISPLAY_STYLE}>
                    {event.name}
                  </div>
                  {eventMetaLine(event) && (
                    <div className="mt-0.5 truncate text-sm" style={{ color: v3colors.muted }}>
                      {eventMetaLine(event)}
                    </div>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => onSelectEvent(event)}
                  className="shrink-0 whitespace-nowrap rounded-full px-3.5 py-2 text-sm font-bold text-white"
                  style={{ background: v3colors.royal }}
                >
                  {eventCtaLabel(event)}
                </button>
              </article>
            ))}
          </div>
        )}
        <OtherDaysLine venue={venue} />
      </div>
    );
  }

  return (
    <div role="dialog" aria-label={`Mics at ${venue.name}`}>
      <HeaderPill venue={venue} now={resolvedNow} onClose={onClose} />
      {venue.tonightEvents.length === 0 ? (
        empty
      ) : (
        <div className="flex snap-x snap-mandatory gap-2.5 overflow-x-auto pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {venue.tonightEvents.map((event) => (
            <article
              key={event.id}
              className={`${
                venue.tonightEvents.length > 1 ? "w-[82%]" : "w-full"
              } shrink-0 snap-center overflow-hidden rounded-[24px] bg-white shadow-xl`}
              style={{ color: v3colors.ink }}
            >
              <div
                className="relative h-20 bg-cover bg-center"
                style={{
                  background: venue.bannerUrl
                    ? `url("${venue.bannerUrl.replace(/"/g, "%22")}") center / cover no-repeat`
                    : bannerFill,
                }}
              >
                <span className="absolute -bottom-[18px] right-3">
                  <VenueAvatar venue={venue} size={44} />
                </span>
              </div>
              <div className="px-4 pb-4 pt-3">
                <WhenRow event={event} />
                <h3 className="mt-0.5 truncate text-lg" style={V3_DISPLAY_STYLE}>
                  {event.name}
                </h3>
                {eventMetaLine(event) && (
                  <p className="mt-0.5 truncate text-sm" style={{ color: v3colors.muted }}>
                    {eventMetaLine(event)}
                  </p>
                )}
                <button
                  type="button"
                  onClick={() => onSelectEvent(event)}
                  className="mt-3 h-[42px] w-full rounded-full text-sm font-bold text-white"
                  style={{ background: v3colors.royal }}
                >
                  {eventCtaLabel(event)}
                </button>
              </div>
            </article>
          ))}
        </div>
      )}
      <OtherDaysLine venue={venue} />
    </div>
  );
}

export default VenueEventCards;
