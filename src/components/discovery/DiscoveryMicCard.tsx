import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Calendar, ChevronDown, CircleUser, Clock, DollarSign, ExternalLink, MapPin, Mic, Navigation } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FREQUENCY_LABELS, MicFrequency, OpenMic } from "@/types/openMic";
import { formatTimeRange, formatStageTime, formatCost } from "@/utils/micFormat";
import { formatTime } from "@/components/map/MapUtils";
import { DistanceService } from "@/services/distanceService";
import { useUserLocation } from "@/hooks/useUserLocation";
import { makeLinksClickable } from "@/utils/makeLinksClickable";
import { linkManager } from "@/utils/linkManager";
import { cn } from "@/lib/utils";
import { ConfirmReportButtons } from "./ConfirmReportButtons";

interface DiscoveryMicCardProps {
  mic: OpenMic;
  forceExpanded?: boolean;
  flash?: boolean;
  onRegisterRow?: (id: string, el: HTMLDivElement | null) => void;
}

function extractFirstUrl(text?: string): string | null {
  if (!text) return null;
  const trimmed = text.trim();
  if (!trimmed) return null;

  const urlRegex =
    /(https?:\/\/[^\s)]+)|(www\.[^\s)]+)|(\b[a-z0-9][-a-z0-9]*(?:\.[a-z0-9][-a-z0-9]*)+(?:\/[^\s)]*)?)/i;
  const match = trimmed.match(urlRegex);
  if (!match) return null;

  let url = match[0].replace(/[.,;:!?)]+$/, "");
  if (!/^https?:\/\//i.test(url)) {
    url = `https://${url}`;
  }

  try {
    const parsed = new URL(url);
    if (!parsed.hostname.includes(".")) return null;
    return parsed.toString();
  } catch {
    return null;
  }
}

function getMapUrl(location: string, venueName: string) {
  const searchQuery = encodeURIComponent(`${venueName}, ${location}`);
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
  return isIOS
    ? `https://maps.apple.com/?q=${searchQuery}`
    : `https://www.google.com/maps/search/?api=1&query=${searchQuery}`;
}

export function DiscoveryMicCard({ mic, forceExpanded, flash, onRegisterRow }: DiscoveryMicCardProps) {
  const [expanded, setExpanded] = useState(false);
  useEffect(() => setExpanded(!!forceExpanded), [forceExpanded]);

  const { userLocation } = useUserLocation();
  const [distance, setDistance] = useState<string | null>(null);

  useEffect(() => {
    if (!userLocation || mic.latitude == null || mic.longitude == null) {
      setDistance(null);
      return;
    }
    setDistance(DistanceService.calculateDistanceFromCoordinates(userLocation, mic.latitude, mic.longitude));
  }, [userLocation, mic.latitude, mic.longitude]);

  const signUpUrl = extractFirstUrl(mic.signUpInstructions);
  const mapUrl = getMapUrl(mic.location, mic.venueName);

  return (
    <div
      ref={(el) => onRegisterRow?.(mic.uniqueIdentifier, el)}
      id={mic.id}
      className={cn(
        "rounded-2xl border border-border bg-card shadow-sm transition-shadow hover:shadow-md overflow-hidden",
        flash && "ring-2 ring-comediq-blue ring-offset-2",
      )}
    >
      <div className="flex gap-3 p-3">
        <div className="w-16 h-16 rounded-xl bg-comediq-cream flex-shrink-0 overflow-hidden flex items-center justify-center">
          {mic.coverImageUrl ? (
            <img src={mic.coverImageUrl} alt="" className="w-full h-full object-cover" />
          ) : (
            <Mic className="w-6 h-6 text-comediq-blue" />
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <h3 className="font-semibold text-sm text-foreground leading-tight line-clamp-2">{mic.openMic}</h3>
            <span className="flex-shrink-0 inline-flex items-center rounded-full bg-comediq-blue/10 text-comediq-blue border border-comediq-blue/20 font-mono font-semibold text-[11px] px-2 py-0.5 whitespace-nowrap">
              {formatTime(mic.startTime)}
            </span>
          </div>
          <div className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground truncate">
            <span className="truncate">{mic.venueName}, {mic.neighborhood}</span>
            {distance && (
              <span className="flex items-center gap-0.5 flex-shrink-0 text-comediq-blue font-medium">
                <Navigation className="w-3 h-3" />
                {distance}
              </span>
            )}
          </div>

          <div
            className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-muted-foreground cursor-pointer"
            onClick={() => setExpanded((e) => !e)}
            role="button"
            tabIndex={0}
            aria-expanded={expanded}
            onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") setExpanded((x) => !x); }}
          >
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3 flex-shrink-0" />
              {formatTimeRange(mic.startTime, mic.latestEndTime)}
            </span>
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3 flex-shrink-0" />
              {formatStageTime(mic.stageTime)}
            </span>
            <span className="flex items-center gap-1">
              <DollarSign className="w-3 h-3 flex-shrink-0" />
              {formatCost(mic.cost)}
            </span>
            <span className="flex items-center gap-1">
              <Calendar className="w-3 h-3 flex-shrink-0" />
              {mic.frequency && mic.frequency !== "weekly"
                ? `${FREQUENCY_LABELS[mic.frequency as MicFrequency] || ""} \u00b7 ${mic.day}`
                : mic.day}
            </span>
            <span
              className="flex items-center gap-1 min-w-0 [&_a]:!text-comediq-blue [&_a:hover]:underline"
              onClick={(e) => e.stopPropagation()}
            >
              <CircleUser className="w-3 h-3 flex-shrink-0" />
              <span className="truncate">
                {mic.instagramHandle && mic.instagramHandle.trim()
                  ? makeLinksClickable(mic.instagramHandle)
                  : "No host"}
              </span>
            </span>
          </div>

          <div className="mt-2 flex flex-wrap items-center gap-1.5">
            <Button size="sm" variant="outline" className="h-7 px-2 gap-1 text-xs" asChild>
              <a href={mapUrl} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()}>
                <MapPin className="w-3.5 h-3.5" />
                Location
              </a>
            </Button>
            {signUpUrl && (
              <Button size="sm" className="h-7 px-2 gap-1 text-xs bg-comediq-blue hover:bg-comediq-blue-dark" asChild>
                <a href={signUpUrl} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()}>
                  <ExternalLink className="w-3.5 h-3.5" />
                  Sign Up
                </a>
              </Button>
            )}
            <ConfirmReportButtons
              micUniqueIdentifier={mic.uniqueIdentifier}
              micName={mic.openMic}
              lastConfirmedAt={mic.lastConfirmedAt}
            />
            <button
              type="button"
              className="flex items-center gap-0.5 text-xs text-muted-foreground hover:text-comediq-blue transition-colors"
              onClick={() => setExpanded((e) => !e)}
              aria-expanded={expanded}
              aria-label="Toggle details"
            >
              Details
              <ChevronDown className={cn("w-3.5 h-3.5 transition-transform", expanded && "rotate-180")} />
            </button>
          </div>
        </div>
      </div>

      {expanded && (
        <div className="border-t border-border bg-muted/30 px-3 py-2.5 text-xs space-y-1.5">
          {mic.signUpInstructions && (
            <p className="text-muted-foreground break-words">{makeLinksClickable(mic.signUpInstructions)}</p>
          )}
          <Link
            to={linkManager.micDetail(mic)}
            className="inline-flex items-center gap-1 text-comediq-blue font-medium hover:underline"
          >
            View full details
            <ExternalLink className="w-3 h-3" />
          </Link>
        </div>
      )}
    </div>
  );
}
