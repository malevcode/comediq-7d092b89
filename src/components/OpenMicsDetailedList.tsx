import { Calendar, Clock, UserRoundCheck, DollarSign, CircleUser, MapPin, ArrowUp, ChevronDown, ExternalLink, Navigation, ClipboardList } from "lucide-react";
import { VerificationBadge } from "@/components/VerificationBadge";
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
import MicActionBar from '@/components/mic/MicActionBar';
import MicCommentSection from '@/components/mic/MicCommentSection';

// Helper function to get map URL based on device
function getMapUrl(location: string, venueName: string) {
  const searchQuery = encodeURIComponent(`${venueName}, ${location}`);
  
  // Detect if user is on iOS
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
  
  if (isIOS) {
    // Use Apple Maps on iOS
    return `https://maps.apple.com/?q=${searchQuery}`;
  } else {
    // Use Google Maps on other devices
    return `https://www.google.com/maps/search/?api=1&query=${searchQuery}`;
  }
}

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
  const [expanded, setExpanded] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const { user } = useAuth();
  const { userLocation, locationLoading } = useUserLocation();
  const [distance, setDistance] = useState<string | null>(null);
  const [distanceLoading, setDistanceLoading] = useState(false);

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

  // Calculate distance when user location changes
  useEffect(() => {
    const calculateDistance = async () => {
      if (!userLocation || !mic.location) {
        setDistance(null);
        return;
      }

      setDistanceLoading(true);
      try {
        const distanceResult = await DistanceService.calculateDistanceFromUser(mic.location, userLocation);
        setDistance(distanceResult);
      } catch (error) {
        console.error('Error calculating distance:', error);
        setDistance(null);
      } finally {
        setDistanceLoading(false);
      }
    };

    calculateDistance();
  }, [userLocation, mic.location]);

  
  return (
    <div className={`flex flex-col md:flex-row w-full bg-white border rounded-xl shadow-sm p-4 gap-2md:gap-6 overflow-x-hidden hover:shadow-lg transition-all duration-300 ${getBoroughOutline(mic.borough)}`} id={mic.id}>
      {/* Left: Name, Location, Date */}
      <div className="flex-1 min-w-0 mr-2">
        <div className="flex items-center gap-2">
          <a 
            href={getMapUrl(mic.location, mic.venueName)}
            target="_blank"
            rel="noopener noreferrer"
            className="font-semibold text-md text-gray-900 w-auto inline-block hover:text-blue-600 hover:bg-blue-50 hover:rounded px-1 py-0.5 cursor-pointer transition-all duration-200 flex items-center gap-1"
            title={`Open ${/iPad|iPhone|iPod/.test(navigator.userAgent) ? 'Apple Maps' : 'Google Maps'} for ${mic.venueName}`}
          >
            {mic.openMic}
            <ExternalLink className="w-3 h-3" />
          </a>
          <VerificationBadge 
            micUniqueIdentifier={mic.uniqueIdentifier}
            lastVerified={mic.lastVerified === "Unverified" ? undefined : mic.lastVerified}
            size="sm"
          />
        </div>
        <div className="text-sm text-gray-500 mb-1">
          <span className="flex items-center gap-1">
            <MapPin className="w-3 h-3 flex-shrink-0" />
            <a 
              href={getMapUrl(mic.location, mic.venueName)}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:underline"
              title={`Open ${/iPad|iPhone|iPod/.test(navigator.userAgent) ? 'Apple Maps' : 'Google Maps'} for ${mic.venueName}`}
            >
            {mic.venueName}, {mic.neighborhood}
            </a>
            {distance && (
              <span className="flex items-center gap-1 ml-2 text-blue-600 font-medium">
                <Navigation className="w-3 h-3" />
                {distance}
              </span>
            )}
            {distanceLoading && (
              <span className="flex items-center gap-1 ml-2 text-gray-400">
                <Navigation className="w-3 h-3 animate-pulse" />
                Calculating...
              </span>
            )}
          </span>
          <span className="flex flex-row md:flex-col gap-2 md:gap-0">
            <span className="flex items-center gap-1">
              <Calendar className="w-3 h-3 flex-shrink-0" />
              {mic.openMic?.toLowerCase().includes("biweekly")
                ? "Biweekly - " + mic.day
                : mic.day !== "Daily"
                  ? "Weekly - " + mic.day
                  : "Daily - " + mic.day}
            </span>
            <span className="flex items-center gap-1 md:hidden">
              <CircleUser className="w-3 h-3 flex-shrink-0" />
              <span className="truncate">
                {mic.instagramHandle && mic.instagramHandle.trim() ? makeLinksClickable(mic.instagramHandle) : "No host data"}
              </span>
            </span>
          </span>
        </div>
      </div>
      {/* Mid: Time, Cost, Audience Size, Stage Time, Rules */}
      <div className="flex-1 flex flex-col justify-center min-w-0 gap-x-4 gap-y-1 text-sm text-gray-700 mb-1 mr-2">
        <div className="flex flex-row gap-x-6 sm:gap-2 sm:items-center md:grid md:grid-cols-2 text-sm text-gray-700">
          <span className="flex items-center gap-1"><Clock className="w-3 h-3 text-gray-400 flex-shrink-0" />{mic.startTime} - {mic.latestEndTime}</span>
          <span className="flex items-center gap-1">
            <Clock className="w-3 h-3 text-gray-400 flex-shrink-0" />
            {mic.stageTime
              ? <>{mic.stageTime}{!/min/i.test(mic.stageTime) && " min"}</>
              : "Not specified"}
          </span>
          <span className="flex items-center gap-1"><DollarSign className="w-3 h-3 text-gray-400 flex-shrink-0" />{mic.cost}</span>
          <span className="hidden sm:hidden md:flex items-center gap-1">
            <CircleUser className="w-3 h-3 flex-shrink-0 text-gray-400" />
            <span className="truncate">
              {mic.instagramHandle && mic.instagramHandle.trim() ? makeLinksClickable(mic.instagramHandle) : "No host data"}
            </span>
          </span>
        </div>
        {/* {mic.otherRules && (
          <div className="text-xs text-gray-500 mt-1">Rules: {mic.otherRules}</div>
        )} */}
      </div>
      {/* Right: Value, Ratings, Button */}
      <div className="w-full md:flex-[1.2] flex flex-col justify-center">
        <div className="bg-blue-50 border border-blue-100 rounded-lg p-1.5 mb-2 relative w-full">
          <div
            className="cursor-pointer flex items-center gap-1 font-semibold text-xs text-blue-800"
            onClick={() => setExpanded(e => !e)}
            role="button"
            tabIndex={0}
            aria-expanded={expanded}
            aria-label={expanded ? 'Collapse details' : 'Expand details'}
            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') setExpanded(x => !x); }}
          >
            <span>Additional Details</span>
            <ChevronDown
              className={`w-4 h-4 ml-auto transition-transform duration-200 ${expanded ? 'rotate-180' : ''}`}
            />
          </div>
          {expanded && (
            <div className="flex flex-col gap-2 mt-2">
              <div
                className="break-words font-normal select-text cursor-text flex flex-row text-xs"
                onClick={e => e.stopPropagation()}
              >
                <span className="flex items-center gap-2 mr-1"><UserRoundCheck className="w-3 h-3" />Sign-Up Instructions:</span>
                <span className="flex">
                  {mic.signUpInstructions ? makeLinksClickable(mic.signUpInstructions) : 'N/A'}
                </span>
              </div>
              <div className="text-xs">
                <a href={getMapUrl(mic.location, mic.venueName)} target="_blank" rel="noopener noreferrer" className="flex flex-row gap-2 items-center hover:underline font-normal">
                  <MapPin className="w-3 h-3" /> {mic.location}
                </a>
              </div>
              {mic.otherRules && (
                <div className="text-xs mt-2 pt-2 border-t border-blue-200">
                  <div className="flex items-start gap-2">
                    <ClipboardList className="w-3 h-3 mt-0.5 text-blue-600 flex-shrink-0" />
                    <div>
                      <span className="font-medium text-blue-800">House Rules:</span>
                      <p className="text-gray-600 mt-1 whitespace-pre-wrap">
                        {mic.otherRules}
                      </p>
                    </div>
                  </div>
                </div>
              )}
              <div className="flex flex-col gap-2">
                {mic.signupEnabled && (
                  <Button
                    size="sm"
                    variant="default"
                    className="flex items-center justify-center gap-2 bg-orange-600 hover:bg-orange-700"
                    asChild
                  >
                    <Link to={linkManager.micSignup(mic)}>
                      <UserRoundCheck className="w-4 h-4" />
                      Sign Up for Spots
                    </Link>
                  </Button>
                )}
                {user && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="flex items-center justify-center gap-2"
                    onClick={() => onAddToCalendar(mic)}
                  >
                    <Calendar className="w-4 h-4" />
                    Add to Calendar
                  </Button>
                )}
              </div>
              <div className="flex flex-row gap-2 mt-2">
                <Button
                  size="sm"
                  variant="outline"
                  className="w-full flex items-center justify-center gap-2 border-gray-300 hover:bg-gray-100"
                  asChild
                >
                  <a
                    href={getGoogleCalendarUrl(mic)}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="Add to Google Calendar"
                    onClick={async () => {
                      if (user) {
                        try {
                          await supabase
                            .from('gcal_clicks')
                            .insert({
                              user_id: user.id,
                              created_at: new Date().toISOString()
                            });
                        } catch (error) {
                          console.error('Error logging Google Calendar click:', error);
                        }
                      }
                    }}
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
                  className="w-full flex items-center justify-center gap-2 border-gray-300 hover:bg-gray-100"
                  onClick={() => downloadICal(mic)}
                  aria-label="Download iCal file"
                >
                  <Calendar className="text-orange-500 w-4 h-4" />
                  <span className="text-orange-500">Download iCal</span>
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Social Action Bar */}
        <MicActionBar
          micUniqueIdentifier={mic.uniqueIdentifier}
          micName={mic.openMic}
          onCommentClick={() => setShowComments(!showComments)}
          showCommentSection={showComments}
        />

        {/* Comments Section */}
        <MicCommentSection
          micUniqueIdentifier={mic.uniqueIdentifier}
          isExpanded={showComments}
          onClose={() => setShowComments(false)}
        />
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
  // Mics are already sorted by next occurrence from the parent component
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
      {validMics.slice(0, visibleCount).map((mic) => (
        <OpenMicDetailedCard key={mic.id} mic={mic} onAddToCalendar={handleAddToCalendar}/>
      ))}
      {visibleCount < validMics.length && (
        <div className="flex justify-center">
          <button
            className="px-2 py-2 w-auto bg-orange-500 text-white rounded hover:bg-orange-600 text-sm"
            onClick={() => setVisibleCount(c => c + 100)}
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