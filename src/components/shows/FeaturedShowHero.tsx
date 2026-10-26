import { format, parseISO } from "date-fns";
import { Ticket, Share2 } from "lucide-react";
import { AudienceShow } from "@/api/audienceShows";
import { RsvpButton } from "./RsvpButton";
import { TicketPurchaseButton } from "./TicketPurchaseButton";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { formatShowTime } from "@/utils/formatShowTime";

interface FeaturedShowHeroProps {
  show: AudienceShow;
  onClick: () => void;
}

/**
 * The big "next show" card at the top of Laugh, matching
 * LaughMobile.dc.html. Everything below this is the month-grouped list.
 */
export function FeaturedShowHero({ show, onClick }: FeaturedShowHeroProps) {
  const showDate = parseISO(show.show_date);
  const formattedDate = format(showDate, "EEE, MMM d");
  const showPaidButton = show.is_paid && show.price_cents;
  const showRsvpButton = show.allows_rsvp;
  const hasExternalUrl = show.external_ticket_url || show.ticket_url;

  const handleExternalTickets = (e: React.MouseEvent) => {
    e.stopPropagation();
    const url = show.external_ticket_url || show.ticket_url;
    if (url) window.open(url, "_blank", "noopener,noreferrer");
  };

  const handleShare = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const shareUrl = `${window.location.origin}/laugh?show=${show.id}`;
    if (navigator.share) {
      try {
        await navigator.share({ title: show.title, text: `Check out ${show.title} at ${show.venue_name}!`, url: shareUrl });
        return;
      } catch {
        // fall through to clipboard
      }
    }
    navigator.clipboard.writeText(shareUrl);
    toast({ title: "Link copied!", description: "Share this show with friends" });
  };

  return (
    <div className="-mx-4 overflow-hidden rounded-none sm:mx-0 sm:rounded-2xl">
      <button type="button" onClick={onClick} className="block w-full text-left">
        <div className="h-[230px] w-full bg-[#173A7A]">
          {show.image_url && (
            <img src={show.image_url} alt={show.title} className="h-full w-full object-cover" />
          )}
        </div>
      </button>
      <div className="flex flex-col gap-2.5 px-4 pt-3 sm:px-0">
        <span className="text-xs font-semibold uppercase tracking-[0.14em] text-comediq-accent">
          Next up &middot; {formattedDate}
        </span>
        <button type="button" onClick={onClick} className="text-left">
          <h2 className="font-display text-3xl uppercase leading-[0.95] text-comediq-cream sm:text-4xl">
            {show.title}
          </h2>
        </button>
        <div className="flex flex-wrap gap-x-2.5 gap-y-1 text-[15px] text-[#E2E8F5]">
          <span>{show.venue_name}</span>
          <span aria-hidden="true">&middot;</span>
          <span>{formattedDate}</span>
          <span aria-hidden="true">&middot;</span>
          <span>{formatShowTime(show.show_time)}</span>
        </div>
        <div className="mt-1.5 flex flex-wrap items-center gap-2">
          {showPaidButton && (
            <TicketPurchaseButton showId={show.id} priceCents={show.price_cents!} className="h-11 rounded-full px-5" />
          )}
          {showRsvpButton && (
            <RsvpButton
              showId={show.id}
              showTitle={show.title}
              capacity={show.expected_audience}
              rsvpCount={show.rsvp_count}
              className="h-11 rounded-full bg-comediq-accent px-6 text-[#0A1128] hover:bg-comediq-accent/90"
            />
          )}
          {hasExternalUrl && (
            <Button size="sm" variant="outline" onClick={handleExternalTickets} className="h-11 gap-1.5 rounded-full border-white/40 px-5 text-comediq-cream">
              <Ticket className="h-4 w-4" />
              Tix
            </Button>
          )}
          <Button
            size="sm"
            variant="outline"
            onClick={(e) => {
              e.stopPropagation();
              toast({
                title: "LaughPass",
                description: "Subscribe for $20/month and get 2 comedy show tickets every month. Coming soon!",
              });
            }}
            className="h-11 rounded-full border-white/40 px-5 text-comediq-cream"
          >
            LaughPass
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={handleShare}
            aria-label="Share"
            className="h-11 w-11 rounded-full border-white/40 p-0 text-comediq-cream"
          >
            <Share2 className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
