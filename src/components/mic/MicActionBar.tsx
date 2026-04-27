import { ChevronUp, ChevronDown, MapPin, Bookmark, Send, ExternalLink } from "lucide-react";
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
  signUpInstructions?: string;
  venueAddress?: string;
  // Legacy props (kept for backward compatibility, no-op)
  onCommentClick?: () => void;
  showCommentSection?: boolean;
  className?: string;
}

// Extracts the first http(s):// URL from a string
const extractFirstUrl = (text?: string): string | null => {
  if (!text) return null;
  const match = text.match(/https?:\/\/[^\s)]+/i);
  return match ? match[0] : null;
};

export default function MicActionBar({
  micUniqueIdentifier,
  micName,
  signUpInstructions,
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

  const handleSave = async () => {
    if (!requireAuth("save mics")) return;
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

  // Comediq Blue / muted red / neutral — using arbitrary HSL values matching brand tokens
  const upvoteColor = isUpvoted ? "text-[hsl(var(--primary))]" : "text-muted-foreground";
  const downvoteColor = isDownvoted ? "text-red-400" : "text-muted-foreground";
  const scoreColor = isUpvoted
    ? "text-[hsl(var(--primary))]"
    : isDownvoted
      ? "text-red-400"
      : "text-foreground";

  return (
    <div className={cn("flex items-center justify-between border-t border-border pt-1.5 mt-1", className)}>
      {/* Left: Reddit-style vote pill */}
      <div
        className={cn(
          "flex items-center gap-0.5 rounded-full bg-muted/60 px-1 py-0.5",
          (isUpvoted || isDownvoted) && "bg-muted"
        )}
      >
        <button
          type="button"
          onClick={() => handleVote("like")}
          disabled={isRating}
          aria-label="Upvote"
          className={cn(
            "p-1 rounded-full hover:bg-background/80 transition-colors disabled:opacity-50",
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
            "p-1 rounded-full hover:bg-background/80 transition-colors disabled:opacity-50",
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
            className="h-8 px-2 gap-1 text-xs font-medium text-[hsl(var(--primary))] hover:bg-[hsl(var(--primary))]/10"
            aria-label="Sign up online"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            Sign Up
          </Button>
        )}
        <Button
          variant="ghost"
          size="sm"
          onClick={handleMap}
          className="h-8 w-8 p-0"
          aria-label="Open in Google Maps"
        >
          <MapPin className="w-4 h-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleSave}
          disabled={isToggling}
          className={cn("h-8 w-8 p-0", isSaved && "text-[hsl(var(--primary))]")}
          aria-label={isSaved ? "Remove from saved" : "Save mic"}
        >
          <Bookmark className={cn("w-4 h-4", isSaved && "fill-[hsl(var(--primary))]")} />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleShare}
          className="h-8 w-8 p-0"
          aria-label="Share mic"
        >
          <Send className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}
