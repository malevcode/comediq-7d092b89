import { useState } from "react";
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
  DoorOpen,
  MessageSquare,
  Share2,
  Check
} from "lucide-react";
import { format, parseISO } from "date-fns";
import { AudienceShow } from "@/api/audienceShows";
import { makeLinksClickable } from "@/utils/makeLinksClickable";
import { RsvpButton } from "./RsvpButton";
import { TicketPurchaseButton } from "./TicketPurchaseButton";
import { ShowReviewForm } from "./ShowReviewForm";
import { useUserReviewForShow, useSubmitReview, useUpdateReview } from "@/hooks/useShowReviews";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";

interface AudienceShowDetailModalProps {
  show: AudienceShow | null;
  isOpen: boolean;
  onClose: () => void;
}

export function AudienceShowDetailModal({ show, isOpen, onClose }: AudienceShowDetailModalProps) {
  const { user } = useAuth();
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [copied, setCopied] = useState(false);
  
  const { data: existingReview } = useUserReviewForShow(show?.id);
  const submitReview = useSubmitReview();
  const updateReview = useUpdateReview();

  if (!show) return null;

  const handleShare = async () => {
    const shareUrl = `${window.location.origin}/laugh?show=${show.id}`;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: show.title,
          text: `Check out ${show.title} at ${show.venue_name}!`,
          url: shareUrl,
        });
      } catch (err) {
        // User cancelled or error - fall back to copy
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
      description: "Share this link with friends",
    });
    setTimeout(() => setCopied(false), 2000);
  };

  const showDate = parseISO(show.show_date);
  const formattedDate = format(showDate, 'EEEE, MMMM d, yyyy');
  
  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours, 10);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const hour12 = hour % 12 || 12;
    return `${hour12}:${minutes} ${ampm}`;
  };

  const handleOpenMaps = () => {
    if (show.venue_address) {
      const encoded = encodeURIComponent(show.venue_address);
      window.open(`https://www.google.com/maps/search/?api=1&query=${encoded}`, '_blank');
    }
  };

  const handleExternalTickets = () => {
    const url = show.external_ticket_url || show.ticket_url;
    if (url) {
      window.open(url, '_blank', 'noopener,noreferrer');
    }
  };

  const handleReviewSubmit = (data: {
    rating: number;
    review_text?: string;
    favorite_comedian?: string;
    attended_date: string;
  }) => {
    if (existingReview) {
      updateReview.mutate(
        { reviewId: existingReview.id, updates: { ...data, show_id: show.id } },
        { onSuccess: () => setShowReviewForm(false) }
      );
    } else {
      submitReview.mutate(
        { ...data, show_id: show.id },
        { onSuccess: () => setShowReviewForm(false) }
      );
    }
  };

  // Determine which action buttons to show
  const showPaidButton = show.is_paid && show.price_cents;
  const showRsvpButton = show.allows_rsvp;
  const hasExternalUrl = show.external_ticket_url || show.ticket_url;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-start gap-2 flex-1">
              <DialogTitle className="text-xl">{show.title}</DialogTitle>
              {show.is_featured && (
                <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
                  <Star className="w-3 h-3 mr-1" />
                  Featured
                </Badge>
              )}
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleShare}
              className="flex-shrink-0"
            >
              {copied ? (
                <Check className="w-4 h-4 text-green-500" />
              ) : (
                <Share2 className="w-4 h-4" />
              )}
            </Button>
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
            <span className="font-medium">{show.ticket_price || 'Free'}</span>
          </div>
          <div className="flex items-center gap-2">
            {show.rsvp_count > 0 && (
              <Badge variant="secondary">
                <Users className="w-3 h-3 mr-1" />
                {show.rsvp_count} RSVPs
              </Badge>
            )}
            {show.age_restriction && (
              <Badge variant="secondary">{show.age_restriction}</Badge>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-2">
          {showPaidButton && (
            <TicketPurchaseButton 
              showId={show.id}
              priceCents={show.price_cents!}
              size="lg"
              className="w-full"
            />
          )}
          
          {showRsvpButton && (
            <RsvpButton
              showId={show.id}
              showTitle={show.title}
              capacity={show.capacity}
              rsvpCount={show.rsvp_count}
              size="lg"
              className="w-full"
            />
          )}
          
          {hasExternalUrl && (
            <Button onClick={handleExternalTickets} variant="outline" className="w-full" size="lg">
              <ExternalLink className="w-4 h-4 mr-2" />
              {show.external_ticket_url ? 'View on Eventbrite' : 'Get Tickets'}
            </Button>
          )}

          {/* Write Review Button */}
          {user && (
            <Button 
              onClick={() => setShowReviewForm(true)} 
              variant="secondary" 
              className="w-full" 
              size="lg"
            >
              <MessageSquare className="w-4 h-4 mr-2" />
              {existingReview ? 'Edit Review' : 'Write Review'}
            </Button>
          )}
        </div>

        {/* Review Form Modal */}
        <ShowReviewForm
          isOpen={showReviewForm}
          onClose={() => setShowReviewForm(false)}
          onSubmit={handleReviewSubmit}
          isSubmitting={submitReview.isPending || updateReview.isPending}
          showTitle={show.title}
          showDate={show.show_date}
          initialData={existingReview ? {
            rating: existingReview.rating,
            review_text: existingReview.review_text,
            favorite_comedian: existingReview.favorite_comedian,
            attended_date: existingReview.attended_date,
          } : undefined}
          isEditing={!!existingReview}
        />

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
