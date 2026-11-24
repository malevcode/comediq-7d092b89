import { useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  CalendarPlus,
  ChevronRight,
  Clock,
  Instagram,
  MapPin,
  Navigation,
  Star,
} from "lucide-react";

import SEO from "@/components/SEO";
import { MicMiniMap } from "@/components/map/MicMiniMap";
import {
  V3Card,
  V3Chip,
  VenueArtwork,
  VenueBubble,
  VenueName,
} from "@/components/v3/V3Primitives";
import { V3Sheet } from "@/components/v3/V3Sheet";
import { useAuth } from "@/contexts/AuthContext";
import { useIsDesktop } from "@/hooks/useIsDesktop";
import { useMicRegistration } from "@/hooks/useMicRegistration";
import { useMicSkips } from "@/hooks/useMicSkips";
import { useNow } from "@/hooks/useNow";
import { useOpenMics } from "@/hooks/useOpenMics";
import { v3colors, V3_DISPLAY_STYLE } from "@/theme/v3";
import {
  buildVenues,
  eventWhenLabel,
  formatMinutes,
  micIdOf,
  type Venue,
  type VenueEvent,
} from "@/utils/venues";

/**
 * Mic detail, from Main.dc.html's "MIC DETAIL" board, plus the Register sheet
 * and the My mic tracker sheet.
 *
 * Phone is one column with bottom sheets. Desktop is two columns -
 * photo / title / description left, the Open mic card sticky on the right with
 * the mini map under it - and the sheets become a right drawer, per the Mic
 * detail and Register rows of WEB_AND_HOST_PLAN.md.
 */

function Label({ children }: { children: React.ReactNode }) {
  return (
    <span className="text-[17px] font-semibold" style={{ color: v3colors.ink }}>
      {children}
    </span>
  );
}

function DetailRow({ term, value, last = false }: { term: string; value: string; last?: boolean }) {
  return (
    <div
      className="flex justify-between py-2.5"
      style={{ borderBottom: last ? "none" : `1px solid ${v3colors.borderSoft}` }}
    >
      <dt style={{ color: v3colors.muted }}>{term}</dt>
      <dd className="m-0 font-semibold">{value}</dd>
    </div>
  );
}

/** A dashed step card, as the Register sheet draws them. */
function Step({
  n,
  title,
  children,
  done = false,
  faded = false,
}: {
  n: number;
  title: string;
  children: React.ReactNode;
  done?: boolean;
  faded?: boolean;
}) {
  return (
    <section
      className="rounded-[26px] px-5 py-4 transition-opacity"
      style={{
        border: `2px dashed ${v3colors.borderDashed}`,
        opacity: faded ? 0.45 : 1,
      }}
    >
      <div
        className="flex items-center gap-3 pb-3.5"
        style={{ borderBottom: `1px solid ${v3colors.borderSoft}` }}
      >
        <span
          className="flex h-8 w-8 items-center justify-center rounded-full font-bold text-white"
          // The board paints a done step green. The spec allows no green, so a
          // finished step is Comediq royal and an unreached one is grey.
          style={{ background: done || !faded ? v3colors.royal : v3colors.inactive }}
        >
          {done ? "✓" : n}
        </span>
        <Label>{title}</Label>
      </div>
      <div className="pt-3.5">{children}</div>
    </section>
  );
}

export default function V3MicDetail() {
  const { micId = "" } = useParams();
  const navigate = useNavigate();
  const isDesktop = useIsDesktop();
  const now = useNow();
  const { user } = useAuth();
  const { skips } = useMicSkips();
  const { data: mics = [], isLoading } = useOpenMics();

  const [sheet, setSheet] = useState<null | "register" | "tracker">(null);
  const [rating, setRating] = useState(0);

  const found = useMemo((): { venue: Venue; event: VenueEvent } | null => {
    const venues = buildVenues(mics, now, skips);
    for (const venue of venues) {
      const event = venue.events.find((candidate) => micIdOf(candidate.mic) === micId);
      if (event) return { venue, event };
    }
    return null;
  }, [mics, now, skips, micId]);

  const mic = found?.event.mic ?? null;
  const registration = useMicRegistration(mic);

  if (isLoading && !found) {
    return (
      <div className="px-6 py-20 font-dmsans" style={{ color: v3colors.muted }}>
        Loading…
      </div>
    );
  }

  if (!found || !mic) {
    return (
      <div className="px-6 py-20 font-dmsans">
        <h1 className="text-2xl font-bold">We could not find that mic</h1>
        <p className="mt-2" style={{ color: v3colors.muted }}>
          It may have been delisted. The full list has everything we know about.
        </p>
        <Link
          to="/open-mics"
          className="mt-5 inline-flex h-12 items-center rounded-full px-6 font-bold text-white"
          style={{ background: v3colors.royal }}
        >
          See all mics
        </Link>
      </div>
    );
  }

  const { venue, event } = found;
  const registered = registration.state !== "idle";

  const ctaLabel = !registered
    ? "Register"
    : registration.state === "checkedIn"
      ? "Rate this mic"
      : "Check in";

  const onPrimaryAction = () => {
    if (!registered) {
      if (!user) {
        navigate(`/auth/sign-in?next=${encodeURIComponent(`/v3/mic/${micId}`)}`);
        return;
      }
      setSheet("register");
      return;
    }
    if (registration.state === "checkedIn") {
      setRating((current) => (current === 0 ? 0 : current));
      setSheet("tracker");
      return;
    }
    setSheet("tracker");
  };

  /* ------------------------------ pieces ------------------------------ */

  const artwork = (
    <div className="relative aspect-[342/290] w-full overflow-hidden rounded-[32px] shadow-[0_10px_28px_rgba(18,26,51,0.14)]">
      <VenueArtwork
        seed={venue.key}
        bannerUrl={venue.bannerUrl}
        alt={`${venue.name} stage`}
        className="h-full w-full"
      />
      <span className="absolute bottom-4 right-4">
        <VenueBubble
          seed={venue.key}
          initials={venue.initials}
          iconUrl={venue.iconUrl}
          isComediqRun={event.isComediqRun}
          size={76}
        />
      </span>
    </div>
  );

  const heading = (
    <>
      <h1 className="mb-3 mt-6" style={{ ...V3_DISPLAY_STYLE, fontSize: 34, color: v3colors.ink }}>
        {event.name}
      </h1>
      <div className="mb-3.5 flex flex-wrap gap-2">
        {mic.neighborhood && (
          <V3Chip>
            <MapPin className="h-3.5 w-3.5" style={{ color: v3colors.royal }} aria-hidden="true" />
            {mic.neighborhood}
          </V3Chip>
        )}
        <V3Chip>{eventWhenLabel(event)}</V3Chip>
        {event.isComediqRun && <V3Chip tone="blue">By Comediq</V3Chip>}
        {venue.tags.map((tag) => (
          <V3Chip key={tag} tone="blue">
            {tag}
          </V3Chip>
        ))}
      </div>
      {(mic.description || mic.otherRules) && (
        <p className="m-0 text-[15px] leading-relaxed" style={{ color: v3colors.bodyInk }}>
          {mic.description || mic.otherRules}
        </p>
      )}

      <Link
        to={mic.venueSlug ? `/venue/${mic.venueSlug}` : "/open-mics"}
        className="mt-5 flex min-h-16 w-full items-center gap-3.5"
      >
        <VenueBubble
          seed={venue.key}
          initials={venue.initials}
          iconUrl={venue.iconUrl}
          isComediqRun={event.isComediqRun}
          size={58}
          ring={false}
        />
        <span className="flex-1">
          <VenueName className="block text-[17px]" style={{ color: v3colors.ink }}>
            {venue.name}
          </VenueName>
          <span className="block text-[15px]" style={{ color: v3colors.muted }}>
            View venue
          </span>
        </span>
        <ChevronRight className="h-5 w-5" style={{ color: v3colors.mutedSoft }} aria-hidden="true" />
      </Link>
    </>
  );

  const openMicCard = (
    <V3Card className="!p-[22px]">
      <div
        className="flex items-center justify-between pb-4"
        style={{ borderBottom: `1px solid ${v3colors.border}` }}
      >
        <Label>Open mic</Label>
        {mic.borough && (
          <span
            className="flex items-center gap-1.5 text-[15px] font-semibold"
            style={{ color: v3colors.royal }}
          >
            <Navigation className="h-4 w-4" aria-hidden="true" />
            {mic.borough}
          </span>
        )}
      </div>

      <div className="flex flex-col gap-4.5 pt-4">
        <div>
          <Label>Signup</Label>
          <div className="mt-1 text-[15px]">
            {mic.signUpInstructions || "Ask the host when you arrive"}
          </div>
        </div>
        <div>
          <Label>Details</Label>
          <dl className="m-0 mt-1 text-[15px]">
            {mic.cost && <DetailRow term="Cost" value={mic.cost} />}
            {event.startMinutes !== null && (
              <DetailRow term="Starts" value={formatMinutes(event.startMinutes)} />
            )}
            {event.endMinutes !== null && (
              <DetailRow term="Ends" value={formatMinutes(event.endMinutes)} />
            )}
            {mic.stageTime && <DetailRow term="Set length" value={`${mic.stageTime} min`} last />}
          </dl>
        </div>
      </div>

      <div className="mt-5 flex gap-2.5">
        <button
          type="button"
          onClick={onPrimaryAction}
          className="flex h-[54px] flex-1 items-center justify-center rounded-full text-[17px] font-bold"
          style={{ background: v3colors.royal, color: v3colors.cream }}
        >
          {ctaLabel}
        </button>
        {typeof mic.latitude === "number" && typeof mic.longitude === "number" && (
          <a
            href={`https://www.google.com/maps/dir/?api=1&destination=${mic.latitude},${mic.longitude}`}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Directions"
            className="flex h-[54px] w-[54px] items-center justify-center rounded-full"
            style={{ background: v3colors.surfaceTinted, color: v3colors.royal }}
          >
            <Navigation className="h-5 w-5" aria-hidden="true" />
          </a>
        )}
        <Link
          to={`/mic/${mic.slug ?? mic.uniqueIdentifier}`}
          aria-label="Add to calendar"
          className="flex h-[54px] w-[54px] items-center justify-center rounded-full"
          style={{ background: v3colors.surfaceTinted, color: v3colors.royal }}
        >
          <CalendarPlus className="h-5 w-5" aria-hidden="true" />
        </Link>
      </div>

      {registration.state === "checkedIn" && (
        <div className="mt-4 pt-3.5" style={{ borderTop: `1px solid ${v3colors.borderSoft}` }}>
          <div className="text-[15px]" style={{ color: v3colors.muted }}>
            How was the room tonight?
          </div>
          <div className="mt-2 flex gap-1.5">
            {[1, 2, 3, 4, 5].map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => setRating(n)}
                aria-label={`${n} stars`}
                aria-pressed={rating === n}
                className="flex h-11 w-11 items-center justify-center"
                style={{ color: n <= rating ? v3colors.royal : v3colors.borderField }}
              >
                <Star className="h-7 w-7" fill="currentColor" aria-hidden="true" />
              </button>
            ))}
          </div>
        </div>
      )}

      {registration.error && (
        <p className="mt-3 text-sm" style={{ color: "#B3261E" }} role="alert">
          {registration.error}
        </p>
      )}
    </V3Card>
  );

  const houseRules = mic.otherRules ? (
    <V3Card className="!px-[22px] !pb-3 !pt-5">
      <h2 className="m-0">
        <Label>House rules</Label>
      </h2>
      <p className="mt-1.5 text-[15px] leading-relaxed" style={{ color: v3colors.bodyInk }}>
        {mic.otherRules}
      </p>
    </V3Card>
  ) : null;

  const miniMap =
    typeof mic.latitude === "number" && typeof mic.longitude === "number" ? (
      <div
        className="overflow-hidden rounded-[28px]"
        style={{ border: `1px solid ${v3colors.border}`, height: 220 }}
      >
        <MicMiniMap
          location={mic.location || venue.name}
          venueName={venue.name}
          latitude={mic.latitude}
          longitude={mic.longitude}
        />
      </div>
    ) : null;

  /* ------------------------------ sheets ------------------------------ */

  const registerSheet = (
    <V3Sheet open={sheet === "register"} onClose={() => setSheet(null)} label={`Register for ${event.name}`}>
      <div className="px-5 pb-8 pt-3">
        <div className="text-center text-[19px] font-bold">Register</div>

        <div className="my-5 flex items-center gap-4">
          <div className="h-[104px] w-[104px] shrink-0 overflow-hidden rounded-3xl">
            <VenueArtwork seed={venue.key} bannerUrl={venue.bannerUrl} className="h-full w-full" />
          </div>
          <div className="min-w-0">
            <VenueName className="block text-[23px]" style={{ color: v3colors.ink }}>
              {event.name}
            </VenueName>
            <div
              className="mt-1.5 flex items-center gap-2 text-[17px]"
              style={{ color: v3colors.muted }}
            >
              <VenueBubble
                seed={venue.key}
                initials={venue.initials}
                iconUrl={venue.iconUrl}
                isComediqRun={event.isComediqRun}
                size={28}
                ring={false}
              />
              {eventWhenLabel(event)}
            </div>
          </div>
        </div>

        <div className="mb-3 text-[17px]" style={{ color: v3colors.muted }}>
          Once confirmed:
        </div>

        <div className="flex flex-col gap-3.5">
          <Step n={1} title="Sign up">
            <div className="text-xl font-semibold">Join the list</div>
            <div className="mt-3 flex items-center gap-2 text-base" style={{ color: v3colors.muted }}>
              <Clock className="h-4 w-4" aria-hidden="true" />
              {mic.signUpInstructions || "The host takes the list at the room"}
            </div>
          </Step>

          <Step n={2} title="Check in">
            <div className="text-xl font-semibold leading-snug">
              Be at {mic.location || venue.name} to lock your spot in the list order
            </div>
            <div className="mt-3 flex items-center gap-2.5 text-[17px]">
              <MapPin className="h-5 w-5" aria-hidden="true" />
              {mic.location || venue.name}
            </div>
            <div className="mt-2.5 flex items-center gap-2 text-base" style={{ color: v3colors.muted }}>
              <Clock className="h-4 w-4" aria-hidden="true" />
              Check in opens when you are within 0.1 mi of the room
            </div>
          </Step>

          <Step n={3} title="Set">
            <div className="text-xl font-semibold">Build your set list and record your set</div>
            {mic.instagramHandle && (
              <div className="mt-3 flex items-center gap-2.5 text-[17px]">
                <Instagram className="h-5 w-5" aria-hidden="true" />
                Tag {mic.instagramHandle} if you post your set
              </div>
            )}
          </Step>
        </div>

        <div className="sticky bottom-0 bg-gradient-to-b from-transparent via-white to-white pb-6 pt-4">
          <button
            type="button"
            onClick={() => {
              registration.register();
              setSheet("tracker");
            }}
            disabled={registration.isRegistering}
            className="flex h-[60px] w-full items-center justify-center rounded-full text-[19px] font-bold text-white"
            style={{ background: registration.isRegistering ? v3colors.busy : v3colors.royal }}
          >
            {registration.isRegistering ? "Confirming…" : "Confirm registration"}
          </button>
        </div>
      </div>
    </V3Sheet>
  );

  const atVenue = registration.state === "inRange" || registration.state === "checking" || registration.state === "checkedIn";
  const checkedIn = registration.state === "checkedIn";

  const trackerSheet = (
    <V3Sheet
      open={sheet === "tracker"}
      onClose={() => setSheet(null)}
      label={`Your mic at ${venue.name}`}
      background="#FAFAF8"
    >
      <div className="px-5 pb-10 pt-4">
        <div className="text-center text-xl font-bold">Your mic</div>

        <div className="my-5 flex items-center gap-4">
          <div className="h-[104px] w-[104px] shrink-0 overflow-hidden rounded-3xl">
            <VenueArtwork seed={venue.key} bannerUrl={venue.bannerUrl} className="h-full w-full" />
          </div>
          <div className="min-w-0">
            <VenueName className="block text-[23px]" style={{ color: v3colors.ink }}>
              {event.name}
            </VenueName>
            <div className="mt-1 text-[17px]" style={{ color: v3colors.muted }}>
              {eventWhenLabel(event)}
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-3.5">
          <Step n={1} title="Arrived" done={atVenue} faded={!atVenue}>
            {atVenue ? (
              <div className="text-xl font-semibold" style={{ color: v3colors.royal }}>
                You're at {venue.name}
              </div>
            ) : (
              <div className="text-xl font-semibold">Get within 0.1 mi of the venue</div>
            )}
            <div className="mt-2.5 flex items-center gap-2.5 text-[17px]">
              <MapPin className="h-5 w-5" aria-hidden="true" />
              {mic.location || venue.name}
            </div>
            {registration.distanceMiles !== null && !checkedIn && (
              <div className="mt-2 text-base" style={{ color: v3colors.muted }}>
                You are about {registration.distanceMiles.toFixed(1)} mi away
              </div>
            )}

            {/* Check-in needs GPS, so the phone gets the button and desktop
                gets told to use the phone - per the My mic tracker row of
                WEB_AND_HOST_PLAN.md. */}
            {!checkedIn &&
              (isDesktop ? (
                <p className="mt-4 text-base" style={{ color: v3colors.muted }}>
                  Check in from your phone — it needs your location to confirm you are in the room.
                </p>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={registration.checkIn}
                    disabled={registration.state === "checking"}
                    className="mt-4 flex h-[60px] w-full items-center justify-center rounded-full text-[19px] font-bold text-white"
                    style={{
                      background:
                        registration.state === "checking" ? v3colors.busy : v3colors.royal,
                    }}
                  >
                    {registration.state === "checking"
                      ? "Checking in…"
                      : registration.state === "inRange"
                        ? "Check in"
                        : "Use my location"}
                  </button>
                  <div
                    className="mt-2 text-center text-sm"
                    style={{ color: v3colors.muted }}
                  >
                    Your check-in time sets your order on the list
                  </div>
                </>
              ))}
          </Step>

          <Step n={2} title="Your spot" faded={!checkedIn}>
            {checkedIn && registration.position !== null ? (
              <>
                <div className="flex items-end justify-between">
                  <div className="text-[40px] font-bold leading-none">
                    You're #{registration.position}
                  </div>
                  {registration.listSize !== null && (
                    <div className="text-base" style={{ color: v3colors.muted }}>
                      of {registration.listSize} on the list
                    </div>
                  )}
                </div>
                {registration.checkedInAhead !== null && (
                  <div className="mt-3.5 text-base" style={{ color: v3colors.muted }}>
                    {registration.checkedInAhead === 0
                      ? "Nobody ahead of you has checked in yet"
                      : `${registration.checkedInAhead} ahead of you ${
                          registration.checkedInAhead === 1 ? "has" : "have"
                        } checked in`}
                  </div>
                )}
              </>
            ) : (
              <>
                <div className="text-xl font-semibold">Check in to get your spot</div>
                <div className="mt-1.5 text-base" style={{ color: v3colors.muted }}>
                  List order follows check-in time
                </div>
              </>
            )}
          </Step>

          <Step n={3} title="Build and record" faded={!checkedIn}>
            <div className="text-xl font-semibold">Build your set list, then record</div>
            <div className="mt-4 grid grid-cols-2 gap-2.5">
              <Link
                to={checkedIn ? "/track-sets" : "#"}
                aria-disabled={!checkedIn}
                onClick={(e) => !checkedIn && e.preventDefault()}
                className="flex h-[54px] items-center justify-center rounded-full text-base font-bold"
                style={{
                  border: `2px solid ${v3colors.royal}`,
                  color: v3colors.royal,
                  opacity: checkedIn ? 1 : 0.5,
                }}
              >
                Build set list
              </Link>
              <Link
                to={checkedIn ? "/track-sets" : "#"}
                aria-disabled={!checkedIn}
                onClick={(e) => !checkedIn && e.preventDefault()}
                className="flex h-[54px] items-center justify-center rounded-full text-base font-bold text-white"
                style={{ background: v3colors.royal, opacity: checkedIn ? 1 : 0.5 }}
              >
                Record set
              </Link>
            </div>
          </Step>
        </div>

        {registration.error && (
          <p className="mt-4 text-sm" style={{ color: "#B3261E" }} role="alert">
            {registration.error}
          </p>
        )}
      </div>
    </V3Sheet>
  );

  /* ------------------------------ layout ------------------------------ */

  return (
    <div className="min-h-screen font-dmsans" style={{ background: v3colors.cream }}>
      <SEO
        title={`${event.name} - ${venue.name} | Comediq`}
        description={`${event.name} at ${venue.name}. ${eventWhenLabel(event)}.`}
      />

      {isDesktop ? (
        <div className="mx-auto grid max-w-6xl grid-cols-[1fr_380px] gap-10 px-8 py-8">
          <div>
            <button
              type="button"
              onClick={() => navigate(-1)}
              aria-label="Back"
              className="mb-4 flex h-[52px] w-[52px] items-center justify-center rounded-full bg-white shadow"
            >
              <ArrowLeft className="h-5 w-5" aria-hidden="true" />
            </button>
            {artwork}
            {heading}
            {houseRules && <div className="mt-6">{houseRules}</div>}
          </div>
          <aside className="flex flex-col gap-5 self-start lg:sticky lg:top-24">
            {openMicCard}
            {miniMap}
          </aside>
        </div>
      ) : (
        <div className="px-6 pb-40 pt-13">
          <button
            type="button"
            onClick={() => navigate(-1)}
            aria-label="Back"
            className="flex h-[52px] w-[52px] items-center justify-center rounded-full bg-white shadow"
          >
            <ArrowLeft className="h-5 w-5" aria-hidden="true" />
          </button>
          <div className="mt-4">{artwork}</div>
          {heading}
          <div className="mt-6 flex flex-col gap-5">
            {openMicCard}
            {houseRules}
            {miniMap}
          </div>
        </div>
      )}

      {registerSheet}
      {trackerSheet}
    </div>
  );
}
