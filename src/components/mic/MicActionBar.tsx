import { slugify } from "@/lib/seoShared";
import { ThumbsUp, ThumbsDown, MapPin, Send, ExternalLink, Check, Flag, Instagram } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { useMicRatings, type SharedMicRatingData } from "@/hooks/useMicRatings";
import { useMicConfirmReport } from "@/hooks/useMicConfirmReport";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useState } from "react";

interface MicActionBarProps {
  micUniqueIdentifier: string;
  micName: string;
  lastConfirmedAt?: string | null;
  signUpInstructions?: string;
  venueAddress?: string;
  /** Freeform host Instagram text (a handle, a URL, or both). */
  hostInstagram?: string;
  // Legacy props (kept for backward compatibility, no-op)
  onCommentClick?: () => void;
  showCommentSection?: boolean;
  className?: string;
  /**
   * Vote totals and the user's own votes, fetched once by the surrounding list.
   * Supplying this stops every row from fetching its own counts, which is the
   * difference between one request per page and one per visible mic.
   */
  sharedRatings?: SharedMicRatingData;
}

// Extracts the first URL-like string from text. Supports:
// - Full URLs: https://example.com, http://example.com
// - www-prefixed: www.example.com
// - Bare domains/paths: slotted.co/foo, example.com, sub.example.io/path
// Returns a normalized https:// URL, or null if nothing valid is found.
const extractFirstUrl = (text?: string): string | null => {
  if (!text) return null;
  const trimmed = text.trim();
  if (!trimmed) return null;

  const urlRegex =
    /(https?:\/\/[^\s)]+)|(www\.[^\s)]+)|(\b[a-z0-9][-a-z0-9]*(?:\.[a-z0-9][-a-z0-9]*)+(?:\/[^\s)]*)?)/i;
  const match = trimmed.match(urlRegex);
  if (!match) return null;

  let url = match[0].replace(/[.,;:!?)]+$/, ""); // strip trailing punctuation
  if (!/^https?:\/\//i.test(url)) {
    url = `https://${url}`;
  }

  // Sanity-check it parses as a URL with a dotted hostname
  try {
    const parsed = new URL(url);
    if (!parsed.hostname.includes(".")) return null;
    return parsed.toString();
  } catch {
    return null;
  }
};

// Builds a usable Instagram URL from freeform host text: a full URL, a bare
// "@handle", or a bare "handle".
const getInstagramUrl = (text?: string): string | null => {
  if (!text) return null;
  const trimmed = text.trim();
  if (!trimmed) return null;
  const asUrl = extractFirstUrl(trimmed);
  if (asUrl && asUrl.includes("instagram.com")) return asUrl;
  const handle = trimmed.replace(/^@/, "").split(/\s+/)[0];
  if (!handle || /[^a-zA-Z0-9._]/.test(handle)) return null;
  return `https://instagram.com/${handle}`;
};

export default function MicActionBar({
  micUniqueIdentifier,
  micName,
  lastConfirmedAt,
  signUpInstructions,
  venueAddress,
  hostInstagram,
  className,
  sharedRatings,
}: MicActionBarProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [reportDialogOpen, setReportDialogOpen] = useState(false);

  const { userRating, ratingCounts, rateMic, removeRating, isRating } = useMicRatings(micUniqueIdentifier, sharedRatings);
  const {
    confirmedThisMonth,
    alreadyReportedThisMonth,
    confirmMic,
    reportMic,
    isConfirming,
    isReporting,
  } = useMicConfirmReport(micUniqueIdentifier, lastConfirmedAt);

  const isUpvoted = userRating === "like";
  const isDownvoted = userRating === "dislike";
  const signUpUrl = extractFirstUrl(signUpInstructions);
  const instagramUrl = getInstagramUrl(hostInstagram);

  const requireAuth = (action: string): boolean => {
    if (!user) {
      toast({ title: "Sign in required", description: `Please sign in to ${action}` });
      // Carry where they were, so signing in puts them back on the mic they
      // were voting for instead of dropping them on the mic list.
      const here = `${window.location.pathname}${window.location.search}`;
      navigate(`/auth?next=${encodeURIComponent(here)}`);
      return false;
    }
    return true;
  };

  const handleVote = (vote: "like" | "dislike") => {
    if (!requireAuth("vote")) return;
    if (userRating === vote) {
      removeRating(micUniqueIdentifier);
    } else {
      rateMic({ micUniqueIdentifier, rating: vote });
    }
  };

  const handleMap = () => {
    const query = encodeURIComponent(venueAddress || micName);
    window.open(`https://www.google.com/maps/search/?api=1&query=${query}`, "_blank", "noopener,noreferrer");
  };

  const handleSignUp = () => {
    if (!signUpUrl) return;
    window.open(signUpUrl, "_blank", "noopener,noreferrer");
  };

  const handleShare = async () => {
    const url = `https://comediq.us/mic/${slugify(micName)}`;
    if (navigator.share) {
      try {
        await navigator.share({ title: micName, text: `Check out ${micName} on Comediq!`, url });
        return;
      } catch {
        // fall through to clipboard
      }
    }
    try {
      await navigator.clipboard.writeText(`Check out ${micName} on Comediq! ${url}`);
      toast({ title: "Link copied!", description: "Share link copied to clipboard" });
    } catch {
      toast({ title: "Error", description: "Failed to copy link", variant: "destructive" });
    }
  };

  const openConfirmDialog = () => {
    if (!requireAuth("confirm mics")) return;
    if (confirmedThisMonth) return;
    setConfirmDialogOpen(true);
  };

  const openReportDialog = () => {
    if (!requireAuth("report mics")) return;
    if (alreadyReportedThisMonth) return;
    setReportDialogOpen(true);
  };

  const handleConfirmMic = async () => {
    try {
      const result = await confirmMic();
      if (result.status === "already_confirmed") {
        toast({
          title: "Already confirmed",
          description: "Already confirmed by someone else this month, thanks anyway!",
        });
      } else {
        toast({
          title: "Confirmed",
          description: `Thanks for keeping ${micName} current. You earned 1 point.`,
        });
      }
      setConfirmDialogOpen(false);
    } catch (error: any) {
      console.error("Could not confirm mic:", error);
      toast({
        title: "Error",
        description: error?.message || "Could not confirm this mic.",
        variant: "destructive",
      });
    }
  };

  const handleReportMic = async () => {
    try {
      const result = await reportMic();
      if (result.status === "already_reported") {
        toast({
          title: "Already reported",
          description: "You already reported this mic this month.",
        });
      } else if (result.status === "deactivated") {
        toast({
          title: "Mic deactivated",
          description: `${micName} received ${result.flag_count} reports this month and was removed from active listings.`,
        });
      } else {
        toast({
          title: "Report received",
          description: `Thanks. ${result.flag_count} of ${result.threshold} reports logged this month. Points are awarded when the mic is deactivated.`,
        });
      }
      setReportDialogOpen(false);
    } catch (error: any) {
      console.error("Could not report mic:", error);
      toast({
        title: "Error",
        description: error?.message || "Could not report this mic.",
        variant: "destructive",
      });
    }
  };

  const quietIconClass =
    "h-8 w-8 p-0 text-[#D2DCF0] hover:bg-white/10 hover:text-comediq-cream";

  return (
    <>
    <div className={cn("grid grid-cols-[auto_1fr_auto] items-center gap-1 border-t border-white/10 pt-1.5 mt-1 text-[#D2DCF0]", className)}>
      {/* Left: like and dislike, each its own count, hidden when zero. */}
      <div className="flex items-center">
        <button
          type="button"
          onClick={() => handleVote("like")}
          disabled={isRating}
          aria-label={ratingCounts.likes ? `Like, ${ratingCounts.likes}` : "Like"}
          className={cn(
            "flex items-center gap-1 rounded-full px-1.5 py-1 transition-colors hover:bg-white/10 disabled:opacity-50",
            isUpvoted ? "text-comediq-cream" : "text-[#D2DCF0]",
          )}
        >
          <ThumbsUp className={cn("h-4 w-4", isUpvoted && "fill-current")} strokeWidth={2} />
          {ratingCounts.likes > 0 && <span className="text-xs font-semibold">{ratingCounts.likes}</span>}
        </button>
        <button
          type="button"
          onClick={() => handleVote("dislike")}
          disabled={isRating}
          aria-label={ratingCounts.dislikes ? `Dislike, ${ratingCounts.dislikes}` : "Dislike"}
          className={cn(
            "flex items-center gap-1 rounded-full px-1.5 py-1 transition-colors hover:bg-white/10 disabled:opacity-50",
            isDownvoted ? "text-comediq-cream" : "text-[#D2DCF0]",
          )}
        >
          <ThumbsDown className={cn("h-4 w-4", isDownvoted && "fill-current")} strokeWidth={2} />
          {ratingCounts.dislikes > 0 && <span className="text-xs font-semibold">{ratingCounts.dislikes}</span>}
        </button>
      </div>

      {/* Middle: Register, only when the mic has a signup link. Kept out of
          the icon row so those icons sit in the same spot on every card. */}
      <div className="flex justify-center">
        {signUpUrl && (
          <Button
            size="sm"
            onClick={handleSignUp}
            className="h-8 gap-1.5 rounded-full bg-comediq-accent px-3.5 text-xs font-semibold text-[#0A1128] hover:bg-comediq-accent/90"
            aria-label="Register for this mic"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            Register
          </Button>
        )}
      </div>

      {/* Right: fixed icon row. A blank slot stands in for a missing
          Instagram so the other icons never shift. */}
      <div className="flex items-center gap-0.5">
        {instagramUrl ? (
          <Button
            variant="ghost"
            size="sm"
            asChild
            className={quietIconClass}
          >
            <a href={instagramUrl} target="_blank" rel="noopener noreferrer" aria-label="Host Instagram">
              <Instagram className="w-4 h-4" />
            </a>
          </Button>
        ) : (
          <span className="h-8 w-8" aria-hidden="true" />
        )}
        <Button
          variant="ghost"
          size="sm"
          onClick={handleMap}
          className={quietIconClass}
          aria-label="Directions"
        >
          <MapPin className="w-4 h-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={openConfirmDialog}
          disabled={confirmedThisMonth || isConfirming}
          className={cn(quietIconClass, "disabled:opacity-70", confirmedThisMonth && "text-green-300")}
          aria-label={confirmedThisMonth ? "Confirmed this month" : "Confirm mic is active"}
        >
          <Check className="w-4 h-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={openReportDialog}
          disabled={alreadyReportedThisMonth || isReporting}
          className={cn(quietIconClass, "disabled:opacity-70", alreadyReportedThisMonth && "text-red-300")}
          aria-label={alreadyReportedThisMonth ? "Reported this month" : "Report mic as inactive"}
        >
          <Flag className="w-4 h-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleShare}
          className={quietIconClass}
          aria-label="Share mic"
        >
          <Send className="w-4 h-4" />
        </Button>
      </div>
    </div>
    <Dialog open={confirmDialogOpen} onOpenChange={setConfirmDialogOpen}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Confirm this mic?</DialogTitle>
          <DialogDescription>
            Confirm {micName} is still running this month?
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => setConfirmDialogOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleConfirmMic} disabled={isConfirming}>
            Yes, confirm
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
    <Dialog open={reportDialogOpen} onOpenChange={setReportDialogOpen}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Report inactive mic?</DialogTitle>
          <DialogDescription>
            Flag {micName} as inactive? Two reports in a month will remove it from active listings.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => setReportDialogOpen(false)}>
            Cancel
          </Button>
          <Button variant="destructive" onClick={handleReportMic} disabled={isReporting}>
            Yes, report
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
    </>
  );
}
