import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MicPlaylist, usePlaylistItems, useMicPlaylists } from "@/hooks/useMicPlaylists";
import { useOpenMics } from "@/hooks/useOpenMics";
import { OpenMic } from "@/types/openMic";
import OpenMicsDetailedList from "@/components/OpenMicsDetailedList";
import { ArrowLeft, Pencil, Check, X, Loader2, Trash2 } from "lucide-react";
import { toast } from "sonner";

interface PlaylistMicListProps {
  playlist: MicPlaylist;
  onBack: () => void;
  /** For smart playlists - pass mics directly */
  mics?: OpenMic[];
  isSmartPlaylist?: boolean;
}

export function PlaylistMicList({ playlist, onBack, mics: propMics, isSmartPlaylist }: PlaylistMicListProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(playlist.name);
  const [editDescription, setEditDescription] = useState(playlist.description || "");
  const [visibleCount, setVisibleCount] = useState(50);
  
  const { items, isLoading: itemsLoading } = usePlaylistItems(playlist.id);
  const { data: allMics = [], isLoading: micsLoading } = useOpenMics();
  const { updatePlaylist, removeFromPlaylist, isUpdating } = useMicPlaylists();

  // For regular playlists, filter mics by playlist items
  const playlistMics = useMemo(() => {
    if (propMics) return propMics;
    if (!items.length || !allMics.length) return [];
    
    const micIds = new Set(items.map(item => item.mic_unique_identifier));
    return allMics.filter(mic => micIds.has(mic.uniqueIdentifier));
  }, [items, allMics, propMics]);

  const handleSaveEdit = async () => {
    if (!editName.trim()) {
      toast.error("Name is required");
      return;
    }

    try {
      await updatePlaylist({
        playlistId: playlist.id,
        name: editName.trim(),
        description: editDescription.trim() || undefined,
      });
      toast.success("Playlist updated");
      setIsEditing(false);
    } catch (error) {
      console.error("Failed to update playlist:", error);
      toast.error("Failed to update playlist");
    }
  };

  const handleRemoveMic = async (micId: string) => {
    try {
      await removeFromPlaylist({ playlistId: playlist.id, micUniqueIdentifier: micId });
      toast.success("Removed from playlist");
    } catch (error) {
      console.error("Failed to remove mic:", error);
      toast.error("Failed to remove mic");
    }
  };

  const isLoading = itemsLoading || micsLoading;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={onBack} className="gap-1">
          <ArrowLeft className="h-4 w-4" />
          Back
        </Button>
      </div>

      {/* Playlist Info */}
      <div className="bg-muted/50 rounded-lg p-4">
        {isEditing && !isSmartPlaylist ? (
          <div className="space-y-3">
            <Input
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              placeholder="Playlist name"
              className="text-lg font-semibold"
              autoFocus
            />
            <Input
              value={editDescription}
              onChange={(e) => setEditDescription(e.target.value)}
              placeholder="Description (optional)"
            />
            <div className="flex gap-2">
              <Button size="sm" onClick={handleSaveEdit} disabled={isUpdating}>
                {isUpdating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                Save
              </Button>
              <Button size="sm" variant="outline" onClick={() => setIsEditing(false)}>
                <X className="h-4 w-4" />
                Cancel
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-xl font-semibold">{playlist.name}</h2>
              {playlist.description && (
                <p className="text-muted-foreground mt-1">{playlist.description}</p>
              )}
              <p className="text-sm text-muted-foreground mt-2">
                {playlistMics.length} mic{playlistMics.length !== 1 ? 's' : ''}
              </p>
            </div>
            {!isSmartPlaylist && (
              <Button variant="ghost" size="sm" onClick={() => setIsEditing(true)}>
                <Pencil className="h-4 w-4" />
              </Button>
            )}
          </div>
        )}
      </div>

      {/* Mic List */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : playlistMics.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">No mics in this playlist yet.</p>
          <p className="text-sm text-muted-foreground mt-1">
            Add mics from the "Find Mics" tab using the playlist button.
          </p>
        </div>
      ) : (
        <OpenMicsDetailedList 
          mics={playlistMics}
          visibleCount={visibleCount}
          setVisibleCount={setVisibleCount}
        />
      )}
    </div>
  );
}
