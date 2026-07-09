import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useMicPlaylists, usePlaylistItems } from "@/hooks/useMicPlaylists";
import { useOpenMics } from "@/hooks/useOpenMics";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Trash2, MapPin, Calendar, Clock, DollarSign, Music, GripVertical } from "lucide-react";
import PageHeader from "@/components/PageHeader";
import { Link } from "react-router-dom";
import { slugify } from "@/utils/slugify";

export default function PlaylistDetail() {
  const { playlistId } = useParams<{ playlistId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { playlists, removeFromPlaylist } = useMicPlaylists();
  const { items, isLoading: itemsLoading } = usePlaylistItems(playlistId || "");
  const { data: mics = [] } = useOpenMics();

  const playlist = playlists.find(p => p.id === playlistId);

  // Map items to mic data
  const playlistMics = items.map(item => {
    const mic = mics.find(m => m.uniqueIdentifier === item.mic_unique_identifier);
    return { ...item, mic };
  }).filter(item => item.mic);

  const handleRemoveFromPlaylist = async (micUniqueIdentifier: string) => {
    if (!playlistId) return;
    try {
      await removeFromPlaylist({ playlistId, micUniqueIdentifier });
    } catch (error) {
      console.error("Error removing from playlist:", error);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-transparent">
        <div className="max-w-7xl mx-auto px-8 py-10">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Please sign in to view playlists</h1>
            <Button onClick={() => navigate("/auth")}>Sign In</Button>
          </div>
        </div>
      </div>
    );
  }

  if (!playlist) {
    return (
      <div className="min-h-screen bg-transparent">
        <div className="max-w-7xl mx-auto px-8 pt-28 pb-10">
          <Button variant="ghost" onClick={() => navigate("/playlists")} className="mb-4">
            <ArrowLeft className="w-4 h-4 mr-2" /> Back to Playlists
          </Button>
          <div className="text-center py-12">
            <Music className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Playlist not found</h3>
            <p className="text-gray-600">This playlist may have been deleted or doesn't exist.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-transparent">
      <PageHeader title={playlist.name} subtitle={playlist.description || "Your curated mic collection"} />
      <main className="max-w-7xl mx-auto px-8 pt-28 pb-10">
        <Button variant="ghost" onClick={() => navigate("/playlists")} className="mb-6">
          <ArrowLeft className="w-4 h-4 mr-2" /> Back to Playlists
        </Button>

        <div className="mb-6 flex items-center gap-3">
          <Badge variant="secondary" className="bg-[#FFE8D4] text-gray-700">
            {playlistMics.length} {playlistMics.length === 1 ? 'mic' : 'mics'}
          </Badge>
          {playlist.is_public && (
            <Badge variant="outline" className="text-xs">Public</Badge>
          )}
        </div>

        {itemsLoading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#0E4898] mx-auto"></div>
            <p className="mt-2 text-gray-600">Loading mics...</p>
          </div>
        ) : playlistMics.length === 0 ? (
          <div className="text-center py-12">
            <Music className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">This playlist is empty</h3>
            <p className="text-gray-600 mb-6">Add mics from the open mics list to start building your collection</p>
            <Button onClick={() => navigate("/open-mics")} className="bg-gradient-to-r from-[#0E4898] to-[#5DC8E2] text-white">
              Browse Open Mics
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {playlistMics.map((item, index) => (
              <Card key={item.id} className="border-gray-200 hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-start gap-4">
                    <div className="flex items-center gap-2 text-gray-400">
                      <GripVertical className="w-5 h-5" />
                      <span className="text-sm font-medium w-6">{index + 1}</span>
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <Link 
                        to={`/mics/${slugify(item.mic!.openMic)}`}
                        className="font-semibold text-gray-900 hover:text-[#0E4898] transition-colors"
                      >
                        {item.mic!.openMic}
                      </Link>
                      
                      <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2 text-sm text-gray-600">
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3 h-3" />
                          {item.mic!.venueName}, {item.mic!.neighborhood}
                        </span>
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {item.mic!.day}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {item.mic!.startTime}
                        </span>
                        <span className="flex items-center gap-1">
                          <DollarSign className="w-3 h-3" />
                          {item.mic!.cost}
                        </span>
                      </div>

                      {item.notes && (
                        <p className="text-sm text-gray-500 mt-2 italic">"{item.notes}"</p>
                      )}
                    </div>

                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveFromPlaylist(item.mic_unique_identifier)}
                      className="text-red-600 hover:text-red-800 hover:bg-red-50"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
