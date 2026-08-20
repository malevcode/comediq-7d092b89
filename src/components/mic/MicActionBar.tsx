import { ChevronUp, ChevronDown, MapPin, Send, ExternalLink, Check, Flag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { useMicRatings } from "@/hooks/useMicRatings";
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
  // Legacy props (kept for backward compatibility, no-op)
  onCommentClick?: () => void;
  showCommentSection?: boolean;
  className?: string;
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

export default function MicActionBar({
  micUniqueIdentifier,
  micName,
  lastConfirmedAt,
  signUpInstructions,
  venueAddress,
  className,
}: MicActionBarProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [reportDialogOpen, setReportDialogOpen] = useState(false);

  const { userRating, ratingCounts, rateMic, removeRating, isRating } = useMicRatings(micUniqueIdentifier);
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
  const score = (ratingCounts.likes || 0) - (ratingCounts.dislikes || 0);

  const signUpUrl = extractFirstUrl(signUpInstructions);

  const requireAuth = (action: string): boolean => {
    if (!user) {
      toast({ title: "Sign in required", description: `Please sign in to ${action}` });
      navigate("/auth");
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
    const url = `https://comediq.us/mics/${encodeURIComponent(micName.toLowerCase().replace(/\s+/g, "-"))}`;
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

  // Comediq Blue / muted red / neutral — using arbitrary HSL values matching brand tokens
  const upvoteColor = isUpvoted ? "text-[#1a5fb4]" : "text-gray-600 dark:text-muted-foreground";
  const downvoteColor = isDownvoted ? "text-red-500 dark:text-red-400" : "text-gray-600 dark:text-muted-foreground";
  const scoreColor = isUpvoted
    ? "text-[#1a5fb4]"
    : isDownvoted
      ? "text-red-500 dark:text-red-400"
      : "text-gray-800 dark:text-foreground";

  return (
    <>
    <div className={cn("flex items-center justify-between border-t border-white/10 pt-1.5 mt-1 text-gray-700 dark:text-white/70", className)}>
      {/* Left: Reddit-style vote pill */}
      <div
        className={cn(
          "flex items-center gap-0.5 rounded-full bg-white/60 px-1 py-0.5 dark:bg-muted/40",
          (isUpvoted || isDownvoted) && "bg-white/80 dark:bg-muted"
        )}
      >
        <button
          type="button"
          onClick={() => handleVote("like")}
          disabled={isRating}
          aria-label="Upvote"
          className={cn(
            "p-1 rounded-full hover:bg-background transition-colors disabled:opacity-50 dark:hover:bg-background/40",
            upvoteColor
          )}
        >
          <ChevronUp className={cn("w-4 h-4", isUpvoted && "fill-current")} strokeWidth={2.5} />
        </button>
        <span className={cn("text-xs font-semibold min-w-[1ch] text-center px-0.5", scoreColor)}>
          {score}
        </span>
        <button
          type="button"
          onClick={() => handleVote("dislike")}
          disabled={isRating}
          aria-label="Downvote"
          className={cn(
            "p-1 rounded-full hover:bg-background transition-colors disabled:opacity-50 dark:hover:bg-background/40",
            downvoteColor
          )}
        >
          <ChevronDown className={cn("w-4 h-4", isDownvoted && "fill-current")} strokeWidth={2.5} />
        </button>
      </div>

      {/* Right: utility buttons */}
      <div className="flex items-center gap-0.5">
        {signUpUrl && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleSignUp}
            className="h-8 px-2 gap-1 text-xs font-medium text-gray-700 hover:bg-[#1a5fb4]/10 dark:text-white dark:hover:bg-[hsl(var(--primary))]/20 dark:hover:text-white"
            aria-label="Sign up online"
          >
            <ExternalLink className="w-3.5 h-3.5 text-gray-600 dark:text-white" />
            Sign Up
          </Button>
        )}
        <Button
          variant="ghost"
          size="sm"
          onClick={handleMap}
          className="h-8 w-8 p-0 text-gray-700 hover:bg-[#1a5fb4]/10 dark:text-white dark:hover:bg-[hsl(var(--primary))]/20 dark:hover:text-white"
          aria-label="Open in Google Maps"
        >
          <MapPin className="w-4 h-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={openConfirmDialog}
          disabled={confirmedThisMonth || isConfirming}
          className={cn(
            "h-8 px-2 gap-1 text-xs font-medium text-gray-700 hover:bg-green-500/10 disabled:opacity-70 dark:text-white dark:hover:bg-green-500/20",
            confirmedThisMonth && "text-green-700 dark:text-green-300"
          )}
          aria-label={confirmedThisMonth ? "Confirmed this month" : "Confirm mic is active"}
        >
          <Check className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">{confirmedThisMonth ? "Confirmed" : "Confirm"}</span>
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={openReportDialog}
          disabled={alreadyReportedThisMonth || isReporting}
          className={cn(
            "h-8 px-2 gap-1 text-xs font-medium text-gray-700 hover:bg-red-500/10 disabled:opacity-70 dark:text-white dark:hover:bg-red-500/20",
            alreadyReportedThisMonth && "text-red-600 dark:text-red-300"
          )}
          aria-label={alreadyReportedThisMonth ? "Reported this month" : "Report mic as inactive"}
        >
          <Flag className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">{alreadyReportedThisMonth ? "Reported" : "Report"}</span>
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleShare}
          className="h-8 w-8 p-0 text-gray-700 hover:bg-[#1a5fb4]/10  dark:text-white dark:hover:bg-[hsl(var(--primary))]/20 dark:hover:text-white"
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
