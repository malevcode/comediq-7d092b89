import { useState, useEffect } from "react";
import { Plus, Check, Music } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useMicPlaylists } from "@/hooks/useMicPlaylists";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";

interface PlaylistSelectorDropdownProps {
  micUniqueIdentifier: string;
  micName: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function PlaylistSelectorDropdown({
  micUniqueIdentifier,
  micName,
  open,
  onOpenChange
}: PlaylistSelectorDropdownProps) {
  const { toast } = useToast();
  const navigate = useNavigate();
  const { playlists, createPlaylist, addToPlaylist, isCreating } = useMicPlaylists();
  const [showCreateNew, setShowCreateNew] = useState(false);
  const [newPlaylistName, setNewPlaylistName] = useState("");
  const [addedTo, setAddedTo] = useState<Set<string>>(new Set());

  // Pre-check which playlists already contain this mic
  useEffect(() => {
    if (!open || playlists.length === 0) return;
    const playlistIds = playlists.map(p => p.id);
    supabase
      .from("mic_playlist_items")
      .select("playlist_id")
      .eq("mic_unique_identifier", micUniqueIdentifier)
      .in("playlist_id", playlistIds)
      .then(({ data }) => {
        if (data && data.length > 0) {
          setAddedTo(new Set(data.map(d => d.playlist_id)));
        }
      });
  }, [open, playlists, micUniqueIdentifier]);

  const handleAddToPlaylist = async (playlistId: string, playlistName: string) => {
    try {
      await addToPlaylist({ playlistId, micUniqueIdentifier });
      setAddedTo(prev => new Set([...prev, playlistId]));
      toast({
        title: "Added!",
        description: `${micName} added to "${playlistName}"`
      });
    } catch (error: any) {
      if (error.message?.includes("duplicate")) {
        toast({
          title: "Already in playlist",
          description: `${micName} is already in "${playlistName}"`,
          variant: "default"
        });
      } else {
        toast({
          title: "Error",
          description: "Failed to add to playlist",
          variant: "destructive"
        });
      }
    }
  };

  const handleCreateAndAdd = async () => {
    if (!newPlaylistName.trim()) return;

    try {
      const newPlaylist = await createPlaylist({ name: newPlaylistName.trim() });
      await addToPlaylist({ playlistId: newPlaylist.id, micUniqueIdentifier });
      toast({
        title: "Playlist created!",
        description: `${micName} added to "${newPlaylistName}"`
      });
      setNewPlaylistName("");
      setShowCreateNew(false);
      onOpenChange(false);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create playlist",
        variant: "destructive"
      });
    }
  };

  const SUGGESTED_NAMES = ["Monday Night Lineup", "Free Mics Only", "Brooklyn Circuit", "Late Night Spots"];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-base">Add to Playlist</DialogTitle>
        </DialogHeader>

        <div className="max-h-60 overflow-y-auto -mx-6 px-6">
          {playlists.length === 0 && !showCreateNew ? (
            <div className="py-6 text-center">
              <Music className="w-10 h-10 mx-auto mb-3 text-muted-foreground/40" />
              <p className="font-medium text-sm mb-1">No playlists yet</p>
              <p className="text-xs text-muted-foreground mb-4">
                Build your mic rotation — create a playlist to get started
              </p>
              <div className="flex flex-wrap gap-2 justify-center">
                {SUGGESTED_NAMES.map(name => (
                  <Button
                    key={name}
                    variant="outline"
                    size="sm"
                    className="text-xs"
                    onClick={async () => {
                      try {
                        const p = await createPlaylist({ name });
                        await addToPlaylist({ playlistId: p.id, micUniqueIdentifier });
                        toast({ title: "Created!", description: `${micName} added to "${name}"` });
                        onOpenChange(false);
                      } catch {
                        toast({ title: "Error", variant: "destructive" });
                      }
                    }}
                  >
                    + {name}
                  </Button>
                ))}
              </div>
            </div>
          ) : (
            playlists.map((playlist) => (
              <button
                key={playlist.id}
                onClick={() => handleAddToPlaylist(playlist.id, playlist.name)}
                disabled={addedTo.has(playlist.id)}
                className={cn(
                  "w-full flex items-center justify-between px-2 py-3 hover:bg-muted/50 transition-colors text-left rounded-md",
                  addedTo.has(playlist.id) && "bg-accent"
                )}
              >
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate">{playlist.name}</p>
                  <p className="text-xs text-muted-foreground">{playlist.item_count || 0} mics</p>
                </div>
                {addedTo.has(playlist.id) && (
                  <Check className="w-4 h-4 text-green-600 flex-shrink-0 ml-2" />
                )}
              </button>
            ))
          )}
        </div>

        {/* Create New Playlist Section */}
        <div className="border-t pt-3">
          {showCreateNew ? (
            <div>
              <Input
                value={newPlaylistName}
                onChange={(e) => setNewPlaylistName(e.target.value)}
                placeholder="Playlist name..."
                maxLength={100}
                className="mb-2 text-sm"
                autoFocus
                onKeyDown={(e) => e.key === "Enter" && handleCreateAndAdd()}
              />
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setShowCreateNew(false);
                    setNewPlaylistName("");
                  }}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  size="sm"
                  onClick={handleCreateAndAdd}
                  disabled={!newPlaylistName.trim() || isCreating}
                  className="flex-1"
                >
                  Create & Add
                </Button>
              </div>
            </div>
          ) : (
            <Button
              variant="ghost"
              onClick={() => setShowCreateNew(true)}
              className="w-full justify-start gap-2 text-sm"
            >
              <Plus className="w-4 h-4" />
              Create New Playlist
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
