import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useMicPlaylists } from "@/hooks/useMicPlaylists";
import { toast } from "sonner";
import { Loader2, Lock, Globe } from "lucide-react";

const glassDialogClass = "border border-[#07111f]/10 bg-white/80 text-[#07111f] shadow-[0_18px_60px_rgba(4,20,55,0.18)] backdrop-blur-xl dark:border-white/10 dark:bg-[#07111f]/90 dark:text-white";
const glassFieldClass = "border-[#07111f]/10 bg-white/40 text-[#07111f] placeholder:text-[#07111f]/50 shadow-sm backdrop-blur-xl hover:bg-white/50 focus-visible:ring-[#1a5fb4]/30 dark:border-white/10 dark:bg-white/10 dark:text-white dark:placeholder:text-white/50 dark:hover:bg-white/20";
const glassButtonClass = "border border-[#07111f]/10 bg-white/30 text-[#07111f] shadow-[0_10px_30px_rgba(2,10,30,0.08)] backdrop-blur-xl hover:bg-white/50 hover:text-[#1a5fb4] dark:border-white/10 dark:bg-white/10 dark:text-white dark:hover:bg-white/20 dark:hover:text-white";
const primaryGlassButtonClass = "bg-[#1a5fb4] text-white hover:bg-[#1550a0] hover:text-white";
const mutedTextClass = "text-[#07111f]/60 dark:text-white/60";

interface CreatePlaylistModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: (playlist: any) => void;
}

export function CreatePlaylistModal({ open, onOpenChange, onSuccess }: CreatePlaylistModalProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [isPublic, setIsPublic] = useState(false);
  const { createPlaylist, isCreating } = useMicPlaylists();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name.trim()) {
      toast.error("Please enter a playlist name");
      return;
    }

    if (name.length > 100) {
      toast.error("Name must be 100 characters or less");
      return;
    }

    try {
      const newPlaylist = await createPlaylist({ 
        name: name.trim(), 
        description: description.trim() || undefined,
        isPublic 
      });
      toast.success("Playlist created!");
      setName("");
      setDescription("");
      setIsPublic(false);
      onOpenChange(false);
      onSuccess?.(newPlaylist);
    } catch (error) {
      console.error("Failed to create playlist:", error);
      toast.error("Failed to create playlist");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={`sm:max-w-md ${glassDialogClass}`}>
        <DialogHeader>
          <DialogTitle>Create New Playlist</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              className={glassFieldClass}
              placeholder="e.g., Monday Night Rotation"
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={100}
              autoFocus
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="description">Description (optional)</Label>
            <Textarea
              id="description"
              className={glassFieldClass}
              placeholder="What's this playlist for?"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
            />
          </div>

          <div className="flex items-center justify-between py-2">
            <div className="flex items-center gap-2">
              {isPublic ? (
                <Globe className={`h-4 w-4 ${mutedTextClass}`} />
              ) : (
                <Lock className={`h-4 w-4 ${mutedTextClass}`} />
              )}
              <Label htmlFor="public" className="text-sm">
                {isPublic ? "Public - Anyone can view" : "Private - Only you can view"}
              </Label>
            </div>
            <Switch
              id="public"
              checked={isPublic}
              onCheckedChange={setIsPublic}
            />
          </div>

          <DialogFooter>
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => onOpenChange(false)}
              disabled={isCreating}
              className={glassButtonClass}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isCreating || !name.trim()} className={primaryGlassButtonClass}>
              {isCreating ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Creating...
                </>
              ) : (
                "Create Playlist"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
