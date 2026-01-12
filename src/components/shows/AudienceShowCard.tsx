import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MapPin, Calendar, Clock, Ticket, Star, ExternalLink } from "lucide-react";
import { format, parseISO } from "date-fns";
import { AudienceShow } from "@/api/audienceShows";

interface AudienceShowCardProps {
  show: AudienceShow;
  onClick: () => void;
}

export function AudienceShowCard({ show, onClick }: AudienceShowCardProps) {
  const showDate = parseISO(show.show_date);
  const formattedDate = format(showDate, 'EEE, MMM d');
  
  // Format time from 24h to 12h
  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours, 10);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const hour12 = hour % 12 || 12;
    return `${hour12}:${minutes} ${ampm}`;
  };

  const handleGetTickets = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (show.ticket_url) {
      window.open(show.ticket_url, '_blank', 'noopener,noreferrer');
    }
  };

  return (
    <Card 
      className="cursor-pointer hover:shadow-md transition-shadow border-border bg-card"
      onClick={onClick}
    >
      <CardContent className="p-4">
        <div className="flex gap-4">
          {/* Image placeholder or actual image */}
          <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-lg bg-muted flex-shrink-0 overflow-hidden">
            {show.image_url ? (
              <img 
                src={show.image_url} 
                alt={show.title}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                <Ticket className="w-8 h-8" />
              </div>
            )}
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="font-semibold text-foreground truncate">{show.title}</h3>
                  {show.is_featured && (
                    <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 text-xs">
                      <Star className="w-3 h-3 mr-1" />
                      Featured
                    </Badge>
                  )}
                </div>
                <p className="text-sm text-muted-foreground truncate">{show.venue_name}</p>
              </div>
              {show.ticket_price && (
                <Badge variant="outline" className="flex-shrink-0">
                  {show.ticket_price}
                </Badge>
              )}
            </div>
            
            <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
              <span className="flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5" />
                {formattedDate}
              </span>
              <span className="flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" />
                {formatTime(show.show_time)}
              </span>
              {show.borough && (
                <span className="flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5" />
                  {show.borough}
                </span>
              )}
            </div>
            
            {show.lineup && (
              <p className="mt-2 text-sm text-muted-foreground line-clamp-1">
                {show.lineup}
              </p>
            )}
            
            <div className="mt-3 flex gap-2">
              {show.ticket_url && (
                <Button 
                  size="sm" 
                  onClick={handleGetTickets}
                  className="bg-primary hover:bg-primary/90"
                >
                  <Ticket className="w-4 h-4 mr-1" />
                  Get Tickets
                </Button>
              )}
              <Button 
                size="sm" 
                variant="outline"
                onClick={(e) => {
                  e.stopPropagation();
                  onClick();
                }}
              >
                View Details
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
