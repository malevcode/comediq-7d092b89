
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { X, Calendar, Clock, MapPin, User, DollarSign, Timer, Plus, Share, Heart, ThumbsDown, LogIn } from "lucide-react";
import { OpenMic } from "@/types/openMic";
import { useAuth } from "@/contexts/AuthContext";
import { useMicRatings, useUserLikedMics } from "@/hooks/useMicRatings";
import { useNavigate } from "react-router-dom";

interface MicDetailModalProps {
  mic: OpenMic;
  onClose: () => void;
  onAddToSchedule?: (micData: any) => void;
}

const MicDetailModal = ({ mic, onClose, onAddToSchedule }: MicDetailModalProps) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { userRating, ratingCounts, rateMic, removeRating, isRating } = useMicRatings(mic.uniqueIdentifier);

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

  const makeLinksClickable = (text: string) => {
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    const parts = text.split(urlRegex);
    
    return parts.map((part, index) => {
      if (urlRegex.test(part)) {
        return (
          <a
            key={index}
            href={part}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 hover:text-blue-800 underline"
          >
            {part}
          </a>
        );
      }
      return part;
    });
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

  const handleAddToSchedule = () => {
    if (!user) {
      navigate('/auth');
      return;
    }

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

    if (onAddToSchedule) {
      onAddToSchedule(showData);
    }
  };

  const getStatusBadgeColor = () => {
    if (mic.lastVerified.toLowerCase().includes("verified")) {
      return "bg-green-100 text-green-800 border-green-200";
    } else if (mic.lastVerified.toLowerCase().includes("tediously")) {
      return "bg-yellow-100 text-yellow-800 border-yellow-200";
    } else {
      return "bg-red-100 text-red-800 border-red-200";
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 rounded-t-2xl">
          <div className="flex justify-between items-start">
            <div className="flex-1 min-w-0">
              <h2 className="text-2xl font-bold text-gray-900 mb-1">{mic.openMic}</h2>
              <p className="text-gray-600">{mic.venueName}</p>
              <div className="flex items-center gap-2 mt-2">
                <Badge className={`${getStatusBadgeColor()} text-xs`}>
                  {mic.lastVerified}
                </Badge>
              </div>
            </div>
            <Button onClick={onClose} variant="ghost" size="sm" className="rounded-full">
              <X className="w-5 h-5" />
            </Button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Date and Time Info - Condensed to single line */}
          <Card className="mb-6 bg-gradient-to-r from-orange-50 to-red-50 border-orange-200">
            <CardContent className="p-4">
              <div className="text-center">
                <div className="text-lg font-semibold text-gray-900">
                  {mic.day} • {mic.startTime} • {mic.stageTime} stage time
                </div>
                <div className="text-sm text-gray-600 mt-1">Every week</div>
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <div className="mb-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Button 
                onClick={() => window.open(getGoogleCalendarUrl(), '_blank')}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add to Google Calendar
              </Button>
              <Button 
                onClick={generateICalFile}
                variant="outline"
                className="border-green-300 hover:bg-green-50"
              >
                <Calendar className="w-4 h-4 mr-2" />
                Download iCal
              </Button>
            </div>
            
            {user && (
              <Button 
                onClick={handleAddToSchedule}
                className="w-full mt-3 bg-orange-600 hover:bg-orange-700 text-white"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add to My Schedule
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
                  <div className="text-sm text-gray-600 bg-blue-50 p-3 rounded-lg">
                    {makeLinksClickable(mic.signUpInstructions)}
                  </div>
                </div>
              </div>
            </div>

            {mic.otherRules && (
              <div>
                <p className="font-medium text-gray-900 mb-2">Rules & Notes</p>
                <div className="text-sm text-gray-600 bg-yellow-50 p-3 rounded-lg">
                  {makeLinksClickable(mic.otherRules)}
                </div>
              </div>
            )}

            {mic.changesUpdates && (
              <div>
                <p className="font-medium text-gray-900 mb-2">Recent Updates</p>
                <div className="text-sm text-gray-600 bg-orange-50 p-3 rounded-lg">
                  {makeLinksClickable(mic.changesUpdates)}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MicDetailModal;
