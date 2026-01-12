import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { 
  MapPin, 
  Calendar, 
  Clock, 
  Ticket, 
  Star, 
  Users, 
  ExternalLink,
  Instagram,
  DoorOpen
} from "lucide-react";
import { format, parseISO } from "date-fns";
import { AudienceShow } from "@/api/audienceShows";
import { makeLinksClickable } from "@/utils/makeLinksClickable";

interface AudienceShowDetailModalProps {
  show: AudienceShow | null;
  isOpen: boolean;
  onClose: () => void;
}

export function AudienceShowDetailModal({ show, isOpen, onClose }: AudienceShowDetailModalProps) {
  if (!show) return null;

  const showDate = parseISO(show.show_date);
  const formattedDate = format(showDate, 'EEEE, MMMM d, yyyy');
  
  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours, 10);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const hour12 = hour % 12 || 12;
    return `${hour12}:${minutes} ${ampm}`;
  };

  const handleGetTickets = () => {
    if (show.ticket_url) {
      window.open(show.ticket_url, '_blank', 'noopener,noreferrer');
    }
  };

  const handleOpenMaps = () => {
    if (show.venue_address) {
      const encoded = encodeURIComponent(show.venue_address);
      window.open(`https://www.google.com/maps/search/?api=1&query=${encoded}`, '_blank');
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-start gap-2">
            <DialogTitle className="text-xl">{show.title}</DialogTitle>
            {show.is_featured && (
              <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
                <Star className="w-3 h-3 mr-1" />
                Featured
              </Badge>
            )}
          </div>
        </DialogHeader>

        {/* Image */}
        {show.image_url && (
          <div className="w-full h-48 rounded-lg overflow-hidden bg-muted">
            <img 
              src={show.image_url} 
              alt={show.title}
              className="w-full h-full object-cover"
            />
          </div>
        )}

        {/* Key Details */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-foreground">
            <Calendar className="w-5 h-5 text-primary" />
            <span className="font-medium">{formattedDate}</span>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-foreground">
              <Clock className="w-5 h-5 text-primary" />
              <span>{formatTime(show.show_time)}</span>
            </div>
            {show.doors_time && (
              <div className="flex items-center gap-2 text-muted-foreground">
                <DoorOpen className="w-4 h-4" />
                <span className="text-sm">Doors {formatTime(show.doors_time)}</span>
              </div>
            )}
          </div>

          <div 
            className="flex items-start gap-2 text-foreground cursor-pointer hover:text-primary transition-colors"
            onClick={handleOpenMaps}
          >
            <MapPin className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-medium">{show.venue_name}</p>
              {show.venue_address && (
                <p className="text-sm text-muted-foreground">{show.venue_address}</p>
              )}
              {show.borough && (
                <Badge variant="outline" className="mt-1">{show.borough}</Badge>
              )}
            </div>
          </div>
        </div>

        <Separator />

        {/* Pricing and Tickets */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Ticket className="w-5 h-5 text-primary" />
            <span className="font-medium">{show.ticket_price || 'Price TBA'}</span>
          </div>
          {show.age_restriction && (
            <Badge variant="secondary">{show.age_restriction}</Badge>
          )}
        </div>

        {show.ticket_url && (
          <Button onClick={handleGetTickets} className="w-full" size="lg">
            <Ticket className="w-4 h-4 mr-2" />
            Get Tickets
            <ExternalLink className="w-4 h-4 ml-2" />
          </Button>
        )}

        <Separator />

        {/* Description */}
        {show.description && (
          <div>
            <h4 className="font-medium mb-2">About This Show</h4>
            <p className="text-sm text-muted-foreground whitespace-pre-wrap">
              {makeLinksClickable(show.description)}
            </p>
          </div>
        )}

        {/* Lineup */}
        {show.lineup && (
          <div>
            <h4 className="font-medium mb-2">Lineup</h4>
            <p className="text-sm text-muted-foreground">
              {makeLinksClickable(show.lineup)}
            </p>
          </div>
        )}

        {/* Host */}
        {show.host_name && (
          <div className="flex items-center gap-2 text-sm">
            <span className="text-muted-foreground">Hosted by:</span>
            <span className="font-medium">{show.host_name}</span>
          </div>
        )}

        {/* Instagram */}
        {show.instagram_handle && (
          <div className="flex items-center gap-2">
            <Instagram className="w-4 h-4 text-pink-500" />
            {makeLinksClickable(show.instagram_handle)}
          </div>
        )}

        {/* Expected Audience */}
        {show.expected_audience && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Users className="w-4 h-4" />
            <span>Expected audience: ~{show.expected_audience} people</span>
          </div>
        )}

        {/* Show Type */}
        {show.show_type && (
          <Badge variant="outline">{show.show_type}</Badge>
        )}
      </DialogContent>
    </Dialog>
  );
}
