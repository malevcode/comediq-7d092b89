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
      <div className="max-w-7xl mx-auto px-4 py-4">
        <PlaylistMicList 
          playlist={selectedPlaylist} 
          onBack={() => setSelectedPlaylist(null)} 
        />
      </div>
    );
  }

  if (activeSmartFilter && activeFilterData) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-4">
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
          <Mic className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h2 className="text-xl font-semibold mb-2">Create Mic Playlists</h2>
          <p className="text-muted-foreground mb-6 max-w-md mx-auto">
            Organize your favorite mics into custom collections. Share with friends or keep them private.
          </p>
          <Button asChild>
            <Link to="/auth">
              <LogIn className="h-4 w-4 mr-2" />
              Sign In to Get Started
            </Link>
          </Button>
          
          {/* Still show smart filters for non-logged-in users */}
          <div className="mt-8">
            <h3 className="text-sm font-medium text-muted-foreground mb-3">QUICK FILTERS</h3>
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
    <div className="max-w-7xl mx-auto px-4 py-4">
      {/* Header Actions */}
      <div className="flex flex-wrap gap-3 mb-6">
        <Button onClick={() => setShowCreateModal(true)} className="gap-2">
          <Plus className="h-4 w-4" />
          New Playlist
        </Button>
        <Button variant="outline" asChild className="gap-2">
          <Link to="/saved">
            <Bookmark className="h-4 w-4" />
            View Saved Mics
          </Link>
        </Button>
      </div>

      {/* Smart Filters */}
      <div className="mb-8">
        <h3 className="text-sm font-medium text-muted-foreground mb-3">QUICK FILTERS</h3>
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
        <h3 className="text-sm font-medium text-muted-foreground mb-3">
          YOUR PLAYLISTS {playlists.length > 0 && `(${playlists.length})`}
        </h3>
        
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : playlists.length === 0 ? (
          <div className="text-center py-12 bg-muted/30 rounded-lg">
            <Mic className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
            <h4 className="font-semibold text-base mb-1">Build your mic rotation</h4>
            <p className="text-sm text-muted-foreground mb-5 max-w-sm mx-auto">
              Group mics by night, borough, or vibe — just like a Spotify playlist, but for open mics.
            </p>
            <div className="flex flex-wrap gap-2 justify-center mb-4">
              {["Monday Night Lineup", "Free Mics Only", "Brooklyn Circuit", "Late Night Spots"].map(name => (
                <Button
                  key={name}
                  variant="outline"
                  size="sm"
                  className="text-xs gap-1"
                  onClick={async () => {
                    try {
                      await createPlaylist({ name });
                      toast({ title: "Created!", description: `"${name}" playlist created` });
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
            <Button onClick={() => setShowCreateModal(true)} size="sm">
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
      />
    </div>
  );
}
