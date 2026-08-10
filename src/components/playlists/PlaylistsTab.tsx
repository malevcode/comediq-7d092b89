import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { useMicPlaylists, MicPlaylist } from "@/hooks/useMicPlaylists";
import { useOpenMics } from "@/hooks/useOpenMics";
import { OpenMic } from "@/types/openMic";
import { PlaylistCard } from "./PlaylistCard";
import { SmartPlaylistCard } from "./SmartPlaylistCard";
import { CreatePlaylistModal } from "./CreatePlaylistModal";
import { PlaylistMicList } from "./PlaylistMicList";
import { Link } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { 
  Plus, 
  Bookmark, 
  Loader2, 
  Mic, 
  Calendar, 
  DollarSign, 
  Moon, 
  Clock,
  LogIn 
} from "lucide-react";

const glassButtonClass = "gap-2 rounded-lg border border-[#07111f]/10 bg-white/30 text-[#07111f] shadow-[0_10px_30px_rgba(2,10,30,0.08)] backdrop-blur-xl transition-all hover:-translate-y-0.5 hover:bg-white/50 hover:text-[#1a5fb4] dark:border-white/10 dark:bg-white/10 dark:text-white dark:hover:bg-white/20 dark:hover:text-white";
const primaryGlassButtonClass = "gap-2 rounded-lg border border-[#1a5fb4]/20 bg-[#1a5fb4]/90 text-white shadow-[0_10px_30px_rgba(2,10,30,0.12)] backdrop-blur-xl transition-all hover:-translate-y-0.5 hover:bg-[#1550a0] hover:text-white dark:border-white/10 dark:bg-[#1a5fb4]/70 dark:hover:bg-[#1a5fb4]/90";
const glassPanelClass = "rounded-lg border border-[#07111f]/10 bg-white/30 text-[#07111f] shadow-[0_18px_60px_rgba(4,20,55,0.12)] backdrop-blur-xl dark:border-white/10 dark:bg-[#07111f]/30 dark:text-white dark:shadow-[0_18px_60px_rgba(4,20,55,0.18)]";
const mutedTextClass = "text-[#07111f]/60 dark:text-white/60";

// Helper to parse time string to hour (24h format)
function parseTimeToHour(timeStr: string): number | null {
  if (!timeStr) return null;
  
  // Handle formats like "7:00 PM", "19:00", "7pm"
  const normalizedTime = timeStr.toLowerCase().trim();
  
  // Try to extract hour and AM/PM
  const match = normalizedTime.match(/(\d{1,2})(?::(\d{2}))?\s*(am|pm)?/i);
  if (!match) return null;
  
  let hour = parseInt(match[1], 10);
  const isPM = match[3]?.toLowerCase() === 'pm';
  const isAM = match[3]?.toLowerCase() === 'am';
  
  if (isPM && hour !== 12) hour += 12;
  if (isAM && hour === 12) hour = 0;
  
  return hour;
}

// Get today's day name
function getTodayName(): string {
  return new Date().toLocaleDateString('en-US', { weekday: 'long' });
}

export function PlaylistsTab() {
  const { user } = useAuth();
  const { playlists, isLoading, createPlaylist } = useMicPlaylists();
  const { data: allMics = [] } = useOpenMics();
  const { toast } = useToast();
  
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedPlaylist, setSelectedPlaylist] = useState<MicPlaylist | null>(null);
  const [activeSmartFilter, setActiveSmartFilter] = useState<string | null>(null);
  const [justCreatedPlaylist, setJustCreatedPlaylist] = useState<MicPlaylist | null>(null);

  // Smart playlist filters
  const smartFilters = useMemo(() => {
    const today = getTodayName();
    
    const tonightMics = allMics.filter(mic => mic.day === today);
    
    const freeMics = allMics.filter(mic => {
      const cost = mic.cost?.toLowerCase() || '';
      return cost.includes('free') || cost === '$0' || cost === '0';
    });
    
    const lateNightMics = allMics.filter(mic => {
      const hour = parseTimeToHour(mic.startTime);
      return hour !== null && hour >= 21;
    });
    
    const quickSetMics = allMics.filter(mic => {
      const stageTime = mic.stageTime?.toLowerCase() || '';
      return stageTime.includes('5') || stageTime.includes('3');
    });

    return [
      { 
        id: 'tonight', 
        title: `Tonight (${today})`, 
        count: tonightMics.length, 
        icon: Calendar, 
        color: 'bg-blue-500',
        mics: tonightMics 
      },
      { 
        id: 'free', 
        title: 'Free Mics', 
        count: freeMics.length, 
        icon: DollarSign, 
        color: 'bg-green-500',
        mics: freeMics 
      },
      { 
        id: 'late-night', 
        title: 'Late Night (9PM+)', 
        count: lateNightMics.length, 
        icon: Moon, 
        color: 'bg-purple-500',
        mics: lateNightMics 
      },
      { 
        id: 'quick-sets', 
        title: 'Quick Sets (5 min)', 
        count: quickSetMics.length, 
        icon: Clock, 
        color: 'bg-orange-500',
        mics: quickSetMics 
      },
    ];
  }, [allMics]);

  // Get active smart filter mics
  const activeFilterData = smartFilters.find(f => f.id === activeSmartFilter);

  // If viewing a playlist or smart filter, show the mic list
  if (selectedPlaylist) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-4 pt-0">
        <PlaylistMicList 
          playlist={selectedPlaylist} 
          onBack={() => {
            setSelectedPlaylist(null);
            setJustCreatedPlaylist(null);
          }}
          allMics={allMics}
          showSuggestions={!!justCreatedPlaylist}
        />
      </div>
    );
  }

  if (activeSmartFilter && activeFilterData) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-4 pt-0">
        <PlaylistMicList 
          playlist={{ 
            id: activeSmartFilter, 
            name: activeFilterData.title, 
            description: `Auto-generated filter showing ${activeFilterData.count} mics`,
            user_id: '',
            is_public: false,
            created_at: '',
            updated_at: ''
          }} 
          mics={activeFilterData.mics}
          isSmartPlaylist
          onBack={() => setActiveSmartFilter(null)} 
        />
      </div>
    );
  }

  // Not logged in state
  if (!user) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="text-center">
          <Mic className={`mx-auto mb-4 h-12 w-12 ${mutedTextClass}`} />
          <h2 className="text-xl font-semibold mb-2">Create Mic Playlists</h2>
          <p className={`mx-auto mb-6 max-w-md ${mutedTextClass}`}>
            Organize your favorite mics into custom collections. Share with friends or keep them private.
          </p>
          <Button asChild className={primaryGlassButtonClass}>
            <Link to="/auth">
              <LogIn className="h-4 w-4 mr-2" />
              Sign In to Get Started
            </Link>
          </Button>
          
          {/* Still show smart filters for non-logged-in users */}
          <div className="mt-8">
            <h3 className={`mb-3 text-sm font-medium ${mutedTextClass}`}>QUICK FILTERS</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {smartFilters.map((filter) => (
                <SmartPlaylistCard
                  key={filter.id}
                  title={filter.title}
                  count={filter.count}
                  icon={filter.icon}
                  color={filter.color}
                  onClick={() => setActiveSmartFilter(filter.id)}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header Actions */}
      <h2 className="text-xl font-bold text-white mb-2">Your Playlists</h2>
      <div className="flex flex-wrap gap-3 mb-6">
        <Button
          onClick={() => setShowCreateModal(true)}
          className={primaryGlassButtonClass}
        >
          <Plus className="h-4 w-4" />
          New Playlist
        </Button>
        <Button variant="outline" asChild className={glassButtonClass}>
          <Link to="/saved">
            <Bookmark className="h-4 w-4" />
            View Saved Mics
          </Link>
        </Button>
      </div>

      {/* Smart Filters */}
      <div className="mb-8">
        <h3 className={`mb-3 text-sm font-medium ${mutedTextClass}`}>QUICK FILTERS</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {smartFilters.map((filter) => (
            <SmartPlaylistCard
              key={filter.id}
              title={filter.title}
              count={filter.count}
              icon={filter.icon}
              color={filter.color}
              onClick={() => setActiveSmartFilter(filter.id)}
            />
          ))}
        </div>
      </div>

      {/* User Playlists */}
      <div>
        <h3 className={`mb-3 text-sm font-medium ${mutedTextClass}`}>
          YOUR PLAYLISTS {playlists.length > 0 && `(${playlists.length})`}
        </h3>
        
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className={`h-6 w-6 animate-spin ${mutedTextClass}`} />
          </div>
        ) : playlists.length === 0 ? (
          <div className={`py-12 text-center ${glassPanelClass}`}>
            <Mic className={`mx-auto mb-3 h-10 w-10 ${mutedTextClass}`} />
            <h4 className="mb-1 text-base font-semibold text-[#07111f] dark:text-white">Build your mic rotation</h4>
            <p className={`mx-auto mb-5 max-w-sm text-sm ${mutedTextClass}`}>
              Group mics by night, borough, or vibe — just like a Spotify playlist, but for open mics.
            </p>
            <div className="flex flex-wrap gap-2 justify-center mb-4">
              {["Monday Night Lineup", "Free Mics Only", "Brooklyn Circuit", "Late Night Spots"].map(name => (
                <Button
                  key={name}
                  variant="outline"
                  size="sm"
                  className={`${glassButtonClass} text-xs`}
                  onClick={async () => {
                    try {
                      const newPlaylist = await createPlaylist({ name });
                      toast({ title: "Created!", description: `"${name}" playlist created` });
                      // Navigate to the new playlist
                      const pl: MicPlaylist = {
                        id: newPlaylist.id,
                        name: newPlaylist.name,
                        description: newPlaylist.description,
                        user_id: newPlaylist.user_id,
                        is_public: newPlaylist.is_public,
                        created_at: newPlaylist.created_at,
                        updated_at: newPlaylist.updated_at,
                        item_count: 0,
                      };
                      setSelectedPlaylist(pl);
                      setJustCreatedPlaylist(pl);
                    } catch {
                      toast({ title: "Error", variant: "destructive" });
                    }
                  }}
                >
                  <Plus className="h-3 w-3" />
                  {name}
                </Button>
              ))}
            </div>
            <Button className={primaryGlassButtonClass} onClick={() => setShowCreateModal(true)} size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Create Custom Playlist
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {playlists.map((playlist) => (
              <PlaylistCard
                key={playlist.id}
                playlist={playlist}
                onOpen={setSelectedPlaylist}
                onEdit={(p) => {
                  // For now, just open the playlist - edit is in the detail view
                  setSelectedPlaylist(p);
                }}
              />
            ))}
          </div>
        )}
      </div>

      <CreatePlaylistModal 
        open={showCreateModal} 
        onOpenChange={setShowCreateModal}
        onSuccess={(newPlaylist) => {
          // Navigate to the newly created playlist
          const pl: MicPlaylist = {
            id: newPlaylist.id,
            name: newPlaylist.name,
            description: newPlaylist.description,
            user_id: newPlaylist.user_id,
            is_public: newPlaylist.is_public,
            created_at: newPlaylist.created_at,
            updated_at: newPlaylist.updated_at,
            item_count: 0,
          };
          setSelectedPlaylist(pl);
          setJustCreatedPlaylist(pl);
        }}
      />
    </div>
  );
}
