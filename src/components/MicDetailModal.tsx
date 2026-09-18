import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { Link, useNavigate } from "react-router-dom";
import {
  CalendarPlus,
  ChevronDown,
  ExternalLink,
  Heart,
  Instagram,
  LogIn,
  MapPin,
  Navigation,
  Plus,
  ThumbsDown,
  X,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
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

type ViewMode = "performer" | "audience";

/** Outline buttons, restyled so they read as glass on the navy rather than near-black. */
const OUTLINE = "border-[#07111f]/15 bg-white/60 text-[#07111f] hover:bg-white dark:border-white/15 dark:bg-white/10 dark:text-white dark:hover:bg-white/20";

/** Section heading: small, spaced-out capitals, the way the rest of the site does them. */
const SectionLabel = ({ children }: { children: React.ReactNode }) => (
  <h3 className="mb-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-[#07111f]/50 dark:text-white/50">
    {children}
  </h3>
);

const Panel = ({ children }: { children: React.ReactNode }) => (
  <section className="rounded-2xl border border-[#07111f]/10 bg-white/70 p-4 dark:border-white/10 dark:bg-white/[0.07]">
    {children}
  </section>
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
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, []);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
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
      .slice(0, 4);
  }, [allMics, mic.uniqueIdentifier, mic.venueName]);

  const boroughColor = getBoroughOutline(mic.borough);
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
    const query = encodeURIComponent(`${mic.venueName}, ${mic.location}`);
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    return isIOS
      ? `https://maps.apple.com/?q=${query}`
      : `https://www.google.com/maps/search/?api=1&query=${query}`;
  })();

  const handleRating = (rating: "like" | "dislike") => {
    if (!user) {
      navigate("/auth");
      return;
    }
    if (userRating === rating) {
      removeRating(mic.uniqueIdentifier);
    } else {
      rateMic({ micUniqueIdentifier: mic.uniqueIdentifier, rating });
    }
  };

  const calendarEvent = () => {
    const start = new Date(nextDate ?? new Date());
    const minutes = parseStartTimeToMinutes(mic.startTime);
    start.setHours(Math.floor((minutes ?? 19 * 60) / 60), (minutes ?? 0) % 60, 0, 0);

    const endMinutes = parseStartTimeToMinutes(mic.latestEndTime);
    const end = new Date(start);
    if (endMinutes !== null && minutes !== null && endMinutes > minutes) {
      end.setHours(Math.floor(endMinutes / 60), endMinutes % 60, 0, 0);
    } else {
      end.setHours(start.getHours() + 2);
    }

    const stamp = (date: Date) =>
      `${date.toISOString().replace(/[-:]/g, "").split(".")[0]}Z`;

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
    const event = calendarEvent();
    const params = new URLSearchParams({
      action: "TEMPLATE",
      text: event.title,
      dates: `${event.start}/${event.end}`,
      details: event.description,
      location: event.location,
    });
    window.open(
      `https://calendar.google.com/calendar/render?${params.toString()}`,
      "_blank",
    );
  };

  const downloadICal = () => {
    const event = calendarEvent();
    const ical = [
      "BEGIN:VCALENDAR",
      "VERSION:2.0",
      "PRODID:-//Comediq//Open Mic//EN",
      "BEGIN:VEVENT",
      `DTSTART:${event.start}`,
      `DTEND:${event.end}`,
      `SUMMARY:${event.title}`,
      `DESCRIPTION:${event.description.replace(/\n/g, "\\n")}`,
      `LOCATION:${event.location}`,
      `UID:${mic.uniqueIdentifier}@comediq.app`,
      "END:VEVENT",
      "END:VCALENDAR",
    ].join("\r\n");

    const url = URL.createObjectURL(new Blob([ical], { type: "text/calendar" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = `${mic.openMic.replace(/[^a-z0-9]/gi, "_").toLowerCase()}.ics`;
    link.click();
    URL.revokeObjectURL(url);
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

    toast({
      title: "You're going",
      description: `${mic.openMic} is on your schedule.`,
    });

    if (onAddToSchedule) {
      const event = calendarEvent();
      onAddToSchedule({
        title: mic.openMic,
        venue: mic.venueName,
        location: mic.location,
        date: event.date,
        time: mic.startTime,
        status: "upcoming",
        notes: `Open mic - ${mic.cost} - ${mic.stageTime} stage time`,
      });
    }
  };

  return createPortal(
    <div
      className="fixed inset-0 z-[1200] overflow-y-auto overscroll-contain bg-black/60 p-0 sm:p-4"
      onClick={onClose}
    >
      <div
        onClick={(event) => event.stopPropagation()}
        className="mx-auto min-h-full w-full max-w-lg border-[#07111f]/10 bg-[#f5f2eb] text-[#07111f] shadow-[0_24px_80px_rgba(2,10,30,0.24)] sm:my-6 sm:min-h-0 sm:rounded-3xl sm:border dark:border-white/10 dark:bg-[#0d2244] dark:text-white"
      >
        {/* Header */}
        <div
          className="sticky top-0 z-10 rounded-t-none border-b border-[#07111f]/10 bg-[#f5f2eb]/95 px-5 py-4 backdrop-blur-xl sm:rounded-t-3xl dark:border-white/10 dark:bg-[#0d2244]/95"
          style={{ borderTop: `4px solid ${boroughColor}` }}
        >
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <div className="mb-2 flex flex-wrap items-center gap-2">
                <span
                  className="rounded-full px-2.5 py-0.5 text-[11px] font-semibold text-[#fff]"
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
              <h2 className="text-xl font-bold leading-tight">{mic.openMic}</h2>
              <p className="mt-1 text-sm text-[#07111f]/60 dark:text-white/60">
                {mic.venueName}
                {mic.neighborhood ? ` · ${mic.neighborhood}` : ""}
              </p>
              <p className="text-sm text-[#07111f]/60 dark:text-white/60">
                {cadence} · {timeRange}
              </p>
            </div>
            <Button
              onClick={onClose}
              variant="ghost"
              size="sm"
              aria-label="Close"
              className="rounded-full text-[#07111f] hover:bg-[#07111f]/10 dark:text-white dark:hover:bg-white/10"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>

          {/* Audience / Performer toggle */}
          <div
            role="tablist"
            className="mt-4 grid grid-cols-2 gap-1 rounded-full bg-[#07111f]/[0.06] p-1 dark:bg-white/10"
          >
            {(["performer", "audience"] as const).map((mode) => (
              <button
                key={mode}
                role="tab"
                aria-selected={view === mode}
                onClick={() => setView(mode)}
                className={`rounded-full py-1.5 text-sm font-semibold capitalize transition ${
                  view === mode
                    ? "bg-[#1a5fb4] text-[#fff] shadow-sm"
                    : "text-[#07111f]/60 hover:text-[#07111f] dark:text-white/60 dark:hover:text-white"
                }`}
              >
                {mode}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-4 px-5 pb-8 pt-4">
          {/* Next occurrence */}
          <div className="rounded-2xl border border-[#1a5fb4]/25 bg-[#1a5fb4]/10 p-4 dark:border-[#8ec5ff]/25 dark:bg-[#8ec5ff]/10">
            <SectionLabel>Next</SectionLabel>
            <p className="text-lg font-bold">
              {nextDate ? formatOccurrence(nextDate) : mic.day}
            </p>
            <p className="text-sm text-[#07111f]/70 dark:text-white/70">{timeRange}</p>
            <p className="mt-2 text-sm text-[#07111f]/70 dark:text-white/70">
              {isPerformer
                ? `${mic.stageTime || "Stage time not listed"} · ${mic.cost || "Cost not listed"}`
                : `${mic.cost || "Cost not listed"} to watch`}
            </p>
          </div>

          {/* Primary actions */}
          <div className="space-y-2">
            {isPerformer && (
              <Button
                asChild
                className="w-full bg-orange-600 text-[#fff] hover:bg-orange-700"
              >
                <Link to={linkManager.micSignup(mic)}>
                  <Plus className="mr-2 h-4 w-4" />
                  Sign Up for Spots
                </Link>
              </Button>
            )}
            <Button
              onClick={handleImGoing}
              className={
                isPerformer
                  ? "w-full border border-[#1a5fb4]/30 bg-transparent text-[#1a5fb4] hover:bg-[#1a5fb4]/10 dark:border-[#8ec5ff]/30 dark:text-[#8ec5ff] dark:hover:bg-[#8ec5ff]/10"
                  : "w-full bg-[#1a5fb4] text-[#fff] hover:bg-[#164f96]"
              }
            >
              <CalendarPlus className="mr-2 h-4 w-4" />
              I'm going
            </Button>

            <div className="grid grid-cols-3 gap-2">
              {user ? (
                <div className="[&>button]:h-9 [&>button]:w-full [&>button]:text-xs [&>button.bg-background]:border-[#07111f]/15 [&>button.bg-background]:bg-white/60 dark:[&>button.bg-background]:border-white/15 dark:[&>button.bg-background]:bg-white/10 dark:[&>button.bg-background]:text-white">
                  <WentUpToggle mic={mic} />
                </div>
              ) : (
                <Button
                  onClick={() => navigate("/auth")}
                  variant="outline"
                  className={`h-9 w-full text-xs ${OUTLINE}`}
                >
                  <LogIn className="mr-1 h-3.5 w-3.5" />
                  Sign in
                </Button>
              )}
              <Button
                onClick={openGoogleCalendar}
                variant="outline"
                className={`h-9 w-full text-xs ${OUTLINE}`}
              >
                <CalendarPlus className="mr-1 h-3.5 w-3.5" />
                Calendar
              </Button>
              <Button asChild variant="outline" className={`h-9 w-full text-xs ${OUTLINE}`}>
                <a href={mapUrl} target="_blank" rel="noopener noreferrer">
                  <Navigation className="mr-1 h-3.5 w-3.5" />
                  Directions
                </a>
              </Button>
            </div>
          </div>

          {/* What you need to know, per view */}
          <Panel>
            <SectionLabel>
              {isPerformer ? "Before you sign up" : "Know before you go"}
            </SectionLabel>
            {isPerformer ? (
              <div className="space-y-2 text-sm text-[#07111f]/75 dark:text-white/75">
                <p>
                  <span className="font-semibold">Sign-up: </span>
                  {makeLinksClickable(
                    mic.signUpInstructions || "Ask at the venue.",
                  )}
                </p>
                <p>
                  <span className="font-semibold">Stage time: </span>
                  {mic.stageTime || "Not listed"}
                </p>
                <p>
                  <span className="font-semibold">Cost: </span>
                  {mic.cost || "Not listed"}
                </p>
                {mic.otherRules && <p>{makeLinksClickable(mic.otherRules)}</p>}
              </div>
            ) : (
              <div className="space-y-2 text-sm text-[#07111f]/75 dark:text-white/75">
                <p>
                  <span className="font-semibold">Doors: </span>
                  {timeRange}
                </p>
                <p>
                  <span className="font-semibold">Cost: </span>
                  {mic.cost || "Not listed"}
                </p>
                <p>
                  Comics get {mic.stageTime || "a short set"} each, so the lineup
                  turns over fast.
                </p>
                {mic.otherRules && <p>{makeLinksClickable(mic.otherRules)}</p>}
              </div>
            )}
          </Panel>

          {/* Upcoming dates */}
          {occurrences.length > 1 && (
            <div>
              <SectionLabel>Upcoming</SectionLabel>
              <div className="flex flex-wrap gap-2">
                {occurrences.map((date) => (
                  <span
                    key={date.toISOString()}
                    className="rounded-full border border-[#07111f]/10 bg-white/70 px-3 py-1 text-xs font-medium dark:border-white/10 dark:bg-white/10"
                  >
                    {formatOccurrenceShort(date)}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* About */}
          <Panel>
            <SectionLabel>About this mic</SectionLabel>
            <div className="space-y-2 text-sm text-[#07111f]/75 dark:text-white/75">
              <p>
                <span className="font-semibold">Host(s): </span>
                {mic.hosts || "Not listed"}
              </p>
              {mic.instagramHandle && (
                <p className="flex items-start gap-1.5">
                  <Instagram className="mt-0.5 h-4 w-4 flex-shrink-0 text-[#1a5fb4] dark:text-[#8ec5ff]" />
                  <span>{makeLinksClickable(mic.instagramHandle)}</span>
                </p>
              )}
            </div>

            <div className="mt-3 flex items-center gap-2 border-t border-[#07111f]/10 pt-3 dark:border-white/10">
              <Button
                onClick={() => handleRating("like")}
                size="sm"
                variant={userRating === "like" ? "default" : "outline"}
                disabled={isRating}
                className={
                  userRating === "like"
                    ? "bg-green-600 text-[#fff] hover:bg-green-700"
                    : OUTLINE
                }
              >
                <Heart
                  className={`mr-1 h-4 w-4 ${userRating === "like" ? "fill-current" : ""}`}
                />
                {ratingCounts?.likes || 0}
              </Button>
              <Button
                onClick={() => handleRating("dislike")}
                size="sm"
                variant={userRating === "dislike" ? "default" : "outline"}
                disabled={isRating}
                className={
                  userRating === "dislike"
                    ? "bg-red-600 text-[#fff] hover:bg-red-700"
                    : OUTLINE
                }
              >
                <ThumbsDown
                  className={`mr-1 h-4 w-4 ${userRating === "dislike" ? "fill-current" : ""}`}
                />
                {ratingCounts?.dislikes || 0}
              </Button>
            </div>
          </Panel>

          {/* Where */}
          <Panel>
            <SectionLabel>Where</SectionLabel>
            <a
              href={mapUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-start gap-2 text-sm text-[#1a5fb4] hover:underline dark:text-[#8ec5ff]"
            >
              <MapPin className="mt-0.5 h-4 w-4 flex-shrink-0" />
              <span>
                {mic.venueName}
                {mic.location ? `, ${mic.location}` : ""}
                <ExternalLink className="ml-1 inline h-3 w-3" />
              </span>
            </a>

            {alsoAtVenue.length > 0 && (
              <div className="mt-3 border-t border-[#07111f]/10 pt-3 dark:border-white/10">
                <SectionLabel>Also at this venue</SectionLabel>
                <div className="space-y-1">
                  {alsoAtVenue.map((other) => (
                    <Link
                      key={other.uniqueIdentifier}
                      to={linkManager.micDetail(other)}
                      onClick={onClose}
                      className="block text-sm text-[#1a5fb4] hover:underline dark:text-[#8ec5ff]"
                    >
                      {other.openMic} · {other.day} {other.startTime}
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </Panel>

          {/* Secondary actions */}
          <Collapsible>
            <CollapsibleTrigger asChild>
              <Button
                variant="ghost"
                className="h-auto w-full justify-between p-0 text-sm font-normal text-[#07111f]/70 hover:bg-transparent dark:text-white/70"
              >
                <span>More options</span>
                <ChevronDown className="h-4 w-4" />
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="mt-3 space-y-2">
              <Button
                onClick={downloadICal}
                variant="outline"
                className={`w-full text-sm ${OUTLINE}`}
              >
                Download iCal
              </Button>
              <Button asChild variant="outline" className={`w-full text-sm ${OUTLINE}`}>
                <Link to={`/host-dashboard?claim=${mic.uniqueIdentifier}`}>
                  I host this mic, claim it
                </Link>
              </Button>
            </CollapsibleContent>
          </Collapsible>

          <p className="pt-1 text-center text-[11px] text-[#07111f]/40 dark:text-white/40">
            Listing maintained by Comediq
            {mic.lastVerified ? ` · last verified ${mic.lastVerified}` : ""}
          </p>
        </div>
      </div>
    </div>,
    document.body,
  );
};

export default MicDetailModal;
