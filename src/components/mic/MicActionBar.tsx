import { useState } from "react";
import { Heart, MessageCircle, Bookmark, ListPlus, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { useMicRatings } from "@/hooks/useMicRatings";
import { useSavedMics } from "@/hooks/useSavedMics";
import { useMicComments } from "@/hooks/useMicComments";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import PlaylistSelectorDropdown from "./PlaylistSelectorDropdown";

interface MicActionBarProps {
  micUniqueIdentifier: string;
  micName: string;
  onCommentClick?: () => void;
  showCommentSection?: boolean;
  className?: string;
}

export default function MicActionBar({
  micUniqueIdentifier,
  micName,
  onCommentClick,
  showCommentSection = false,
  className
}: MicActionBarProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [showPlaylistDialog, setShowPlaylistDialog] = useState(false);

  const { userRating, ratingCounts, rateMic, removeRating, isRating } = useMicRatings(micUniqueIdentifier);
  const { isMicSaved, toggleSave, isToggling } = useSavedMics();
  const { commentCount } = useMicComments(micUniqueIdentifier);

  const isLiked = userRating === "like";
  const likeCount = ratingCounts.likes || 0;
  const isSaved = isMicSaved(micUniqueIdentifier);

  const handleLike = () => {
    if (!user) {
      toast({ title: "Sign in required", description: "Please sign in to like mics" });
      navigate("/auth");
      return;
    }
    if (isLiked) removeRating(micUniqueIdentifier);
    else rateMic({ micUniqueIdentifier, rating: "like" });
  };

  const handleSave = async () => {
    if (!user) {
      toast({ title: "Sign in required", description: "Please sign in to save mics" });
      navigate("/auth");
      return;
    }
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

  const handleAddToPlaylist = () => {
    if (!user) {
      toast({ title: "Sign in required", description: "Please sign in to create playlists" });
      navigate("/auth");
      return;
    }
    setShowPlaylistDialog(true);
  };

  const handleShare = async () => {
    const url = `https://comediq.us/mics/${encodeURIComponent(micName.toLowerCase().replace(/\s+/g, '-'))}`;
    if (navigator.share) {
      try {
        await navigator.share({ title: micName, text: `Check out ${micName} on Comediq!`, url });
      } catch {
        await copyToClipboard(url);
      }
    } else {
      await copyToClipboard(url);
    }
  };

  const copyToClipboard = async (url: string) => {
    try {
      await navigator.clipboard.writeText(`Check out ${micName} on Comediq! ${url}`);
      toast({ title: "Link copied!", description: "Share link copied to clipboard" });
    } catch {
      toast({ title: "Error", description: "Failed to copy link", variant: "destructive" });
    }
  };

  return (
    <div className={cn("relative", className)}>
      <div className="flex items-center justify-evenly border-t border-border pt-1 mt-0.5">
        <Button variant="ghost" size="sm" onClick={handleLike} disabled={isRating}
          className={cn("flex items-center gap-1 px-2 py-1 h-auto", isLiked && "text-red-500")}>
          <Heart className={cn("w-4 h-4 transition-all", isLiked && "fill-red-500 text-red-500")} />
          {likeCount > 0 && <span className="text-xs font-medium">{likeCount}</span>}
        </Button>

        <Button variant="ghost" size="sm" onClick={onCommentClick} className="flex items-center gap-1 px-2 py-1 h-auto">
          <MessageCircle className="w-4 h-4" />
          {commentCount > 0 && <span className="text-xs font-medium">{commentCount}</span>}
        </Button>

        <Button variant="ghost" size="sm" onClick={handleSave} disabled={isToggling}
          className={cn("flex items-center gap-1 px-2 py-1 h-auto", isSaved && "text-[hsl(var(--primary))]")}>
          <Bookmark className={cn("w-4 h-4 transition-all", isSaved && "fill-[hsl(var(--primary))] text-[hsl(var(--primary))]")} />
        </Button>

        <Button variant="ghost" size="sm" onClick={handleAddToPlaylist} className="flex items-center gap-1 px-2 py-1 h-auto">
          <ListPlus className="w-4 h-4" />
        </Button>

        <Button variant="ghost" size="sm" onClick={handleShare} className="flex items-center gap-1 px-2 py-1 h-auto">
          <Send className="w-4 h-4" />
        </Button>
      </div>

      <PlaylistSelectorDropdown
        micUniqueIdentifier={micUniqueIdentifier}
        micName={micName}
        open={showPlaylistDialog}
        onOpenChange={setShowPlaylistDialog}
      />
    </div>
  );
}
