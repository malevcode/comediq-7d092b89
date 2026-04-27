import { ChevronUp, ChevronDown, MapPin, Bookmark, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { useMicRatings } from "@/hooks/useMicRatings";
import { useSavedMics } from "@/hooks/useSavedMics";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";

interface MicActionBarProps {
  micUniqueIdentifier: string;
  micName: string;
  venueAddress?: string;
  /** Deprecated — kept for back-compat with existing call sites */
  onCommentClick?: () => void;
  showCommentSection?: boolean;
  className?: string;
}

export default function MicActionBar({
  micUniqueIdentifier,
  micName,
  venueAddress,
  className,
}: MicActionBarProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const { userRating, ratingCounts, rateMic, removeRating, isRating } = useMicRatings(micUniqueIdentifier);
  const { isMicSaved, toggleSave, isToggling } = useSavedMics();

  const isUpvoted = userRating === "like";
  const isDownvoted = userRating === "dislike";
  const score = (ratingCounts.likes || 0) - (ratingCounts.dislikes || 0);
  const isSaved = isMicSaved(micUniqueIdentifier);

  const requireAuth = (msg: string) => {
    if (!user) {
      toast({ title: "Sign in required", description: msg });
      navigate("/auth");
      return false;
    }
    return true;
  };

  const handleVote = (vote: "like" | "dislike") => {
    if (!requireAuth(`Please sign in to vote`)) return;
    if (userRating === vote) {
      removeRating(micUniqueIdentifier);
    } else {
      rateMic({ micUniqueIdentifier, rating: vote });
    }
  };

  const handleMap = (e: React.MouseEvent) => {
    e.stopPropagation();
    const query = encodeURIComponent(venueAddress || micName);
    window.open(`https://www.google.com/maps/search/?api=1&query=${query}`, "_blank", "noopener");
  };

  const handleSave = async () => {
    if (!requireAuth("Please sign in to save mics")) return;
    try {
      const result = await toggleSave(micUniqueIdentifier);
      toast({
        title: result.saved ? "Saved!" : "Removed",
        description: result.saved ? `${micName} added to your saved mics` : `${micName} removed from saved mics`,
      });
    } catch {
      toast({ title: "Error", description: "Failed to save mic", variant: "destructive" });
    }
  };

  const handleShare = async () => {
    const url = `https://comediq.us/mics/${encodeURIComponent(micName.toLowerCase().replace(/\s+/g, "-"))}`;
    if (navigator.share) {
      try {
        await navigator.share({ title: micName, text: `Check out ${micName} on Comediq!`, url });
        return;
      } catch {
        /* fall through to clipboard */
      }
    }
    try {
      await navigator.clipboard.writeText(`Check out ${micName} on Comediq! ${url}`);
      toast({ title: "Link copied!", description: "Share link copied to clipboard" });
    } catch {
      toast({ title: "Error", description: "Failed to copy link", variant: "destructive" });
    }
  };

  return (
    <div className={cn("flex items-center justify-between border-t border-border pt-1.5 mt-1", className)}>
      {/* Vote pill (Reddit-style) */}
      <div
        className={cn(
          "inline-flex items-center gap-0.5 rounded-full px-1 py-0.5 transition-colors",
          isUpvoted && "bg-[hsl(var(--primary))]/10",
          isDownvoted && "bg-red-500/10",
          !isUpvoted && !isDownvoted && "bg-muted"
        )}
      >
        <button
          type="button"
          onClick={() => handleVote("like")}
          disabled={isRating}
          aria-label="Upvote"
          className={cn(
            "p-1 rounded-full hover:bg-[hsl(var(--primary))]/15 transition-colors",
            isUpvoted ? "text-[hsl(var(--primary))]" : "text-muted-foreground"
          )}
        >
          <ChevronUp className={cn("w-4 h-4", isUpvoted && "fill-[hsl(var(--primary))]")} strokeWidth={2.5} />
        </button>
        <span
          className={cn(
            "text-xs font-bold min-w-[1.25rem] text-center tabular-nums",
            isUpvoted && "text-[hsl(var(--primary))]",
            isDownvoted && "text-red-500",
            !isUpvoted && !isDownvoted && "text-foreground"
          )}
        >
          {score}
        </span>
        <button
          type="button"
          onClick={() => handleVote("dislike")}
          disabled={isRating}
          aria-label="Downvote"
          className={cn(
            "p-1 rounded-full hover:bg-red-500/15 transition-colors",
            isDownvoted ? "text-red-500" : "text-muted-foreground"
          )}
        >
          <ChevronDown className={cn("w-4 h-4", isDownvoted && "fill-red-500")} strokeWidth={2.5} />
        </button>
      </div>

      {/* Utility buttons */}
      <div className="flex items-center gap-1">
        <Button variant="ghost" size="sm" onClick={handleMap} aria-label="Open in Google Maps"
          className="px-2 py-1 h-auto text-muted-foreground hover:text-foreground">
          <MapPin className="w-4 h-4" />
        </Button>
        <Button variant="ghost" size="sm" onClick={handleSave} disabled={isToggling} aria-label="Save mic"
          className={cn("px-2 py-1 h-auto", isSaved ? "text-[hsl(var(--primary))]" : "text-muted-foreground hover:text-foreground")}>
          <Bookmark className={cn("w-4 h-4", isSaved && "fill-[hsl(var(--primary))]")} />
        </Button>
        <Button variant="ghost" size="sm" onClick={handleShare} aria-label="Share mic"
          className="px-2 py-1 h-auto text-muted-foreground hover:text-foreground">
          <Send className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}
