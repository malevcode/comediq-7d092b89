import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, Clock, Ticket, Star, ExternalLink, Users, Share2, Check } from "lucide-react";
import { format, parseISO } from "date-fns";
import { AudienceShow } from "@/api/audienceShows";
import { RsvpButton } from "./RsvpButton";
import { TicketPurchaseButton } from "./TicketPurchaseButton";
import { toast } from "@/hooks/use-toast";

interface AudienceShowCardProps {
  show: AudienceShow;
  onClick: () => void;
}

export function AudienceShowCard({ show, onClick }: AudienceShowCardProps) {
  const [copied, setCopied] = useState(false);
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

  const handleExternalTickets = (e: React.MouseEvent) => {
    e.stopPropagation();
    const url = show.external_ticket_url || show.ticket_url;
    if (url) {
      window.open(url, '_blank', 'noopener,noreferrer');
    }
  };

  const handleShare = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const shareUrl = `${window.location.origin}/laugh?show=${show.id}`;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: show.title,
          text: `Check out ${show.title} at ${show.venue_name}!`,
          url: shareUrl,
        });
      } catch (err) {
        copyToClipboard(shareUrl);
      }
    } else {
      copyToClipboard(shareUrl);
    }
  };

  const copyToClipboard = (url: string) => {
    navigator.clipboard.writeText(url);
    setCopied(true);
    toast({
      title: "Link copied!",
      description: "Share this show with friends",
    });
    setTimeout(() => setCopied(false), 2000);
  };

  // Determine which action buttons to show
  const showPaidButton = show.is_paid && show.price_cents;
  const showRsvpButton = show.allows_rsvp;
  const hasExternalUrl = show.external_ticket_url || show.ticket_url;

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
              <div className="flex flex-col items-end gap-1 flex-shrink-0">
                {show.ticket_price && (
                  <Badge variant="outline">
                    {show.ticket_price}
                  </Badge>
                )}
                {show.rsvp_count > 0 && (
                  <Badge variant="secondary" className="text-xs">
                    <Users className="w-3 h-3 mr-1" />
                    {show.rsvp_count} RSVPs
                  </Badge>
                )}
              </div>
            </div>
            
            <div className="mt-1 flex flex-wrap gap-x-3 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                {formattedDate}
              </span>
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {formatTime(show.show_time)}
              </span>
            </div>
            
            <div className="mt-2 flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
              {showPaidButton && (
                <TicketPurchaseButton 
                  showId={show.id}
                  priceCents={show.price_cents!}
                  size="sm"
                  className="text-[10px] h-6 px-1.5"
                />
              )}
              
              {showRsvpButton && (
                <RsvpButton
                  showId={show.id}
                  showTitle={show.title}
                  capacity={show.expected_audience}
                  rsvpCount={show.rsvp_count}
                  size="sm"
                  className="text-[10px] h-6 px-1.5"
                />
              )}
              
              {hasExternalUrl && (
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={handleExternalTickets}
                  className="text-[10px] h-6 px-1.5"
                >
                  <ExternalLink className="w-2.5 h-2.5 mr-0.5" />
                  <span className="hidden sm:inline">Tix</span>
                </Button>
              )}
              
              <Button 
                size="sm" 
                onClick={(e) => {
                  e.stopPropagation();
                  toast({
                    title: "LaughPass",
                    description: "Subscribe for $40/mo — 4 free weeknight tix + half off weekends. Coming soon!",
                  });
                }}
                className="text-[10px] h-6 px-1.5 bg-foreground text-background hover:bg-foreground/90"
              >
                <Ticket className="w-2.5 h-2.5 mr-0.5" />
                <span className="hidden sm:inline">LaughPass</span>
              </Button>
              
              {/* Share button - icon only on mobile, full text on larger screens */}
              <Button 
                size="sm" 
                variant="outline"
                onClick={handleShare}
                className="text-[10px] h-6 px-1.5"
              >
                {copied ? (
                  <Check className="w-2.5 h-2.5 text-green-500" />
                ) : (
                  <Share2 className="w-2.5 h-2.5" />
                )}
                <span className="hidden sm:inline ml-0.5">Share</span>
              </Button>
              
              {!showPaidButton && !showRsvpButton && !hasExternalUrl && (
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={(e) => {
                    e.stopPropagation();
                    onClick();
                  }}
                  className="text-xs h-7 px-2"
                >
                  View Details
                </Button>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
