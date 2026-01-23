import { useState } from "react";
import { Plus, Check, Music } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useMicPlaylists } from "@/hooks/useMicPlaylists";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

interface PlaylistSelectorDropdownProps {
  micUniqueIdentifier: string;
  micName: string;
  onClose: () => void;
}

export default function PlaylistSelectorDropdown({
  micUniqueIdentifier,
  micName,
  onClose
}: PlaylistSelectorDropdownProps) {
  const { toast } = useToast();
  const { playlists, createPlaylist, addToPlaylist, isCreating } = useMicPlaylists();
  const [showCreateNew, setShowCreateNew] = useState(false);
  const [newPlaylistName, setNewPlaylistName] = useState("");
  const [addedTo, setAddedTo] = useState<Set<string>>(new Set());

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
      onClose();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create playlist",
        variant: "destructive"
      });
    }
  };

  return (
    <div 
      className="absolute bottom-full left-0 right-0 mb-2 bg-white rounded-lg shadow-lg border border-gray-200 z-50 overflow-hidden"
      onClick={(e) => e.stopPropagation()}
    >
      <div className="p-3 border-b border-gray-100">
        <h4 className="font-semibold text-sm text-gray-900">Add to Playlist</h4>
      </div>

      <div className="max-h-48 overflow-y-auto">
        {playlists.length === 0 && !showCreateNew ? (
          <div className="p-4 text-center text-gray-500 text-sm">
            <Music className="w-8 h-8 mx-auto mb-2 text-gray-300" />
            <p>No playlists yet</p>
          </div>
        ) : (
          playlists.map((playlist) => (
            <button
              key={playlist.id}
              onClick={() => handleAddToPlaylist(playlist.id, playlist.name)}
              disabled={addedTo.has(playlist.id)}
              className={cn(
                "w-full flex items-center justify-between px-4 py-3 hover:bg-gray-50 transition-colors text-left",
                addedTo.has(playlist.id) && "bg-green-50"
              )}
            >
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm text-gray-900 truncate">{playlist.name}</p>
                <p className="text-xs text-gray-500">{playlist.item_count || 0} mics</p>
              </div>
              {addedTo.has(playlist.id) && (
                <Check className="w-4 h-4 text-green-600 flex-shrink-0 ml-2" />
              )}
            </button>
          ))
        )}
      </div>

      {/* Create New Playlist Section */}
      <div className="border-t border-gray-100">
        {showCreateNew ? (
          <div className="p-3">
            <Input
              value={newPlaylistName}
              onChange={(e) => setNewPlaylistName(e.target.value)}
              placeholder="Playlist name..."
              maxLength={100}
              className="mb-2 text-sm"
              autoFocus
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
                className="flex-1 bg-gradient-to-r from-[#0E4898] to-[#5DC8E2] text-white"
              >
                Create & Add
              </Button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setShowCreateNew(true)}
            className="w-full flex items-center gap-2 px-4 py-3 text-[#0E4898] hover:bg-gray-50 transition-colors font-medium text-sm"
          >
            <Plus className="w-4 h-4" />
            Create New Playlist
          </button>
        )}
      </div>

      {/* Close on outside click */}
      <div 
        className="fixed inset-0 -z-10" 
        onClick={onClose}
      />
    </div>
  );
}
