import { Calendar, Clock, UserRoundCheck, DollarSign, MapPin, ArrowUp, ChevronDown, ExternalLink, Navigation, ClipboardList, Instagram, Send, Heart, Bookmark, MessageCircle, ListPlus } from "lucide-react";
import MicStatusDropdown from "@/components/MicStatusDropdown";
import { Button } from "@/components/ui/button";
import { OpenMic } from "@/types/openMic";
import { useState, useEffect } from "react";
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useUserLocation } from '@/hooks/useUserLocation';
import { DistanceService } from '@/services/distanceService';
import { makeLinksClickable } from '@/utils/makeLinksClickable';
import { linkManager } from '@/utils/linkManager';
import { Link } from 'react-router-dom';
import MicCommentSection from '@/components/mic/MicCommentSection';
import { MicStatusBadge } from '@/components/mic/MicStatusBadge';
import { FREQUENCY_LABELS } from '@/types/openMic';
import { useMicRatings } from '@/hooks/useMicRatings';
import { useSavedMics } from '@/hooks/useSavedMics';
import { useMicComments } from '@/hooks/useMicComments';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import PlaylistSelectorDropdown from '@/components/mic/PlaylistSelectorDropdown';

// Helper function to get map URL based on device
function getMapUrl(location: string, venueName: string) {
  const searchQuery = encodeURIComponent(`${venueName}, ${location}`);
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
  if (isIOS) return `https://maps.apple.com/?q=${searchQuery}`;
  return `https://www.google.com/maps/search/?api=1&query=${searchQuery}`;
}

function downloadICal(mic: OpenMic) {
  const event = generateCalendarEvent(mic);
  const icalContent = [
    'BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Comediq//Open Mic//EN',
    'BEGIN:VEVENT', `DTSTART:${event.start}`, `DTEND:${event.end}`,
    `SUMMARY:${event.title}`, `DESCRIPTION:${event.description.replace(/\n/g, '\\n')}`,
    `LOCATION:${event.location}`, `UID:${mic.uniqueIdentifier || mic.openMic.replace(/[^a-z0-9]/gi, '_').toLowerCase()}@comediq.app`,
    'END:VEVENT', 'END:VCALENDAR'
  ].join('\r\n');
  const blob = new Blob([icalContent], { type: 'text/calendar' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${mic.openMic.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.ics`;
  document.body.appendChild(a);
  a.click();
  setTimeout(() => { document.body.removeChild(a); URL.revokeObjectURL(url); }, 0);
}

function getNextOccurrence(mic: OpenMic) {
  const daysOfWeek = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  const today = new Date();
  const currentDay = today.getDay();
  const targetDay = daysOfWeek.indexOf(mic.day);
  let daysUntil = targetDay - currentDay;
  if (daysUntil < 0) daysUntil += 7;
  const nextDate = new Date(today);
  nextDate.setDate(today.getDate() + daysUntil);
  return nextDate;
}

function generateCalendarEvent(mic: OpenMic) {
  const nextDate = getNextOccurrence(mic);
  const [startHour, startMinute] = mic.startTime.replace(/[^\d:]/g, '').split(':').map(Number);
  const [endHour, endMinute] = mic.latestEndTime
    ? mic.latestEndTime.replace(/[^\d:]/g, '').split(':').map(Number)
    : [startHour + 1, startMinute];
  let startHour24 = startHour;
  if (mic.startTime.includes('PM') && startHour !== 12) startHour24 += 12;
  if (mic.startTime.includes('AM') && startHour === 12) startHour24 = 0;
  let endHour24 = endHour;
  if (mic.latestEndTime) {
    if (mic.latestEndTime.includes('PM') && endHour !== 12) endHour24 += 12;
    if (mic.latestEndTime.includes('AM') && endHour === 12) endHour24 = 0;
  }
  const startTotalMinutes = startHour24 * 60 + (startMinute || 0);
  const endTotalMinutes = endHour24 * 60 + (endMinute || 0);
  const durationMinutes = endTotalMinutes > startTotalMinutes ? endTotalMinutes - startTotalMinutes : 60;
  nextDate.setHours(startHour24, startMinute || 0, 0, 0);
  const endDate = new Date(nextDate.getTime() + durationMinutes * 60 * 1000);
  const formatDate = (date: Date) => date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
  return {
    title: mic.openMic,
    start: formatDate(nextDate),
    end: formatDate(endDate),
    description: `Open mic at ${mic.venueName}\nCost: ${mic.cost}\nStage time: ${mic.stageTime}\n\nSign-up: ${mic.signUpInstructions}`,
    location: `${mic.venueName}, ${mic.location}`,
    date: nextDate
  };
}

function getGoogleCalendarUrl(mic: OpenMic) {
  const event = generateCalendarEvent(mic);
  const params = new URLSearchParams({
    action: 'TEMPLATE', text: event.title,
    dates: `${event.start}/${event.end}`,
    details: event.description, location: event.location
  });
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

// Compact time formatting
function formatTimeCompact(time: string): string {
  if (!time) return '';
  return time.replace(/:00/g, '');
}

function formatTimeRange(startTime: string, endTime: string): string {
  const start = formatTimeCompact(startTime);
  const end = formatTimeCompact(endTime);
  const startMatch = start.match(/^(\d+(?::\d+)?)\s*(AM|PM)$/i);
  const endMatch = end.match(/^(\d+(?::\d+)?)\s*(AM|PM)$/i);
  if (startMatch && endMatch && startMatch[2].toUpperCase() === endMatch[2].toUpperCase()) {
    return `${startMatch[1]}-${endMatch[1]} ${endMatch[2]}`;
  }
  return `${start}-${end}`;
}

function formatStageTime(stageTime: string): string {
  if (!stageTime) return '–';
  let formatted = stageTime.replace(/minutes?/gi, 'min');
  if (/^\d+$/.test(formatted.trim())) formatted = `${formatted.trim()} min`;
  return formatted;
}

// Borough left-border colors
function getBoroughBorder(borough: string) {
  const b = (borough || '').trim();
  const map: Record<string, string> = {
    Manhattan: "border-l-cyan-500",
    Brooklyn: "border-l-amber-800",
    Queens: "border-l-purple-600",
    Bronx: "border-l-orange-600",
    "Staten Island": "border-l-gray-400"
  };
  return map[b] || "border-l-gray-400";
}

// ─── Inline Utility Bar ───
function InlineUtilityBar({
  mic, showComments, setShowComments
}: {
  mic: OpenMic;
  showComments: boolean;
  setShowComments: (v: boolean) => void;
}) {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [showPlaylistDialog, setShowPlaylistDialog] = useState(false);

  const { userRating, ratingCounts, rateMic, removeRating, isRating } = useMicRatings(mic.uniqueIdentifier);
  const { isMicSaved, toggleSave, isToggling } = useSavedMics();
  const { commentCount } = useMicComments(mic.uniqueIdentifier);

  const isLiked = userRating === "like";
  const likeCount = ratingCounts.likes || 0;
  const isSaved = isMicSaved(mic.uniqueIdentifier);

  const requireAuth = (action: string) => {
    if (!user) {
      toast({ title: "Sign in required", description: `Please sign in to ${action}` });
      navigate("/auth");
      return true;
    }
    return false;
  };

  const handleLike = () => {
    if (requireAuth("like mics")) return;
    if (isLiked) removeRating(mic.uniqueIdentifier);
    else rateMic({ micUniqueIdentifier: mic.uniqueIdentifier, rating: "like" });
  };

  const handleSave = async () => {
    if (requireAuth("save mics")) return;
    try {
      const result = await toggleSave(mic.uniqueIdentifier);
      toast({
        title: result.saved ? "Saved!" : "Removed",
        description: result.saved ? `${mic.openMic} saved` : `${mic.openMic} removed`,
      });
    } catch {
      toast({ title: "Error", description: "Failed to save mic", variant: "destructive" });
    }
  };

  const handleShare = async () => {
    const url = `https://comediq.us/mics/${encodeURIComponent(mic.openMic.toLowerCase().replace(/\s+/g, '-'))}`;
    if (navigator.share) {
      try { await navigator.share({ title: mic.openMic, text: `Check out ${mic.openMic} on Comediq!`, url }); }
      catch { await navigator.clipboard.writeText(`Check out ${mic.openMic} on Comediq! ${url}`); toast({ title: "Link copied!" }); }
    } else {
      await navigator.clipboard.writeText(`Check out ${mic.openMic} on Comediq! ${url}`);
      toast({ title: "Link copied!" });
    }
  };

  const igHandle = mic.instagramHandle?.trim();
  const igUrl = igHandle
    ? (igHandle.startsWith('http') ? igHandle : `https://instagram.com/${igHandle.replace(/^@/, '')}`)
    : null;

  return (
    <div className="flex items-center justify-evenly py-1.5 gap-1">
      {/* Directions */}
      <a href={getMapUrl(mic.location, mic.venueName)} target="_blank" rel="noopener noreferrer"
        className="p-1.5 rounded hover:bg-white/10 transition-colors" title="Directions">
        <Navigation className="w-4 h-4 text-[hsl(var(--comediq-cream))]" />
      </a>

      {/* Instagram */}
      {igUrl ? (
        <a href={igUrl} target="_blank" rel="noopener noreferrer"
          className="p-1.5 rounded hover:bg-white/10 transition-colors" title="Instagram">
          <Instagram className="w-4 h-4 text-[hsl(var(--comediq-cream))]" />
        </a>
      ) : (
        <span className="p-1.5 opacity-30"><Instagram className="w-4 h-4 text-[hsl(var(--comediq-cream))]" /></span>
      )}

      {/* Share */}
      <button onClick={handleShare} className="p-1.5 rounded hover:bg-white/10 transition-colors" title="Share">
        <Send className="w-4 h-4 text-[hsl(var(--comediq-cream))]" />
      </button>

      {/* Save */}
      <button onClick={handleSave} disabled={isToggling} className="p-1.5 rounded hover:bg-white/10 transition-colors" title="Save">
        <Bookmark className={cn("w-4 h-4 transition-all", isSaved ? "fill-amber-400 text-amber-400" : "text-[hsl(var(--comediq-cream))]")} />
      </button>

      {/* Like */}
      <button onClick={handleLike} disabled={isRating} className="p-1.5 rounded hover:bg-white/10 transition-colors flex items-center gap-0.5" title="Like">
        <Heart className={cn("w-4 h-4 transition-all", isLiked ? "fill-red-400 text-red-400" : "text-[hsl(var(--comediq-cream))]")} />
        {likeCount > 0 && <span className="text-[10px] text-[hsl(var(--comediq-cream))]">{likeCount}</span>}
      </button>

      {/* Comment */}
      <button onClick={() => setShowComments(!showComments)} className="p-1.5 rounded hover:bg-white/10 transition-colors flex items-center gap-0.5" title="Comments">
        <MessageCircle className={cn("w-4 h-4", showComments ? "fill-[hsl(var(--comediq-cream))] text-[hsl(var(--comediq-cream))]" : "text-[hsl(var(--comediq-cream))]")} />
        {commentCount > 0 && <span className="text-[10px] text-[hsl(var(--comediq-cream))]">{commentCount}</span>}
      </button>

      {/* Playlist */}
      <button onClick={() => { if (requireAuth("create playlists")) return; setShowPlaylistDialog(true); }}
        className="p-1.5 rounded hover:bg-white/10 transition-colors" title="Add to playlist">
        <ListPlus className="w-4 h-4 text-[hsl(var(--comediq-cream))]" />
      </button>

      <PlaylistSelectorDropdown
        micUniqueIdentifier={mic.uniqueIdentifier}
        micName={mic.openMic}
        open={showPlaylistDialog}
        onOpenChange={setShowPlaylistDialog}
      />
    </div>
  );
}

// ─── Transit Row Card ───
function TransitMicRow({ mic, onAddToCalendar }: { mic: OpenMic; onAddToCalendar: (mic: OpenMic) => void }) {
  const [expanded, setExpanded] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const { user } = useAuth();
  const { userLocation } = useUserLocation();
  const [distance, setDistance] = useState<string | null>(null);

  useEffect(() => {
    if (!userLocation || !mic.location) { setDistance(null); return; }
    DistanceService.calculateDistanceFromUser(mic.location, userLocation)
      .then(setDistance).catch(() => setDistance(null));
  }, [userLocation, mic.location]);

  const toggle = () => setExpanded(e => !e);

  return (
    <div className={`border-l-4 ${getBoroughBorder(mic.borough)} overflow-hidden`} id={mic.id}>
      {/* ── Collapsed Row ── */}
      <div
        className="flex items-center gap-2 px-3 py-2 bg-[hsl(var(--comediq-blue))] text-[hsl(var(--comediq-cream))] cursor-pointer hover:bg-[hsl(var(--comediq-blue-dark))] transition-colors select-none"
        onClick={toggle}
        role="button"
        tabIndex={0}
        onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') toggle(); }}
      >
        {/* Time */}
        <span className="text-xs font-bold w-[72px] flex-shrink-0 tabular-nums">
          {formatTimeRange(mic.startTime, mic.latestEndTime)}
        </span>

        {/* Venue */}
        <span className="text-sm font-semibold truncate flex-1 min-w-0">
          {mic.venueName}
        </span>

        {/* Neighborhood */}
        <span className="text-xs opacity-75 truncate hidden sm:block max-w-[120px]">
          {mic.neighborhood}
        </span>

        {/* Distance */}
        {distance && (
          <span className="text-[10px] font-medium opacity-75 flex-shrink-0 hidden sm:block">
            {distance}
          </span>
        )}

        {/* Frequency badge */}
        {mic.frequency && mic.frequency !== 'weekly' && (
          <span className="text-[9px] bg-white/15 rounded px-1 py-0 flex-shrink-0">
            {FREQUENCY_LABELS[mic.frequency]}
          </span>
        )}

        {/* Status traffic light */}
        <div className="flex-shrink-0" onClick={e => e.stopPropagation()}>
          <MicStatusDropdown micUniqueIdentifier={mic.uniqueIdentifier} />
        </div>

        {/* Add to Plan */}
        {user && (
          <button
            className="text-[10px] border border-[hsl(var(--comediq-cream))]/40 rounded px-1.5 py-0.5 hover:bg-white/10 transition-colors flex-shrink-0"
            onClick={e => { e.stopPropagation(); onAddToCalendar(mic); }}
            title="Add to plan"
          >
            + Plan
          </button>
        )}

        {/* Chevron */}
        <ChevronDown className={`w-4 h-4 flex-shrink-0 transition-transform duration-200 ${expanded ? 'rotate-180' : ''}`} />
      </div>

      {/* ── Expanded Section ── */}
      {expanded && (
        <div className="bg-[hsl(var(--comediq-blue-light))] text-[hsl(var(--comediq-cream))] px-3 py-2 space-y-2">
          {/* Mic name + neighborhood on mobile */}
          <div className="flex items-center justify-between">
            <span className="text-sm font-bold">{mic.openMic}</span>
            <span className="text-xs opacity-75 sm:hidden">{mic.neighborhood}</span>
          </div>

          {/* Quick info row */}
          <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs opacity-90">
            <span className="flex items-center gap-1"><DollarSign className="w-3 h-3" />{mic.cost}</span>
            <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{formatStageTime(mic.stageTime)}</span>
            {mic.instagramHandle?.trim() && (
              <span className="flex items-center gap-1 truncate max-w-[180px]">
                <UserRoundCheck className="w-3 h-3" />
                {makeLinksClickable(mic.instagramHandle)}
              </span>
            )}
            {distance && (
              <span className="flex items-center gap-1 sm:hidden"><Navigation className="w-3 h-3" />{distance}</span>
            )}
          </div>

          {/* Legacy tag */}
          {mic.legacyTag && (
            <span className="inline-block text-[10px] bg-white/15 rounded-full px-2 py-0">{mic.legacyTag}</span>
          )}

          {/* Sign-up instructions */}
          <div className="text-xs" onClick={e => e.stopPropagation()}>
            <span className="flex items-center gap-1 font-semibold mb-0.5"><UserRoundCheck className="w-3 h-3" />Sign-Up:</span>
            <span className="opacity-90">{mic.signUpInstructions ? makeLinksClickable(mic.signUpInstructions) : 'N/A'}</span>
          </div>

          {/* Address */}
          <a href={getMapUrl(mic.location, mic.venueName)} target="_blank" rel="noopener noreferrer"
            className="flex items-center gap-1 text-xs hover:underline opacity-90">
            <MapPin className="w-3 h-3 flex-shrink-0" /> {mic.location}
          </a>

          {/* House rules */}
          {mic.otherRules && (
            <div className="text-xs border-t border-white/20 pt-1.5">
              <div className="flex items-start gap-1">
                <ClipboardList className="w-3 h-3 mt-0.5 flex-shrink-0" />
                <div>
                  <span className="font-semibold">House Rules:</span>
                  <p className="opacity-90 whitespace-pre-wrap mt-0.5">{mic.otherRules}</p>
                </div>
              </div>
            </div>
          )}

          {/* Signup + Calendar buttons */}
          <div className="flex flex-wrap gap-2">
            {mic.signupEnabled && (
              <Button size="sm" className="bg-orange-600 hover:bg-orange-700 text-white text-xs h-7" asChild>
                <Link to={linkManager.micSignup(mic)}>
                  <UserRoundCheck className="w-3.5 h-3.5 mr-1" />Sign Up
                </Link>
              </Button>
            )}
            <a href={getGoogleCalendarUrl(mic)} target="_blank" rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-xs border border-white/30 rounded px-2 py-1 hover:bg-white/10 transition-colors"
              onClick={async () => {
                if (user) {
                  try { await supabase.from('gcal_clicks').insert({ user_id: user.id, created_at: new Date().toISOString() }); }
                  catch (e) { console.error(e); }
                }
              }}>
              <span className="font-bold">G</span> Google Cal
            </a>
            <button onClick={() => downloadICal(mic)}
              className="inline-flex items-center gap-1 text-xs border border-white/30 rounded px-2 py-1 hover:bg-white/10 transition-colors">
              <Calendar className="w-3.5 h-3.5" /> iCal
            </button>
          </div>

          {/* 6 Utility Icon Bar */}
          <div className="border-t border-white/20 pt-1">
            <InlineUtilityBar mic={mic} showComments={showComments} setShowComments={setShowComments} />
          </div>

          {/* Comments Section */}
          <MicCommentSection
            micUniqueIdentifier={mic.uniqueIdentifier}
            isExpanded={showComments}
            onClose={() => setShowComments(false)}
          />
        </div>
      )}
    </div>
  );
}

// ─── List Container ───
export default function OpenMicsDetailedList({
  mics,
  visibleCount,
  setVisibleCount,
}: {
  mics: OpenMic[];
  visibleCount: number;
  setVisibleCount: React.Dispatch<React.SetStateAction<number>>;
}) {
  const validMics = mics.filter(Boolean);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    const onScroll = () => setShowScrollTop(window.scrollY > 400);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const handleAddToCalendar = async (mic: OpenMic) => {
    if (!user) return;
    try {
      const { error } = await supabase.from('profile_open_mics').insert([{
        profile_id: user.id,
        open_mic_id: mic.uniqueIdentifier,
        schedule_type: 'upcoming',
      }]);
      if (error) {
        toast({ title: 'Error', description: error.message || 'Failed to add to your schedule.', variant: 'destructive' });
      } else {
        toast({ title: 'Added to Schedule', description: 'This open mic has been added to your schedule.' });
      }
    } catch {
      toast({ title: 'Error', description: 'An unexpected error occurred.', variant: 'destructive' });
    }
  };

  return (
    <div className="flex flex-col gap-0.5 rounded-sm overflow-hidden">
      {validMics.slice(0, visibleCount).map((mic) => (
        <TransitMicRow key={mic.id} mic={mic} onAddToCalendar={handleAddToCalendar} />
      ))}
      {visibleCount < validMics.length && (
        <div className="flex justify-center py-2">
          <button
            className="px-4 py-2 bg-[hsl(var(--comediq-blue))] text-[hsl(var(--comediq-cream))] rounded text-sm font-medium hover:bg-[hsl(var(--comediq-blue-dark))] transition-colors"
            onClick={() => setVisibleCount(c => c + 100)}
          >
            Show More
          </button>
        </div>
      )}
      <button
        onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
        className={`fixed bottom-24 right-4 z-50 bg-[hsl(var(--comediq-blue))] text-[hsl(var(--comediq-cream))] p-2 rounded-full shadow-lg hover:bg-[hsl(var(--comediq-blue-dark))] transition transform ${showScrollTop ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'} duration-300`}
        aria-label="Scroll to top"
      >
        <ArrowUp className="w-5 h-5" />
      </button>
    </div>
  );
}
