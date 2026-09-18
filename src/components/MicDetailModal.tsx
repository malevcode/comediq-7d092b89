import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { Link, useNavigate } from "react-router-dom";
import {
  CalendarDays,
  CalendarPlus,
  Clock,
  Heart,
  Info,
  Instagram,
  ListChecks,
  MapPin,
  Navigation,
  Share2,
  Ticket,
  Users,
  Wallet,
  X,
} from "lucide-react";

import { MicStatusBadge } from "@/components/mic/MicStatusBadge";
import { WentUpToggle } from "@/components/mic/WentUpToggle";
import { useAuth } from "@/contexts/AuthContext";
import { useMicRatings } from "@/hooks/useMicRatings";
import { useOpenMics } from "@/hooks/useOpenMics";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { FREQUENCY_LABELS, OpenMic } from "@/types/openMic";
import { getBoroughOutline } from "@/utils/boroughColors";
import { linkManager } from "@/utils/linkManager";
import { makeLinksClickable } from "@/utils/makeLinksClickable";
import { parseStartTimeToMinutes } from "@/utils/micCheckin";
import {
  formatOccurrence,
  formatOccurrenceShort,
  getUpcomingOccurrences,
} from "@/utils/micOccurrences";

type ScheduleMicData = {
  title: string;
  venue: string;
  location: string;
  date: Date;
  time: string;
  status: "upcoming";
  notes: string;
};

interface MicDetailModalProps {
  mic: OpenMic;
  onClose: () => void;
  onAddToSchedule?: (micData: ScheduleMicData) => void;
}

type ViewMode = "audience" | "performer";

const isFree = (cost?: string) => /free|no cover|\$0\b/i.test(cost ?? "");

/** The cost line under "Free to play" is worth showing only when it adds something. */
const costDetail = (cost?: string) => {
  const raw = (cost ?? "").trim();
  return !raw || /^free$/i.test(raw) ? undefined : raw;
};

/** "5" reads as nothing on its own. "5 min sets" reads as a set length. */
const formatStageTime = (stageTime?: string) => {
  const raw = (stageTime ?? "").trim();
  if (!raw) return "Set length not listed";
  if (/^\d+$/.test(raw)) return `${raw} min sets`;
  if (/^\d+\s*(min|minute|mins|minutes)\.?$/i.test(raw)) return `${raw} sets`;
  return raw;
};

/** A section: small grey capitals, then rows. No box, just a rule above it. */
const Section = ({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) => (
  <div className="border-t border-[#07111f]/10 px-4 py-3.5 dark:border-white/10">
    <h3 className="mb-2.5 text-[11px] font-semibold uppercase tracking-[0.12em] text-[#07111f]/45 dark:text-white/45">
      {title}
    </h3>
    {children}
  </div>
);

/** Icon, a bold line, and a quieter line under it. */
const Fact = ({
  icon: Icon,
  label,
  sub,
}: {
  icon: typeof Clock;
  label: React.ReactNode;
  sub?: React.ReactNode;
}) => (
  <div className="flex gap-2.5">
    <Icon className="mt-[3px] h-4 w-4 shrink-0 text-[#07111f]/35 dark:text-white/40" />
    <div className="min-w-0 flex-1">
      <div className="text-[15px] font-semibold leading-snug">{label}</div>
      {sub ? (
        <div className="mt-0.5 text-sm leading-snug text-[#07111f]/55 dark:text-white/55">
          {sub}
        </div>
      ) : null}
    </div>
  </div>
);

const MicDetailModal = ({ mic, onClose, onAddToSchedule }: MicDetailModalProps) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { userRating, ratingCounts, rateMic, removeRating, isRating } =
    useMicRatings(mic.uniqueIdentifier);
  const { data: allMics } = useOpenMics();
  const [view, setView] = useState<ViewMode>("performer");

  useEffect(() => {
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  const occurrences = useMemo(
    () => getUpcomingOccurrences(mic.day, mic.frequency, 5),
    [mic.day, mic.frequency],
  );
  const nextDate = occurrences[0];

  const alsoAtVenue = useMemo(() => {
    if (!allMics || !mic.venueName) return [];
    const venue = mic.venueName.trim().toLowerCase();
    return allMics
      .filter(
        (other) =>
          other.uniqueIdentifier !== mic.uniqueIdentifier &&
          other.venueName?.trim().toLowerCase() === venue,
      )
      .slice(0, 6);
  }, [allMics, mic.uniqueIdentifier, mic.venueName]);

  // MicMap runs one colour through the whole sheet. Comediq's is blue. The borough
  // shade is a label, not a theme, so it stays on the top stripe and its own pill.
  const boroughColor = getBoroughOutline(mic.borough);
  const BLUE = "#1a5fb4";
  const link = "text-[#1a5fb4] dark:text-[#8ec5ff]";
  const isPerformer = view === "performer";
  const timeRange = mic.latestEndTime
    ? `${mic.startTime} - ${mic.latestEndTime}`
    : mic.startTime;
  const cadence =
    mic.frequency === "custom" && mic.frequencyCustomText
      ? mic.frequencyCustomText
      : mic.frequency === "weekly"
        ? `Every ${mic.day}`
        : `${FREQUENCY_LABELS[mic.frequency]} · ${mic.day}`;

  const mapUrl = (() => {
    const q = encodeURIComponent(`${mic.venueName}, ${mic.location}`);
    return /iPad|iPhone|iPod/.test(navigator.userAgent)
      ? `https://maps.apple.com/?q=${q}`
      : `https://www.google.com/maps/search/?api=1&query=${q}`;
  })();

  const calendarEvent = () => {
    const start = new Date(nextDate ?? new Date());
    const startMin = parseStartTimeToMinutes(mic.startTime);
    start.setHours(Math.floor((startMin ?? 1140) / 60), (startMin ?? 0) % 60, 0, 0);

    const endMin = parseStartTimeToMinutes(mic.latestEndTime);
    const end = new Date(start);
    if (endMin !== null && startMin !== null && endMin > startMin) {
      end.setHours(Math.floor(endMin / 60), endMin % 60, 0, 0);
    } else {
      end.setHours(start.getHours() + 2);
    }

    const stamp = (d: Date) =>
      `${d.toISOString().replace(/[-:]/g, "").split(".")[0]}Z`;

    return {
      date: start,
      start: stamp(start),
      end: stamp(end),
      title: mic.openMic,
      location: `${mic.venueName}, ${mic.location}`,
      description: `Open mic at ${mic.venueName}\nCost: ${mic.cost}\nStage time: ${mic.stageTime}\n\nSign-up: ${mic.signUpInstructions}`,
    };
  };

  const openGoogleCalendar = () => {
    const e = calendarEvent();
    const params = new URLSearchParams({
      action: "TEMPLATE",
      text: e.title,
      dates: `${e.start}/${e.end}`,
      details: e.description,
      location: e.location,
    });
    window.open(
      `https://calendar.google.com/calendar/render?${params}`,
      "_blank",
    );
  };

  const shareMic = async () => {
    const url = `${window.location.origin}${linkManager.micDetail(mic)}`;
    try {
      if (navigator.share) {
        await navigator.share({ title: mic.openMic, url });
        return;
      }
      await navigator.clipboard.writeText(url);
      toast({ title: "Link copied" });
    } catch {
      /* the share sheet was dismissed, which is not an error */
    }
  };

  const handleImGoing = async () => {
    if (!user) {
      navigate("/auth");
      return;
    }
    const { error } = await supabase.from("profile_open_mics").insert([
      {
        profile_id: user.id,
        open_mic_id: mic.uniqueIdentifier,
        schedule_type: "upcoming",
      },
    ]);
    if (error) {
      toast({
        title: "Error",
        description: "Failed to add to your schedule.",
        variant: "destructive",
      });
      return;
    }
    toast({ title: "You're going", description: `${mic.openMic} is on your schedule.` });

    if (onAddToSchedule) {
      const e = calendarEvent();
      onAddToSchedule({
        title: mic.openMic,
        venue: mic.venueName,
        location: mic.location,
        date: e.date,
        time: mic.startTime,
        status: "upcoming",
        notes: `Open mic - ${mic.cost} - ${mic.stageTime} stage time`,
      });
    }
  };

  const toggleLike = () => {
    if (!user) {
      navigate("/auth");
      return;
    }
    if (userRating === "like") removeRating(mic.uniqueIdentifier);
    else rateMic({ micUniqueIdentifier: mic.uniqueIdentifier, rating: "like" });
  };

  const iconBtn =
    "flex h-8 w-8 items-center justify-center rounded-full bg-[#07111f]/[0.06] text-[#07111f]/70 transition hover:bg-[#07111f]/10 dark:bg-white/10 dark:text-white/70 dark:hover:bg-white/20";
  const pill =
    "inline-flex items-center gap-1.5 rounded-full border border-[#07111f]/15 px-3 py-1.5 text-[13px] font-semibold transition hover:bg-[#07111f]/[0.06] dark:border-white/20 dark:hover:bg-white/10";
  const tripleBtn =
    "flex flex-col items-center gap-1 rounded-xl border border-[#07111f]/15 px-1 py-2.5 text-[13px] font-semibold leading-tight transition hover:bg-[#07111f]/[0.06] dark:border-white/15 dark:hover:bg-white/10";

  return createPortal(
    <div
      className="fixed inset-0 z-[1200] flex flex-col overflow-y-auto overscroll-contain bg-black/70 sm:p-4"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="mx-auto mt-auto w-full max-w-md rounded-t-3xl bg-[#f5f2eb] pb-6 text-[#07111f] shadow-[0_-8px_60px_rgba(2,10,30,0.4)] sm:my-auto sm:rounded-3xl dark:bg-[#0d2244] dark:text-white"
        style={{ borderTop: `3px solid ${boroughColor}` }}
      >
        {/* Top bar: close, grab handle, share and save */}
        <div className="flex items-center gap-3 px-4 pb-1 pt-3">
          <button onClick={onClose} aria-label="Close" className={iconBtn}>
            <X className="h-4 w-4" />
          </button>
          <div className="mx-auto h-1 w-9 rounded-full bg-[#07111f]/15 dark:bg-white/20" />
          <button onClick={shareMic} aria-label="Share" className={iconBtn}>
            <Share2 className="h-4 w-4" />
          </button>
          <button
            onClick={toggleLike}
            disabled={isRating}
            aria-label="Save this mic"
            className={iconBtn}
            style={userRating === "like" ? { color: BLUE } : undefined}
          >
            <Heart
              className={`h-4 w-4 ${userRating === "like" ? "fill-current" : ""}`}
            />
          </button>
        </div>

        {/* Pills, title, one-line subtitle */}
        <div className="px-4 pb-3">
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <span
              className="rounded-full px-2.5 py-0.5 text-[12px] font-semibold text-[#fff]"
              style={{ backgroundColor: boroughColor }}
            >
              {mic.borough || "NYC"}
            </span>
            <MicStatusBadge
              status={mic.status}
              legacyTag={mic.legacyTag}
              submissionDate={mic.submissionDate}
              size="md"
            />
          </div>

          <h2 className="text-[26px] font-bold leading-[1.1] tracking-tight">
            {mic.openMic}
          </h2>

          <p className="mt-1.5 text-[15px] leading-snug text-[#07111f]/55 dark:text-white/55">
            at{" "}
            <span className="font-semibold text-[#07111f] dark:text-white">
              {mic.venueName}
            </span>
            {mic.location ? ` · ${mic.location}` : ""}
            {mic.neighborhood ? ` · ${mic.neighborhood}` : ""} · {cadence}
          </p>

          {/* Audience / Performer, content width, the active one filled */}
          <div className="mt-3 inline-flex rounded-full border border-[#07111f]/15 p-0.5 dark:border-white/20">
            {(["audience", "performer"] as const).map((mode) => (
              <button
                key={mode}
                role="tab"
                aria-selected={view === mode}
                onClick={() => setView(mode)}
                className={`rounded-full px-5 py-1.5 text-[15px] font-semibold capitalize transition ${
                  view === mode
                    ? "text-[#fff]"
                    : "text-[#07111f]/50 dark:text-white/50"
                }`}
                style={view === mode ? { backgroundColor: BLUE } : undefined}
              >
                {mode}
              </button>
            ))}
          </div>
        </div>

        {/* The Next card, with the signup note and the two pills inside it */}
        <div className="px-4 pb-3.5">
          <div
            className="rounded-2xl border px-3.5 py-3"
            style={{
              borderColor: `${BLUE}55`,
              backgroundColor: `${BLUE}14`,
            }}
          >
            <div className="flex items-center gap-2">
              <CalendarDays className={`h-[18px] w-[18px] shrink-0 ${link}`} />
              <span className="text-[15px] font-bold leading-snug">
                Next · {nextDate ? formatOccurrence(nextDate) : mic.day} ·{" "}
                {mic.startTime}
              </span>
            </div>
            <p className="mt-1 pl-[26px] text-sm text-[#07111f]/60 dark:text-white/60">
              {isPerformer
                ? `${formatStageTime(mic.stageTime)} · ${isFree(mic.cost) ? "free to play" : "paid to play"}`
                : `${timeRange} · ${isFree(mic.cost) ? "free to watch" : mic.cost}`}
            </p>

            <div
              className="my-3 h-px"
              style={{ backgroundColor: `${BLUE}33` }}
            />

            {isPerformer ? (
              <div className="flex gap-2.5">
                <Info className="mt-[3px] h-4 w-4 shrink-0 text-[#07111f]/35 dark:text-white/40" />
                <p className="text-sm leading-snug text-[#07111f]/70 dark:text-white/70">
                  {makeLinksClickable(
                    mic.signUpInstructions || "Sign up in person at the venue.",
                  )}
                </p>
              </div>
            ) : (
              <div className="flex gap-2.5">
                <Info className="mt-[3px] h-4 w-4 shrink-0 text-[#07111f]/35 dark:text-white/40" />
                <p className="text-sm leading-snug text-[#07111f]/70 dark:text-white/70">
                  No ticket needed. Comics get{" "}
                  {formatStageTime(mic.stageTime).replace(/ sets$/, "")} each, so
                  the lineup turns over fast.
                </p>
              </div>
            )}

            <div className="mt-3 flex flex-wrap gap-2">
              {isPerformer && (
                <Link
                  to={linkManager.micSignup(mic)}
                  className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[13px] font-semibold text-[#fff] transition hover:opacity-90"
                  style={{ backgroundColor: BLUE }}
                >
                  <ListChecks className="h-3.5 w-3.5" />
                  Sign up for spots
                </Link>
              )}
              <button onClick={handleImGoing} className={pill}>
                <Users className="h-3.5 w-3.5" />
                I'm going
              </button>
            </div>
          </div>

          {/* Three buttons, full labels on two lines */}
          <div className="mt-2.5 grid grid-cols-3 gap-2">
            {user ? (
              <div className="contents [&>button]:h-full [&>button]:w-full [&>button]:flex-col [&>button]:gap-1 [&>button]:rounded-xl [&>button]:border-[#07111f]/15 [&>button]:bg-transparent [&>button]:px-1 [&>button]:py-2.5 [&>button]:text-[13px] [&>button]:font-semibold [&>button]:leading-tight dark:[&>button]:border-white/15 dark:[&>button]:text-white">
                <WentUpToggle mic={mic} />
              </div>
            ) : (
              <button onClick={() => navigate("/auth")} className={tripleBtn}>
                <MapPin className="h-4 w-4 opacity-60" />
                <span>
                  Sign in to
                  <br />
                  check in
                </span>
              </button>
            )}
            <button onClick={openGoogleCalendar} className={tripleBtn}>
              <CalendarPlus className="h-4 w-4 opacity-60" />
              <span>
                Add to
                <br />
                calendar
              </span>
            </button>
            <a
              href={mapUrl}
              target="_blank"
              rel="noopener noreferrer"
              className={tripleBtn}
            >
              <Navigation className="h-4 w-4 opacity-60" />
              <span>
                Get
                <br />
                directions
              </span>
            </a>
          </div>
        </div>

        {/* Facts, per view */}
        <Section title={isPerformer ? "Before you sign up" : "Know before you go"}>
          <div className="space-y-2.5">
            {isPerformer ? (
              <>
                <Fact icon={Clock} label={formatStageTime(mic.stageTime)} />
                <Fact
                  icon={Wallet}
                  label={isFree(mic.cost) ? "Free to play" : "Paid to play"}
                  sub={costDetail(mic.cost)}
                />
              </>
            ) : (
              <>
                <Fact
                  icon={Ticket}
                  label={isFree(mic.cost) ? "Free to watch" : "Paid entry"}
                  sub={costDetail(mic.cost)}
                />
                <Fact icon={Clock} label={`Doors ${mic.startTime}`} sub={timeRange} />
              </>
            )}
            {mic.otherRules && (
              <Fact
                icon={ListChecks}
                label="House rules"
                sub={makeLinksClickable(mic.otherRules)}
              />
            )}
          </div>
        </Section>

        {occurrences.length > 1 && (
          <Section title="Upcoming">
            <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
              {occurrences.map((date, i) => (
                <span
                  key={date.toISOString()}
                  className={`shrink-0 rounded-lg px-3 py-1.5 text-[13px] font-semibold ${
                    i === 0
                      ? "text-[#fff]"
                      : "bg-[#07111f]/[0.06] text-[#07111f]/70 dark:bg-white/10 dark:text-white/70"
                  }`}
                  style={i === 0 ? { backgroundColor: BLUE } : undefined}
                >
                  {formatOccurrenceShort(date)}
                </span>
              ))}
            </div>
          </Section>
        )}

        <Section title="About this mic">
          <p className="text-[15px] leading-snug text-[#07111f]/70 dark:text-white/70">
            {mic.hosts ? `Hosted by ${mic.hosts}. ` : ""}
            {mic.neighborhood ? `${mic.neighborhood}, ` : ""}
            {mic.borough}.
          </p>
          {mic.instagramHandle && (
            <p className="mt-2 flex items-start gap-2 text-[15px]">
              <Instagram className={`mt-[3px] h-4 w-4 shrink-0 ${link}`} />
              <span className={link}>{makeLinksClickable(mic.instagramHandle)}</span>
            </p>
          )}
          {(ratingCounts?.likes ?? 0) > 0 && (
            <p className="mt-2 text-sm text-[#07111f]/45 dark:text-white/45">
              {ratingCounts?.likes} {ratingCounts?.likes === 1 ? "comic" : "comics"}{" "}
              saved this mic
            </p>
          )}
        </Section>

        <Section title="Where">
          <a href={mapUrl} target="_blank" rel="noopener noreferrer" className="flex gap-2.5">
            <MapPin className={`mt-[3px] h-4 w-4 shrink-0 ${link}`} />
            <span className="min-w-0">
              <span className="block text-[15px] font-semibold leading-snug">
                {mic.venueName}
              </span>
              <span className="block text-sm leading-snug text-[#07111f]/55 dark:text-white/55">
                {mic.location}
              </span>
            </span>
          </a>

          {alsoAtVenue.length > 0 && (
            <p className="mt-2.5 text-sm leading-relaxed text-[#07111f]/55 dark:text-white/55">
              Also at this venue:{" "}
              {alsoAtVenue.map((other, i) => (
                <span key={other.uniqueIdentifier}>
                  {i > 0 && ", "}
                  <Link
                    to={linkManager.micDetail(other)}
                    onClick={onClose}
                    className={`font-medium hover:underline ${link}`}
                  >
                    {other.openMic.trim().toLowerCase() ===
                    mic.openMic.trim().toLowerCase()
                      ? `${other.day.slice(0, 3)} ${other.startTime}`
                      : other.openMic}
                  </Link>
                  {other.openMic.trim().toLowerCase() !==
                  mic.openMic.trim().toLowerCase()
                    ? ` (${other.day.slice(0, 3)})`
                    : ""}
                </span>
              ))}
            </p>
          )}
        </Section>

        <div className="flex items-center justify-between gap-3 border-t border-[#07111f]/10 px-4 pt-3 text-sm dark:border-white/10">
          <span className="text-[#07111f]/40 dark:text-white/40">
            {mic.lastVerified ? `Verified ${mic.lastVerified}` : "Listed on Comediq"}
          </span>
          <Link
            to={`/host-dashboard?claim=${mic.uniqueIdentifier}`}
            className={`shrink-0 font-medium hover:underline ${link}`}
          >
            I host this mic →
          </Link>
        </div>
      </div>
    </div>,
    document.body,
  );
};

export default MicDetailModal;
