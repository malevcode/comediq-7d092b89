import { Link } from "react-router-dom";
import { format, parseISO } from "date-fns";
import { Calendar, ExternalLink, MapPin, Ticket } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AudienceShow } from "@/api/audienceShows";

interface DiscoveryShowCardProps {
  show: AudienceShow;
}

function formatShowTime(time: string): string {
  const [hours, minutes] = time.split(":");
  const hour = parseInt(hours, 10);
  const ampm = hour >= 12 ? "PM" : "AM";
  const hour12 = hour % 12 || 12;
  return `${hour12}:${minutes} ${ampm}`;
}

function getMapUrl(address: string | null, venueName: string) {
  const searchQuery = encodeURIComponent(address ? `${venueName}, ${address}` : venueName);
  return `https://www.google.com/maps/search/?api=1&query=${searchQuery}`;
}

export function DiscoveryShowCard({ show }: DiscoveryShowCardProps) {
  const showDate = parseISO(show.show_date);
  const ticketUrl = show.external_ticket_url || show.ticket_url;

  return (
    <div className="rounded-2xl border-2 border-comediq-blue/20 bg-card shadow-sm hover:shadow-md transition-shadow overflow-hidden">
      <div className="h-32 bg-comediq-cream overflow-hidden">
        {show.image_url ? (
          <img src={show.image_url} alt="" className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Ticket className="w-10 h-10 text-comediq-blue/40" />
          </div>
        )}
      </div>

      <div className="p-3.5">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-semibold text-base text-foreground leading-tight">{show.title}</h3>
          {show.is_featured && (
            <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 text-xs flex-shrink-0">
              Featured
            </Badge>
          )}
        </div>

        <p className="mt-0.5 text-sm text-muted-foreground truncate">{show.venue_name}</p>

        <div className="mt-2 flex flex-wrap items-center gap-2 text-xs font-mono text-comediq-blue">
          <span className="inline-flex items-center gap-1 rounded-full bg-comediq-blue/10 px-2 py-0.5">
            <Calendar className="w-3 h-3" />
            {format(showDate, "EEE, MMM d")} &middot; {formatShowTime(show.show_time)}
          </span>
          {show.ticket_price && (
            <span className="inline-flex items-center rounded-full bg-comediq-blue/10 px-2 py-0.5">
              {show.ticket_price}
            </span>
          )}
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-1.5">
          <Button size="sm" variant="outline" className="h-7 px-2 gap-1 text-xs" asChild>
            <a href={getMapUrl(show.venue_address, show.venue_name)} target="_blank" rel="noopener noreferrer">
              <MapPin className="w-3.5 h-3.5" />
              Location
            </a>
          </Button>
          {ticketUrl ? (
            <Button size="sm" className="h-7 px-2 gap-1 text-xs bg-comediq-blue hover:bg-comediq-blue-dark" asChild>
              <a href={ticketUrl} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="w-3.5 h-3.5" />
                Tickets
              </a>
            </Button>
          ) : (
            <Button size="sm" variant="outline" className="h-7 px-2 text-xs" asChild>
              <Link to={`/laugh?show=${show.id}`}>Details</Link>
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
