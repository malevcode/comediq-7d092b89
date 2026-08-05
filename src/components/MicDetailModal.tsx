import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { X, Calendar, MapPin, User, DollarSign, Plus, Heart, ThumbsDown, LogIn, ChevronDown } from "lucide-react";

import { OpenMic, FREQUENCY_LABELS } from "@/types/openMic";
import { useAuth } from "@/contexts/AuthContext";
import { useMicRatings } from "@/hooks/useMicRatings";
import { useNavigate } from "react-router-dom";
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { makeLinksClickable } from '@/utils/makeLinksClickable';
import { linkManager } from '@/utils/linkManager';
import { Link } from 'react-router-dom';
import { MicStatusBadge } from '@/components/mic/MicStatusBadge';
import { createPortal } from 'react-dom';
import { useEffect } from 'react';

type ScheduleMicData = {
  title: string;
  venue: string;
  location: string;
  date: Date;
  time: string;
  status: 'upcoming';
  notes: string;
};

interface MicDetailModalProps {
  mic: OpenMic;
  onClose: () => void;
  onAddToSchedule?: (micData: ScheduleMicData) => void;
}

const MicDetailModal = ({ mic, onClose, onAddToSchedule }: MicDetailModalProps) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { userRating, ratingCounts, rateMic, removeRating, isRating } = useMicRatings(mic.uniqueIdentifier);
  const { toast } = useToast();

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, []);

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

  return createPortal(
    <div className="fixed inset-0 z-[1200] overflow-y-auto overscroll-contain bg-black/60 p-4">
      <div className="mx-auto mb-4 mt-4 w-full max-w-2xl rounded-2xl border border-[#07111f]/10 bg-white/90 text-[#07111f] shadow-[0_24px_80px_rgba(2,10,30,0.24)] backdrop-blur-xl dark:border-white/10 dark:bg-[#102a53]/90 dark:text-white dark:shadow-[0_24px_80px_rgba(2,10,30,0.50)]">
        {/* Header */}
        <div className="border-b border-[#07111f]/10 bg-white/70 px-6 py-4 rounded-t-2xl dark:border-white/10 dark:bg-white/10">
          <div className="flex justify-between items-start">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5 mb-1">
                <h2 className="text-2xl font-bold text-[#07111f] dark:text-white">{mic.openMic}</h2>
                <MicStatusBadge status={mic.status} legacyTag={mic.legacyTag} size="md" />
              </div>
              <p className="text-[#07111f]/60 dark:text-white/70">{mic.venueName}</p>
              <div className="flex items-center gap-3 mt-2 flex-wrap">
                <div className="rounded-lg border border-[#07111f]/10 bg-white/70 px-3 py-1 dark:border-white/10 dark:bg-white/10">
                  <div className="text-sm font-semibold text-[#07111f] dark:text-white">
                    {mic.frequency !== 'weekly' ? `${FREQUENCY_LABELS[mic.frequency]} · ` : ''}{mic.day} • {mic.startTime} • {mic.stageTime} stage time
                  </div>
                </div>
              </div>
            </div>
            <Button onClick={onClose} variant="ghost" size="sm" className="rounded-full text-[#07111f] hover:bg-[#07111f]/10 dark:text-white dark:hover:bg-white/10">
              <X className="w-5 h-5" />
            </Button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Quick Actions */}
          <div className="mb-6 flex flex-wrap gap-3">
            <Button
              asChild
              className="min-w-[180px] flex-1 bg-orange-600 text-sm text-white hover:bg-orange-700"
            >
              <Link to={linkManager.micSignup(mic)} className="whitespace-normal text-center leading-tight">
                <Plus className="mr-2 h-4 w-4 flex-shrink-0" />
                <span>Sign Up for Spots</span>
              </Link>
            </Button>
            {user && (
              <Button
                onClick={handleAddToSchedule}
                variant="outline"
                className="min-w-[180px] flex-1 whitespace-normal border-[#07111f]/10 bg-white/70 text-center text-sm leading-tight text-[#07111f] hover:bg-white dark:border-white/10 dark:bg-white/10 dark:text-white dark:hover:bg-white/20"
              >
                <Plus className="mr-2 h-4 w-4 flex-shrink-0" />
                <span>My Schedule</span>
              </Button>
            )}
          </div>

          {/* Rating Section */}
          <Card className="mb-6 border-[#07111f]/10 bg-white/70 shadow-[0_10px_30px_rgba(2,10,30,0.10)] backdrop-blur-xl dark:border-white/10 dark:bg-white/10 dark:shadow-[0_18px_50px_rgba(2,10,30,0.26)]">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <Button
                    onClick={() => handleRating('like')}
                    variant={userRating === 'like' ? 'default' : 'outline'}
                    size="sm"
                    disabled={isRating}
                    className={userRating === 'like' ? 'bg-green-500 text-white hover:bg-green-600' : 'border-[#07111f]/10 bg-white/70 text-[#07111f] hover:bg-white dark:border-white/10 dark:bg-white/10 dark:text-white dark:hover:bg-white/20'}
                  >
                    <Heart className={`h-4 w-4 mr-1 ${userRating === 'like' ? 'fill-current' : ''}`} />
                    {ratingCounts?.likes || 0}
                  </Button>
                  
                  <Button
                    onClick={() => handleRating('dislike')}
                    variant={userRating === 'dislike' ? 'default' : 'outline'}
                    size="sm"
                    disabled={isRating}
                    className={userRating === 'dislike' ? 'bg-red-500 text-white hover:bg-red-600' : 'border-[#07111f]/10 bg-white/70 text-[#07111f] hover:bg-white dark:border-white/10 dark:bg-white/10 dark:text-white dark:hover:bg-white/20'}
                  >
                    <ThumbsDown className={`h-4 w-4 mr-1 ${userRating === 'dislike' ? 'fill-current' : ''}`} />
                    {ratingCounts?.dislikes || 0}
                  </Button>
                </div>
                
                {!user && (
                  <Button onClick={() => navigate('/auth')} size="sm" className="bg-orange-500 text-white hover:bg-orange-600">
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
                  <MapPin className="w-5 h-5 text-[#1a5fb4] mt-0.5 flex-shrink-0 dark:text-[#8ec5ff]" />
                  <div>
                    <p className="font-medium text-[#07111f] dark:text-white">Location</p>
                    <p className="text-sm text-[#07111f]/60 dark:text-white/60">{mic.neighborhood}, {mic.borough}</p>
                    <p className="text-sm text-[#1a5fb4] dark:text-[#8ec5ff]">{makeLinksClickable(mic.location)}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <DollarSign className="w-5 h-5 text-[#1a5fb4] mt-0.5 flex-shrink-0 dark:text-[#8ec5ff]" />
                  <div>
                    <p className="font-medium text-[#07111f] dark:text-white">Cost</p>
                    <p className="text-sm text-[#07111f]/60 dark:text-white/60">{mic.cost}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <User className="w-5 h-5 text-[#1a5fb4] mt-0.5 flex-shrink-0 dark:text-[#8ec5ff]" />
                  <div>
                    <p className="font-medium text-[#07111f] dark:text-white">Host(s)</p>
                    <p className="text-sm text-[#07111f]/60 dark:text-white/60">{mic.hosts}</p>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <div>
                  <p className="font-medium text-[#07111f] mb-2 dark:text-white">Sign-Up Instructions</p>
                  <div className="space-y-3 rounded-lg bg-[#1a5fb4]/10 p-3 text-sm text-[#07111f]/70 dark:bg-white/10 dark:text-white/70">
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
                <p className="font-medium text-[#07111f] mb-2 dark:text-white">Recent Updates</p>
                <div className="rounded-lg bg-orange-500/10 p-3 text-sm text-[#07111f]/70 dark:bg-orange-500/20 dark:text-white/70">
                  {makeLinksClickable(mic.instagramHandle)}
                </div>
              </div>
            )}

            {/* Host Claim CTA */}
            <div className="rounded-lg border border-[#1a5fb4]/20 bg-[#1a5fb4]/10 p-4 dark:border-white/10 dark:bg-white/10">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="font-medium text-[#07111f] dark:text-white">Are you the host?</p>
                  <p className="text-sm text-[#07111f]/60 dark:text-white/60">Claim this mic to manage signups and keep info updated</p>
                </div>
                <Button asChild variant="outline" size="sm" className="border-[#07111f]/10 bg-white/70 text-[#07111f] hover:bg-white dark:border-white/10 dark:bg-white/10 dark:text-white dark:hover:bg-white/20">
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
                className="w-full justify-between p-0 h-auto font-normal text-left mt-4 text-[#07111f] hover:bg-transparent dark:text-white"
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
                  className="bg-white text-[#07111f] hover:bg-gray-100 text-sm dark:bg-white/10 dark:text-white dark:hover:bg-white/20"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Google Calendar
                </Button>
                <Button 
                  onClick={generateICalFile}
                  variant="outline"
                  className="border-green-300 bg-white/70 text-green-700 hover:bg-green-50 text-sm dark:border-green-400/40 dark:bg-white/10 dark:text-green-200 dark:hover:bg-white/20"
                >
                  <Calendar className="w-4 h-4 mr-2" />
                  Download iCal
                </Button>
              </div>
            </CollapsibleContent>
          </Collapsible>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default MicDetailModal;
