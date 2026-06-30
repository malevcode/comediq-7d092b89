import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { X, Calendar, Clock, MapPin, User, DollarSign, Timer, Plus, Share, Heart, ThumbsDown, LogIn, ChevronDown, UserCheck } from "lucide-react";
import { VerificationBadge } from "@/components/VerificationBadge";
import { OpenMic, FREQUENCY_LABELS } from "@/types/openMic";
import { useAuth } from "@/contexts/AuthContext";
import { useMicRatings, useUserLikedMics } from "@/hooks/useMicRatings";
import { useNavigate } from "react-router-dom";
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { makeLinksClickable } from '@/utils/makeLinksClickable';
import { linkManager } from '@/utils/linkManager';
import { Link } from 'react-router-dom';
import { MicStatusBadge } from '@/components/mic/MicStatusBadge';

interface MicDetailModalProps {
  mic: OpenMic;
  onClose: () => void;
  onAddToSchedule?: (micData: any) => void;
}

const MicDetailModal = ({ mic, onClose, onAddToSchedule }: MicDetailModalProps) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { userRating, ratingCounts, rateMic, removeRating, isRating } = useMicRatings(mic.uniqueIdentifier);
  const { toast } = useToast();

  const handleRating = (rating: 'like' | 'dislike') => {
    if (!user) {
      navigate('/auth');
      return;
    }

    if (userRating === rating) {
      removeRating(mic.uniqueIdentifier);
    } else {
      rateMic({ micUniqueIdentifier: mic.uniqueIdentifier, rating });
    }
  };

  const getNextOccurrence = () => {
    const daysOfWeek = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    const today = new Date();
    const currentDay = today.getDay();
    const targetDay = daysOfWeek.indexOf(mic.day);
    
    let daysUntil = targetDay - currentDay;
    if (daysUntil <= 0) {
      daysUntil += 7;
    }
    
    const nextDate = new Date(today);
    nextDate.setDate(today.getDate() + daysUntil);
    
    return nextDate;
  };

  const generateCalendarEvent = () => {
    const nextDate = getNextOccurrence();
    const [hours, minutes] = mic.startTime.includes('AM') || mic.startTime.includes('PM') 
      ? mic.startTime.replace(/[^\d:]/g, '').split(':').map(Number)
      : mic.startTime.split(':').map(Number);
    
    // Handle PM/AM conversion
    let hour24 = hours;
    if (mic.startTime.includes('PM') && hours !== 12) {
      hour24 += 12;
    } else if (mic.startTime.includes('AM') && hours === 12) {
      hour24 = 0;
    }
    
    nextDate.setHours(hour24, minutes || 0);
    
    const endDate = new Date(nextDate);
    endDate.setHours(hour24 + 2); // Assume 2-hour duration
    
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
  };

  const getGoogleCalendarUrl = () => {
    const event = generateCalendarEvent();
    const params = new URLSearchParams({
      action: 'TEMPLATE',
      text: event.title,
      dates: `${event.start}/${event.end}`,
      details: event.description,
      location: event.location
    });
    return `https://calendar.google.com/calendar/render?${params.toString()}`;
  };

  const generateICalFile = () => {
    const event = generateCalendarEvent();
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
      `UID:${mic.uniqueIdentifier}@comediq.app`,
      'END:VEVENT',
      'END:VCALENDAR'
    ].join('\r\n');

    const blob = new Blob([icalContent], { type: 'text/calendar' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${mic.openMic.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.ics`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleAddToSchedule = async () => {
    if (!user) {
      navigate('/auth');
      return;
    }

    // Insert into profile_open_mics table
    try {
      const { error } = await supabase.from('profile_open_mics').insert([
        {
          profile_id: user.id,
          open_mic_id: mic.uniqueIdentifier,
          schedule_type: 'upcoming',
        },
      ]);
      if (error) {
        toast({
          title: 'Error',
          description: 'Failed to add to your schedule.',
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

    // Optionally call the old onAddToSchedule logic
    if (onAddToSchedule) {
      const event = generateCalendarEvent();
      const showData = {
        title: mic.openMic,
        venue: mic.venueName,
        location: mic.location,
        date: event.date,
        time: mic.startTime,
        status: 'upcoming' as const,
        notes: `Open mic - ${mic.cost} - ${mic.stageTime} stage time`
      };
      onAddToSchedule(showData);
    }
  };

  const getStatusBadgeColor = () => {
    // if (mic.lastVerified.toLowerCase().includes("tediously")) {
    //   return "bg-yellow-100 text-yellow-800 border-yellow-200";
    // } else if (mic.lastVerified.toLowerCase().includes("verified")) {
    //   return "bg-green-100 text-green-800 border-green-200";
    // } else {
    //   return "bg-red-100 text-red-800 border-red-200";
    // }
    if (mic.lastVerified.toLowerCase().includes("unverified")) {
      return "bg-red-100 text-red-800 border-red-200";
    } else {
      return "bg-green-100 text-green-800 border-green-200";
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-background border-b border-border px-6 py-4 rounded-t-2xl">
          <div className="flex justify-between items-start">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5 mb-1">
                <h2 className="text-2xl font-bold text-foreground">{mic.openMic}</h2>
                <MicStatusBadge status={mic.status} legacyTag={mic.legacyTag} size="md" />
              </div>
              <p className="text-muted-foreground">{mic.venueName}</p>
              <div className="flex items-center gap-3 mt-2 flex-wrap">
                <div className="bg-muted/50 border border-border px-3 py-1 rounded-lg">
                  <div className="text-sm font-semibold text-foreground">
                    {mic.frequency !== 'weekly' ? `${FREQUENCY_LABELS[mic.frequency]} · ` : ''}{mic.day} • {mic.startTime} • {mic.stageTime} stage time
                  </div>
                </div>
                <VerificationBadge 
                  micUniqueIdentifier={mic.uniqueIdentifier}
                  lastVerified={mic.lastVerified === "Unverified" ? undefined : mic.lastVerified}
                  size="sm"
                />
              </div>
            </div>
            <Button onClick={onClose} variant="ghost" size="sm" className="rounded-full">
              <X className="w-5 h-5" />
            </Button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Quick Actions */}
          <div className="mb-6 flex gap-3">
            <Button
              asChild
              className="bg-orange-600 hover:bg-orange-700 text-white text-sm flex-1"
            >
              <Link to={linkManager.micSignup(mic)}>
                <Plus className="w-4 h-4 mr-2" />
                Sign Up for Spots
              </Link>
            </Button>
            {user && (
              <Button
                onClick={handleAddToSchedule}
                variant="outline"
                className="text-sm flex-1"
              >
                <Plus className="w-4 h-4 mr-2" />
                My Schedule
              </Button>
            )}
          </div>

          {/* Rating Section */}
          <Card className="mb-6 bg-gray-50 border-gray-200">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <Button
                    onClick={() => handleRating('like')}
                    variant={userRating === 'like' ? 'default' : 'outline'}
                    size="sm"
                    disabled={isRating}
                    className={userRating === 'like' ? 'bg-green-500 hover:bg-green-600' : ''}
                  >
                    <Heart className={`h-4 w-4 mr-1 ${userRating === 'like' ? 'fill-current' : ''}`} />
                    {ratingCounts?.likes || 0}
                  </Button>
                  
                  <Button
                    onClick={() => handleRating('dislike')}
                    variant={userRating === 'dislike' ? 'default' : 'outline'}
                    size="sm"
                    disabled={isRating}
                    className={userRating === 'dislike' ? 'bg-red-500 hover:bg-red-600' : ''}
                  >
                    <ThumbsDown className={`h-4 w-4 mr-1 ${userRating === 'dislike' ? 'fill-current' : ''}`} />
                    {ratingCounts?.dislikes || 0}
                  </Button>
                </div>
                
                {!user && (
                  <Button onClick={() => navigate('/auth')} size="sm" className="bg-orange-500 hover:bg-orange-600">
                    <LogIn className="h-4 w-4 mr-2" />
                    Sign In to Rate
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Details Grid */}
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <MapPin className="w-5 h-5 text-gray-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-medium text-gray-900">Location</p>
                    <p className="text-sm text-gray-600">{mic.neighborhood}, {mic.borough}</p>
                    <p className="text-sm text-blue-600">{makeLinksClickable(mic.location)}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <DollarSign className="w-5 h-5 text-gray-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-medium text-gray-900">Cost</p>
                    <p className="text-sm text-gray-600">{mic.cost}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <User className="w-5 h-5 text-gray-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-medium text-gray-900">Host(s)</p>
                    <p className="text-sm text-gray-600">{mic.hosts}</p>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <div>
                  <p className="font-medium text-gray-900 mb-2">Sign-Up Instructions</p>
                  <div className="space-y-3 text-sm text-gray-600 bg-blue-50 p-3 rounded-lg">
                    <div>{makeLinksClickable(mic.signUpInstructions)}</div>
                    <Button
                      asChild
                      size="sm"
                      className="bg-orange-600 hover:bg-orange-700 text-white"
                    >
                      <Link to={linkManager.micSignup(mic)}>
                        Open Comediq signup sheet
                      </Link>
                    </Button>
                  </div>
                </div>
              </div>
            </div>


            {mic.instagramHandle && (
              <div>
                <p className="font-medium text-gray-900 mb-2">Recent Updates</p>
                <div className="text-sm text-gray-600 bg-orange-50 p-3 rounded-lg">
                  {makeLinksClickable(mic.instagramHandle)}
                </div>
              </div>
            )}

            {/* Host Claim CTA */}
            <div className="bg-gradient-to-r from-primary/5 via-primary/10 to-transparent border border-primary/20 rounded-lg p-4">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="font-medium text-gray-900">Are you the host?</p>
                  <p className="text-sm text-gray-600">Claim this mic to manage signups and keep info updated</p>
                </div>
                <Button asChild variant="outline" size="sm">
                  <Link to={`/host-dashboard?claim=${mic.uniqueIdentifier}`}>
                    Claim Mic
                  </Link>
                </Button>
              </div>
            </div>
          </div>

          {/* Additional Actions - Collapsible */}
          <Collapsible>
            <CollapsibleTrigger asChild>
              <Button
                variant="ghost"
                className="w-full justify-between p-0 h-auto font-normal text-left mt-4"
              >
                <span className="flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  <span>Calendar Actions</span>
                </span>
                <ChevronDown className="w-4 h-4" />
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="mt-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Button 
                  onClick={() => window.open(getGoogleCalendarUrl(), '_blank')}
                  className="bg-blue-600 hover:bg-blue-700 text-white text-sm"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Google Calendar
                </Button>
                <Button 
                  onClick={generateICalFile}
                  variant="outline"
                  className="border-green-300 hover:bg-green-50 text-sm"
                >
                  <Calendar className="w-4 h-4 mr-2" />
                  Download iCal
                </Button>
              </div>
            </CollapsibleContent>
          </Collapsible>
        </div>
      </div>
    </div>
  );
};

export default MicDetailModal;
