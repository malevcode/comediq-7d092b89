import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MicPlaylist, usePlaylistItems, useMicPlaylists } from "@/hooks/useMicPlaylists";
import { useOpenMics } from "@/hooks/useOpenMics";
import { OpenMic } from "@/types/openMic";
import OpenMicsDetailedList from "@/components/OpenMicsDetailedList";
import { ArrowLeft, Pencil, Check, X, Loader2, Plus, Sparkles } from "lucide-react";
import { toast } from "sonner";

const glassPanelClass = "rounded-lg border border-[#07111f]/10 bg-white/30 text-[#07111f] shadow-[0_18px_60px_rgba(4,20,55,0.12)] backdrop-blur-xl dark:border-white/10 dark:bg-[#07111f]/30 dark:text-white dark:shadow-[0_18px_60px_rgba(4,20,55,0.18)]";
const glassFieldClass = "border-[#07111f]/10 bg-white/40 text-[#07111f] placeholder:text-[#07111f]/50 shadow-sm backdrop-blur-xl hover:bg-white/50 focus-visible:ring-[#1a5fb4]/30 dark:border-white/10 dark:bg-white/10 dark:text-white dark:placeholder:text-white/50 dark:hover:bg-white/20";
const glassButtonClass = "border border-[#07111f]/10 bg-white/30 text-[#07111f] shadow-[0_10px_30px_rgba(2,10,30,0.08)] backdrop-blur-xl hover:bg-white/50 hover:text-[#1a5fb4] dark:border-white/10 dark:bg-white/10 dark:text-white dark:hover:bg-white/20 dark:hover:text-white";
const mutedTextClass = "text-[#07111f]/60 dark:text-white/60";

interface PlaylistMicListProps {
  playlist: MicPlaylist;
  onBack: () => void;
  /** For smart playlists - pass mics directly */
  mics?: OpenMic[];
  isSmartPlaylist?: boolean;
  /** All mics for suggestions */
  allMics?: OpenMic[];
  /** Show suggested mics section (e.g. after creation) */
  showSuggestions?: boolean;
}

export function PlaylistMicList({ playlist, onBack, mics: propMics, isSmartPlaylist, allMics: propAllMics, showSuggestions }: PlaylistMicListProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(playlist.name);
  const [editDescription, setEditDescription] = useState(playlist.description || "");
  const [visibleCount, setVisibleCount] = useState(50);
  const [addedMicIds, setAddedMicIds] = useState<Set<string>>(new Set());
  
  const { items, isLoading: itemsLoading } = usePlaylistItems(playlist.id, !isSmartPlaylist);
  const { data: fetchedMics = [], isLoading: micsLoading } = useOpenMics();
  const { updatePlaylist, removeFromPlaylist, addToPlaylist, isUpdating } = useMicPlaylists();

  const allMics = propAllMics || fetchedMics;

  // For regular playlists, filter mics by playlist items
  const playlistMics = useMemo(() => {
    if (propMics) return propMics;
    if (!items.length || !allMics.length) return [];
    
    const micIds = new Set(items.map(item => item.mic_unique_identifier));
    return allMics.filter(mic => micIds.has(mic.uniqueIdentifier));
  }, [items, allMics, propMics]);

  // Suggested mics (not already in playlist)
  const suggestedMics = useMemo(() => {
    if (!showSuggestions || isSmartPlaylist) return [];
    const existingIds = new Set([
      ...items.map(item => item.mic_unique_identifier),
      ...addedMicIds
    ]);
    
    // Smart suggestions based on playlist name
    const name = playlist.name.toLowerCase();
    let filtered = allMics.filter(mic => !existingIds.has(mic.uniqueIdentifier));
    
    if (name.includes('monday')) filtered = filtered.filter(m => m.day === 'Monday');
    else if (name.includes('tuesday')) filtered = filtered.filter(m => m.day === 'Tuesday');
    else if (name.includes('wednesday')) filtered = filtered.filter(m => m.day === 'Wednesday');
    else if (name.includes('thursday')) filtered = filtered.filter(m => m.day === 'Thursday');
    else if (name.includes('friday')) filtered = filtered.filter(m => m.day === 'Friday');
    else if (name.includes('saturday')) filtered = filtered.filter(m => m.day === 'Saturday');
    else if (name.includes('sunday')) filtered = filtered.filter(m => m.day === 'Sunday');
    
    if (name.includes('free')) filtered = filtered.filter(m => {
      const cost = m.cost?.toLowerCase() || '';
      return cost.includes('free') || cost === '$0' || cost === '0';
    });
    
    if (name.includes('brooklyn')) filtered = filtered.filter(m => m.borough === 'Brooklyn');
    else if (name.includes('manhattan')) filtered = filtered.filter(m => m.borough === 'Manhattan');
    else if (name.includes('queens')) filtered = filtered.filter(m => m.borough === 'Queens');
    else if (name.includes('bronx')) filtered = filtered.filter(m => m.borough === 'Bronx');
    
    if (name.includes('late') || name.includes('night')) {
      filtered = filtered.filter(m => {
        const timeMatch = m.startTime?.match(/(\d+):?\d*\s*(pm|am)/i);
        if (!timeMatch) return false;
        let hour = parseInt(timeMatch[1]);
        if (timeMatch[2].toLowerCase() === 'pm' && hour !== 12) hour += 12;
        return hour >= 21;
      });
    }
    
    return filtered.slice(0, 10);
  }, [showSuggestions, isSmartPlaylist, items, addedMicIds, allMics, playlist.name]);

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

  const handleAddSuggestedMic = async (mic: OpenMic) => {
    try {
      await addToPlaylist({ playlistId: playlist.id, micUniqueIdentifier: mic.uniqueIdentifier });
      setAddedMicIds(prev => new Set([...prev, mic.uniqueIdentifier]));
      toast.success(`Added "${mic.openMic}" to playlist`);
    } catch (error: any) {
      if (error.message?.includes("duplicate")) {
        toast.info("Already in playlist");
      } else {
        toast.error("Failed to add mic");
      }
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
        <Button variant="ghost" size="sm" onClick={onBack} className="gap-1 text-[#07111f] hover:bg-white/40 hover:text-[#1a5fb4] dark:text-white dark:hover:bg-white/10 dark:hover:text-white">
          <ArrowLeft className="h-4 w-4" />
          Back
        </Button>
      </div>

      {/* Playlist Info */}
      <div className={`p-4 ${glassPanelClass}`}>
        {isEditing && !isSmartPlaylist ? (
          <div className="space-y-3">
            <Input
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              placeholder="Playlist name"
              className={`text-lg font-semibold ${glassFieldClass}`}
              autoFocus
            />
            <Input
              value={editDescription}
              onChange={(e) => setEditDescription(e.target.value)}
              placeholder="Description (optional)"
              className={glassFieldClass}
            />
            <div className="flex gap-2">
              <Button size="sm" onClick={handleSaveEdit} disabled={isUpdating}>
                {isUpdating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                Save
              </Button>
              <Button size="sm" variant="outline" onClick={() => setIsEditing(false)} className={glassButtonClass}>
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
                <p className={`mt-1 ${mutedTextClass}`}>{playlist.description}</p>
              )}
              <p className={`mt-2 text-sm ${mutedTextClass}`}>
                {playlistMics.length + addedMicIds.size} mic{(playlistMics.length + addedMicIds.size) !== 1 ? 's' : ''}
              </p>
            </div>
            {!isSmartPlaylist && (
              <Button variant="ghost" size="sm" onClick={() => setIsEditing(true)} className="hover:bg-white/40 hover:text-[#1a5fb4] dark:hover:bg-white/10 dark:hover:text-white">
                <Pencil className="h-4 w-4" />
              </Button>
            )}
          </div>
        )}
      </div>

      {/* Suggested Mics Section */}
      {showSuggestions && suggestedMics.length > 0 && (
        <div className={`p-4 ${glassPanelClass}`}>
          <div className="flex items-center gap-2 mb-3">
            <Sparkles className="h-4 w-4 text-[#1a5fb4] dark:text-[#8ec5ff]" />
            <h3 className="font-semibold text-sm">Suggested Mics</h3>
            <span className={`text-xs ${mutedTextClass}`}>Based on "{playlist.name}"</span>
          </div>
          <div className="space-y-2">
            {suggestedMics.map((mic) => (
              <div key={mic.uniqueIdentifier} className="flex items-center justify-between rounded-md border border-[#07111f]/10 bg-white/30 p-3 shadow-sm dark:border-white/10 dark:bg-white/10">
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate">{mic.openMic}</p>
                  <p className={`text-xs ${mutedTextClass}`}>
                    {mic.day} · {mic.startTime} · {mic.borough}
                    {mic.cost && ` · ${mic.cost}`}
                  </p>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  className={`ml-2 shrink-0 gap-1 ${glassButtonClass}`}
                  onClick={() => handleAddSuggestedMic(mic)}
                >
                  <Plus className="h-3 w-3" />
                  Add
                </Button>
              </div>
            ))}
          </div>
          <p className={`mt-3 text-xs ${mutedTextClass}`}>
            💡 You can also add mics from the "Find Mics" tab using the playlist button on any mic card.
          </p>
        </div>
      )}

      {/* Empty state with guidance */}
      {!isLoading && playlistMics.length === 0 && addedMicIds.size === 0 && !showSuggestions && (
        <div className={`py-12 text-center ${glassPanelClass}`}>
          <p className={mutedTextClass}>No mics in this playlist yet.</p>
          <p className={`mt-1 text-sm ${mutedTextClass}`}>
            Add mics from the "Find Mics" tab using the playlist button.
          </p>
        </div>
      )}

      {/* Mic List */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className={`h-6 w-6 animate-spin ${mutedTextClass}`} />
        </div>
      ) : playlistMics.length > 0 && (
        <div>
          <h3 className={`mb-3 text-sm font-medium ${mutedTextClass}`}>PLAYLIST MICS</h3>
          <OpenMicsDetailedList 
            mics={playlistMics}
            visibleCount={visibleCount}
            setVisibleCount={setVisibleCount}
          />
        </div>
      )}
    </div>
  );
}
