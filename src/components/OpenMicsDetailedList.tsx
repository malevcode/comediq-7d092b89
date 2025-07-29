import { Calendar, Clock, Users, DollarSign, Star, MapPin, CircleUser, CircleAlert, CircleCheckBig, ArrowUp, ChevronDown, ChevronUp, Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { OpenMic } from "@/types/openMic";
import { useMicRatings } from "@/hooks/useMicRatings";
import { useState, useEffect } from "react";
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

function downloadICal(mic: OpenMic) {
  const event = generateCalendarEvent(mic);
  const icalContent = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Comediq//Open Mic//EN',
    'BEGIN:VEVENT',
    `DTSTART:${event.start}`,
    `DTEND:${event.end}`,
    `SUMMARY:${event.title}`,
    `DESCRIPTION:${event.description.replace(/\n/g, '\\n')}`,
    `LOCATION:${event.location}`,
    `UID:${mic.uniqueIdentifier || mic.openMic.replace(/[^a-z0-9]/gi, '_').toLowerCase()}@comediq.app`,
    'END:VEVENT',
    'END:VCALENDAR'
  ].join('\r\n');
  const blob = new Blob([icalContent], { type: 'text/calendar' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${mic.openMic.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.ics`;
  document.body.appendChild(a);
  a.click();
  setTimeout(() => {
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, 0);
}

function getNextOccurrence(mic: OpenMic) {
  const daysOfWeek = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  const today = new Date();
  const currentDay = today.getDay();
  const targetDay = daysOfWeek.indexOf(mic.day);
  let daysUntil = targetDay - currentDay;
  // Only add 7 if the day is in the past (not today)
  if (daysUntil < 0) {
    daysUntil += 7;
  }
  const nextDate = new Date(today);
  nextDate.setDate(today.getDate() + daysUntil);
  return nextDate;
}

function generateCalendarEvent(mic: OpenMic) {
  const nextDate = getNextOccurrence(mic);
  // Parse start time
  const [startHour, startMinute] = mic.startTime.replace(/[^\d:]/g, '').split(':').map(Number);
  // Parse end time
  const [endHour, endMinute] = mic.latestEndTime
    ? mic.latestEndTime.replace(/[^\d:]/g, '').split(':').map(Number)
    : [startHour + 1, startMinute]; // fallback if no end time

  // Handle AM/PM for start
  let startHour24 = startHour;
  if (mic.startTime.includes('PM') && startHour !== 12) startHour24 += 12;
  if (mic.startTime.includes('AM') && startHour === 12) startHour24 = 0;

  // Handle AM/PM for end
  let endHour24 = endHour;
  if (mic.latestEndTime) {
    if (mic.latestEndTime.includes('PM') && endHour !== 12) endHour24 += 12;
    if (mic.latestEndTime.includes('AM') && endHour === 12) endHour24 = 0;
  }

  // Calculate duration in minutes
  const startTotalMinutes = startHour24 * 60 + (startMinute || 0);
  const endTotalMinutes = endHour24 * 60 + (endMinute || 0);
  const durationMinutes = endTotalMinutes > startTotalMinutes
    ? endTotalMinutes - startTotalMinutes
    : 60; // fallback to 1 hour if invalid

  nextDate.setHours(startHour24, startMinute || 0, 0, 0);
  const endDate = new Date(nextDate.getTime() + durationMinutes * 60 * 1000);
  const formatDate = (date: Date) => {
    return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
  };
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
    action: 'TEMPLATE',
    text: event.title,
    dates: `${event.start}/${event.end}`,
    details: event.description,
    location: event.location
  });
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

function OpenMicDetailedCard({ mic, onAddToCalendar }: { mic: OpenMic; onAddToCalendar: (mic: OpenMic) => void }) {
  const { userRating, ratingCounts, rateMic, removeRating, isRating } = useMicRatings(mic.uniqueIdentifier);
  const [expanded, setExpanded] = useState(false);
  const { user } = useAuth();
  // Helper to get first line or summary
  const getSummary = (text: string) => {
    if (!text) return '';
    const firstLine = text.split('\n')[0];
    return firstLine.length > 80 ? firstLine.slice(0, 80) + '...' : firstLine;
  };
  // Helper to get borough outline color
  const getBoroughOutline = (borough: string) => {
    const cleanBorough = (borough || '').trim();
    const outlines: Record<string, string> = {
      Manhattan: "border-l-4 border-l-cyan-500",
      Brooklyn: "border-l-4 border-l-amber-800",
      Queens: "border-l-4 border-l-purple-600",
      Bronx: "border-l-4 border-l-orange-600",
      "Staten Island": "border-l-4 border-l-gray-500"
    };
    return outlines[cleanBorough] || "border-l-4 border-l-gray-400";
  };
  return (
    <div className={`flex flex-col md:flex-row w-full bg-white border rounded-xl shadow-sm p-4 gap-2md:gap-6 overflow-x-hidden hover:shadow-lg transition-all duration-300 ${getBoroughOutline(mic.borough)}`}>
      {/* Left: Name, Location, Date */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className="font-semibold text-md text-gray-900 w-auto inline-block">{mic.openMic}</span>
          <span className={`text-xs px-2 py-0.5 rounded-full font-medium
            ${/tediously/i.test(mic.lastVerified)
              ? 'border border-yellow-200 bg-yellow-50 text-yellow-700'
              : mic.lastVerified === 'Unverified'
                ? 'border border-red-200 bg-red-50 text-red-700'
                : 'border border-green-200 bg-green-50 text-green-700'}`}>
            <span className="flex items-center gap-1">
              {/tediously/i.test(mic.lastVerified)
                ? <span className="flex items-center gap-1"><CircleCheckBig className="w-3 h-3" /> Verified Tediously</span>
                : mic.lastVerified === 'Unverified'
                  ? <span className="flex items-center gap-1"><CircleAlert className="w-3 h-3" /> Unverified</span>
                  : <span className="flex items-center gap-1"><CircleCheckBig className="w-3 h-3" /> Verified</span>
              }
            </span>
          </span>
          {/* Like Button to the right of mic name and status */}
          {user ? (
            <Button
              className={`flex items-center justify-center rounded-3xl px-2 text-sm transition-all
                ${userRating === 'like'
                  ? 'bg-pink-50 hover:bg-pink-100 border-pink-300'
                  : 'bg-white border-gray-300 hover:bg-gray-100'} text-gray-700`}
              size="sm"
              variant="outline"
              onClick={() => {
                if (userRating === 'like') removeRating(mic.uniqueIdentifier);
                else rateMic({ micUniqueIdentifier: mic.uniqueIdentifier, rating: 'like' });
              }}
              disabled={isRating}
              aria-label={userRating === 'like' ? 'Unlike' : 'Like'}
            >
              <Heart className={`w-4 h-4 ${userRating === 'like' ? 'fill-red-400 text-red-400' : ''}`} />
              <span className="mr-1 text-sm text-gray-600">{ratingCounts?.likes || 0}</span>
            </Button>
          ) : null}
        </div>
        <div className="text-sm text-gray-500">
          <span className="flex items-center gap-1"><MapPin className="w-3 h-3 flex-shrink-0" />{mic.venueName}, {mic.neighborhood}</span>
          <span className="flex items-center gap-1"><Calendar className="w-3 h-3 flex-shrink-0"/>
          {mic.openMic?.toLowerCase().includes("biweekly")
            ? "Biweekly - " + mic.day
            : mic.day !== "Daily"
              ? "Weekly - " + mic.day
              : "Daily - " + mic.day}
          </span>
        </div>
      </div>
      {/* Mid: Time, Cost, Audience Size, Stage Time, Rules */}
      <div className="flex-1 flex flex-col justify-evenly min-w-0 gap-x-4 gap-y-1 text-sm text-gray-700 max-w-lg mr-5 ml-5">
        <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm text-gray-700 max-w-lg">
          <span className="flex items-center gap-1"><Clock className="w-3 h-3 text-gray-400 flex-shrink-0" />{mic.startTime} - {mic.latestEndTime}</span>
          <span className="flex items-center gap-1">
            <Clock className="w-3 h-3 text-gray-400 flex-shrink-0" />
            {mic.stageTime
              ? <>{mic.stageTime}{!/min/i.test(mic.stageTime) && " min"}</>
              : "Not specified"}
          </span>
          <span className="flex items-center gap-1"><DollarSign className="w-3 h-3 text-gray-400 flex-shrink-0" />{mic.cost}</span>
          <span className="flex items-center gap-1 text-gray-600">
            <CircleUser className="w-4 h-4 text-gray-400" />
            {mic.instagramHandle && mic.instagramHandle.trim() ? mic.instagramHandle : "No host"}
          </span>
        </div>
        {mic.otherRules && (
          <div className="text-xs text-gray-500 mt-1">Rules: {mic.otherRules}</div>
        )}
      </div>
      {/* Right: Value, Ratings, Button */}
      <div className="w-full md:flex-[1.2] flex flex-col justify-center">
        <button
          className="appearance-none cursor-pointer bg-blue-50 border border-blue-100 rounded-lg p-2 mb-2 relative w-full text-left flex flex-col hover:bg-blue-100 transition font-semibold text-xs text-blue-800 gap-1 outline-none"
          aria-label={expanded ? 'Collapse details' : 'Expand details'}
          onClick={() => setExpanded(e => !e)}
          type="button"
        >
          <span className="flex items-center gap-1">
            <CircleUser className="w-4 h-4" />
            <span>Sign-Up Instructions</span>
            <ChevronDown
              className={`w-4 h-4 ml-auto transition-transform duration-200 ${expanded ? 'rotate-180' : ''}`}
            />
          </span>
          {expanded && (
            <div
              className="text-xs text-blue-700 break-words mt-2 font-normal select-text cursor-text"
              onClick={e => e.stopPropagation()}
            >
              {(() => {
                // Simple regex to detect a URL
                const urlRegex = /(https?:\/\/[^\s]+)/g;
                const match = mic.signUpInstructions.match(urlRegex);
                if (match && match.length === 1 && mic.signUpInstructions.trim() === match[0]) {
                  // If the entire instructions is just a URL
                  return (
                    <a
                      href={match[0]}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 underline break-all"
                    >
                      Sign up at this link
                    </a>
                  );
                } else if (match && match.length === 1 && mic.signUpInstructions.replace(match[0], '').trim() === '') {
                  // If the only content is a URL (with whitespace)
                  return (
                    <a
                      href={match[0]}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 underline break-all"
                    >
                      Sign up at this link
                    </a>
                  );
                } else if (mic.signUpInstructions === "") {
                  return <span>N/A</span>
                } else {
                  // Otherwise, show the instructions as text
                  return mic.signUpInstructions;
                }
              })()}
            </div>
          )}
        </button>
        <div className="flex flex-col md:flex-row gap-2 mb-2">
          {user && (
            <Button
              size="sm"
              className="w-full bg-papaya text-white hover:bg-papaya/80 flex items-center justify-center gap-2"
              onClick={() => onAddToCalendar(mic)}
            >
              <Calendar className="w-4 h-4" />
              Add to Calendar
            </Button>
          )}
          <div className="flex flex-row gap-2">
            <Button
              size="sm"
              variant="outline"
              className="w-full flex items-center justify-center gap-2 border-gray-300 text-gray-700 hover:bg-gray-100"
              asChild
            >
              <a
                href={getGoogleCalendarUrl(mic)}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Add to Google Calendar"
              >
                <span className="flex items-center gap-1">
                  <span className="inline-block w-4 h-4 bg-white text-sky font-bold rounded-full flex items-center justify-center">G</span>
                  <span className="text-sky">Google Calendar</span>
                </span>
              </a>
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="w-full flex items-center justify-center gap-2 border-gray-300 text-gray-700 hover:bg-gray-100"
              onClick={() => downloadICal(mic)}
              aria-label="Download iCal file"
            >
              <Calendar className="text-orange-500 w-4 h-4" />
              <span className="text-orange-500">Download iCal</span>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

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
  // Sort mics by soonest next occurrence from today
  const sortedMics = [...validMics].sort((a, b) => {
    const aDate = getNextOccurrence(a);
    const bDate = getNextOccurrence(b);
    return aDate.getTime() - bDate.getTime();
  });
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
      console.log({
        profile_id: user.id,
        open_mic_id: mic.uniqueIdentifier,
        schedule_type: 'upcoming',
      });
      const { error } = await supabase.from('profile_open_mics').insert([
        {
          profile_id: user.id,
          open_mic_id: mic.uniqueIdentifier,
          schedule_type: 'upcoming',
        },
      ]);
      if (error) {
        console.error('Supabase error:', error);
        toast({
          title: 'Error',
          description: error.message || 'Failed to add to your schedule.',
          variant: 'destructive',
        });
      } else {
        toast({
          title: 'Added to Schedule',
          description: 'This open mic has been added to your schedule.',
        });
      }
    } catch (e) {
      toast({
        title: 'Error',
        description: 'An unexpected error occurred.',
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="flex flex-col gap-3">
      {sortedMics.slice(0, visibleCount).map((mic) => (
        <OpenMicDetailedCard key={mic.uniqueIdentifier} mic={mic} onAddToCalendar={handleAddToCalendar} />
      ))}
      {visibleCount < validMics.length && (
        <div className="flex justify-center">
          <button
            className="px-2 py-2 w-auto bg-orange-500 text-white rounded hover:bg-orange-600 text-sm"
            onClick={() => setVisibleCount(c => c + 25)}
          >
            Show More
          </button>
        </div>
      )}
      <button
        onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
        className={`
          fixed bottom-24 right-4 z-50 bg-orange-500 text-white p-2 rounded-full shadow-lg hover:bg-orange-600 transition
          transform
          ${showScrollTop ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'}
          duration-300
        `}
        aria-label="Scroll to top"
      >
        <ArrowUp className="w-5 h-5" />
      </button>
    </div>
  );
}