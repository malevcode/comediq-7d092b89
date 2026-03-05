import { Calendar, Clock, UserRoundCheck, DollarSign, CircleUser, MapPin, ArrowUp, ChevronDown, ExternalLink, Navigation, ClipboardList } from "lucide-react";
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
import MicActionBar from '@/components/mic/MicActionBar';
import MicCommentSection from '@/components/mic/MicCommentSection';
import { MicStatusBadge } from '@/components/mic/MicStatusBadge';
import { FREQUENCY_LABELS } from '@/types/openMic';

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

// Helper to truncate mic name to max 15 chars
function truncateMicName(name: string, maxLength: number = 15): string {
  if (!name) return '';
  return name.length > maxLength ? name.slice(0, maxLength) + '…' : name;
}

// Helper to format time compactly (e.g., "5:00 PM" → "5 PM", "5:30 PM" → "5:30 PM")
function formatTimeCompact(time: string): string {
  if (!time) return '';
  // Remove :00 when on the hour (e.g., "5:00 PM" → "5 PM")
  return time.replace(/:00/g, '');
}

// Helper to format time range compactly
function formatTimeRange(startTime: string, endTime: string): string {
  const start = formatTimeCompact(startTime);
  const end = formatTimeCompact(endTime);
  // If both are PM or AM, can simplify (e.g., "5 PM - 7 PM" → "5-7 PM")
  const startMatch = start.match(/^(\d+(?::\d+)?)\s*(AM|PM)$/i);
  const endMatch = end.match(/^(\d+(?::\d+)?)\s*(AM|PM)$/i);
  if (startMatch && endMatch && startMatch[2].toUpperCase() === endMatch[2].toUpperCase()) {
    return `${startMatch[1]}-${endMatch[1]} ${endMatch[2]}`;
  }
  return `${start} - ${end}`;
}

// Helper to format stage time compactly (e.g., "5 minutes" → "5 min")
function formatStageTime(stageTime: string): string {
  if (!stageTime) return 'Not specified';
  // Replace "minutes" with "min"
  let formatted = stageTime.replace(/minutes?/gi, 'min');
  // If it's just a number, add "min"
  if (/^\d+$/.test(formatted.trim())) {
    formatted = `${formatted.trim()} min`;
  }
  return formatted;
}

function OpenMicDetailedCard({ mic, onAddToCalendar }: { mic: OpenMic; onAddToCalendar: (mic: OpenMic) => void }) {
  const [expanded, setExpanded] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const { user } = useAuth();
  const { userLocation, locationLoading } = useUserLocation();
  const [distance, setDistance] = useState<string | null>(null);
  const [distanceLoading, setDistanceLoading] = useState(false);

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
    <div 
      className={`flex flex-col md:flex-row w-full bg-white border rounded-xl shadow-sm p-2.5 gap-0.5 md:gap-3 overflow-x-hidden hover:shadow-lg transition-all duration-300 ${getBoroughOutline(mic.borough)}`} 
      id={mic.id}
      style={mic.coverImageUrl ? {
        backgroundImage: `linear-gradient(rgba(255,255,255,0.92), rgba(255,255,255,0.92)), url(${mic.coverImageUrl})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center'
      } : undefined}
    >
      {/* Left: Name, Location, Date */}
      <div className="flex-1 min-w-0 mr-1 text-center">
        <div className="flex items-center w-full">
          {/* Left spacer for balance */}
          <div className="flex-1" />
          
          {/* Centered mic name with inline verified check */}
          <a 
            href={getMapUrl(mic.location, mic.venueName)}
            target="_blank"
            rel="noopener noreferrer"
            className="font-semibold text-base text-foreground hover:text-blue-600 hover:bg-blue-50 hover:rounded px-0.5 cursor-pointer transition-all duration-200 flex items-center gap-1"
            title={mic.openMic}
          >
            {mic.openMic}
            
            <ExternalLink className="w-3 h-3 text-muted-foreground" />
          </a>
          
          {/* Right-aligned traffic light + frequency pill */}
          <div className="flex-1 flex justify-end items-center gap-1">
            {mic.frequency && mic.frequency !== 'weekly' && (
              <span className="inline-flex items-center rounded-full bg-muted/50 text-muted-foreground border border-border/50 font-medium text-[10px] px-1.5 py-0 whitespace-nowrap">
                {FREQUENCY_LABELS[mic.frequency]}
              </span>
            )}
            <MicStatusDropdown 
              micUniqueIdentifier={mic.uniqueIdentifier}
            />
          </div>
        </div>
        <div className="text-xs text-muted-foreground mb-0.5">
          <span className="flex items-center gap-1 justify-center">
            <MapPin className="w-3 h-3 flex-shrink-0" />
            <a 
              href={getMapUrl(mic.location, mic.venueName)}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:underline truncate"
              title={`${mic.venueName}, ${mic.neighborhood}`}
            >
            {mic.venueName}, {mic.neighborhood}
            </a>
            {distance && (
              <span className="flex items-center gap-1 ml-1 text-blue-600 font-medium">
                <Navigation className="w-3 h-3" />
                {distance}
              </span>
            )}
            {distanceLoading && (
              <span className="flex items-center gap-1 ml-1 text-muted-foreground">
                <Navigation className="w-3 h-3 animate-pulse" />
              </span>
            )}
          </span>
          <span className="flex flex-row md:flex-col gap-1.5 md:gap-0 justify-center">
            <span className="flex items-center gap-1 justify-center">
              <Calendar className="w-3 h-3 flex-shrink-0" />
              {mic.frequency === 'weekly' ? '' : `${FREQUENCY_LABELS[mic.frequency]} · `}{mic.day}
            </span>
            <span className="flex items-center gap-1 md:hidden justify-center">
              <CircleUser className="w-3 h-3 flex-shrink-0" />
              <span className="truncate text-xs">
                {mic.instagramHandle && mic.instagramHandle.trim() ? makeLinksClickable(mic.instagramHandle) : "No host"}
              </span>
            </span>
          </span>
        </div>
      </div>
      {/* Mid: Time, Cost, Stage Time - Clickable to expand */}
      <div className="flex-1 flex flex-col justify-center min-w-0 gap-x-3 text-xs text-gray-700 mb-0 mr-1">
        <div 
          className="flex flex-row gap-x-4 sm:gap-2 items-center justify-center text-xs text-gray-700 cursor-pointer hover:bg-blue-50 rounded-md px-1 py-0.5 transition-colors"
          onClick={() => setExpanded(e => !e)}
          role="button"
          tabIndex={0}
          aria-expanded={expanded}
          onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') setExpanded(x => !x); }}
        >
          <span className="flex items-center gap-1"><Clock className="w-3 h-3 text-gray-400 flex-shrink-0" />{formatTimeRange(mic.startTime, mic.latestEndTime)}</span>
          <span className="flex items-center gap-1">
            <Clock className="w-3 h-3 text-gray-400 flex-shrink-0" />
            {formatStageTime(mic.stageTime)}
          </span>
          <span className="flex items-center gap-1"><DollarSign className="w-3 h-3 text-gray-400 flex-shrink-0" />{mic.cost}</span>
          <ChevronDown
            className={`w-4 h-4 text-blue-600 transition-transform duration-200 ${expanded ? 'rotate-180' : ''}`}
          />
        </div>
        {/* Host info - only on desktop, stays outside clickable area */}
        <span className="hidden md:flex items-center gap-1 mt-0.5 justify-center">
          <CircleUser className="w-3 h-3 flex-shrink-0 text-gray-400" />
          <span className="truncate text-xs">
            {mic.instagramHandle && mic.instagramHandle.trim() ? makeLinksClickable(mic.instagramHandle) : "No host"}
          </span>
        </span>
      </div>
      {/* Right: Expanded Details & Actions */}
      <div className="w-full md:flex-[1.2] flex flex-col justify-center gap-0">
        {expanded && (
          <div className="bg-blue-50 border border-blue-100 rounded-md p-2 flex flex-col gap-1.5">
            {mic.legacyTag && (
              <div className="flex items-center gap-1 text-[10px]">
                <span className="inline-flex items-center rounded-full bg-muted/50 text-muted-foreground border border-border/50 font-medium px-1.5 py-0">
                  {mic.legacyTag}
                </span>
              </div>
            )}
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
        {/* Social Action Bar - reduced top margin */}
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