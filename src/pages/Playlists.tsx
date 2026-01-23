import { useAuth } from "@/contexts/AuthContext";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { useMicPlaylists } from "@/hooks/useMicPlaylists";
import { useToast } from "@/hooks/use-toast";
import { 
  Plus, 
  Edit3, 
  Trash2, 
  Music, 
  Calendar, 
  MapPin, 
  Clock, 
  Users,
  Eye,
  EyeOff
} from "lucide-react";
import PageHeader from "@/components/PageHeader";

interface EditingPlaylist {
  id: string;
  name: string;
  description: string | null;
  is_public: boolean;
}

interface PlaylistItem {
  id: string;
  mic_unique_identifier: string;
  notes: string | null;
  added_at: string;
  order_index: number;
  mic_data?: {
    "Open Mic": string;
    "Venue Name": string;
    "Day": string;
    "Start Time": string;
    "Borough": string;
    "Neighborhood": string;
  };
}

export default function Playlists() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { playlists, isLoading: loading, createPlaylist: createPlaylistMutation, updatePlaylist: updatePlaylistMutation, deletePlaylist: deletePlaylistMutation } = useMicPlaylists();
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [editingPlaylist, setEditingPlaylist] = useState<EditingPlaylist | null>(null);
  const [newPlaylist, setNewPlaylist] = useState({
    name: "",
    description: "",
    is_public: false
  });

  const createPlaylist = async () => {
    if (!user || !newPlaylist.name.trim()) return;
    try {
      await createPlaylistMutation({ name: newPlaylist.name, description: newPlaylist.description, isPublic: newPlaylist.is_public });
      setShowCreateDialog(false);
      setNewPlaylist({ name: "", description: "", is_public: false });
      toast({ title: "Playlist created!" });
    } catch (error) {
      toast({ title: "Error", description: "Failed to create playlist", variant: "destructive" });
    }
  };

  const updatePlaylist = async () => {
    if (!editingPlaylist || !editingPlaylist.name.trim()) return;
    try {
      await updatePlaylistMutation({ playlistId: editingPlaylist.id, name: editingPlaylist.name, description: editingPlaylist.description || undefined, isPublic: editingPlaylist.is_public });
      setEditingPlaylist(null);
      toast({ title: "Playlist updated!" });
    } catch (error) {
      toast({ title: "Error", description: "Failed to update playlist", variant: "destructive" });
    }
  };

  const deletePlaylist = async (playlistId: string) => {
    if (!confirm("Are you sure you want to delete this playlist?")) return;
    try {
      await deletePlaylistMutation(playlistId);
      toast({ title: "Playlist deleted" });
    } catch (error) {
      toast({ title: "Error", description: "Failed to delete playlist", variant: "destructive" });
    }
  };

  const openPlaylist = (playlistId: string) => {
    navigate(`/playlists/${playlistId}`);
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#f8f0e1] to-white">
        <div className="max-w-7xl mx-auto px-8 py-10">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Please sign in to access playlists</h1>
            <Button onClick={() => navigate("/auth")}>Sign In</Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#f8f0e1] to-white">
      <PageHeader title="Mic Playlists" subtitle="Create and manage your favorite mic collections" />
      <main className="max-w-7xl mx-auto px-8 pt-28 pb-10">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
              <DialogTrigger asChild>
                  {playlists.length !== 0 ? <Button className="bg-gradient-to-r from-[#0E4898] to-[#5DC8E2] text-white hover:from-[#0E4898]/90 hover:to-[#5DC8E2]/90">
                  <Plus className="w-4 h-4 mr-2" /> Create Your First Playlist</Button> : ""}
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create New Playlist</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium">Name</label>
                    <Input
                      value={newPlaylist.name}
                      onChange={(e) => setNewPlaylist({ ...newPlaylist, name: e.target.value })}
                      placeholder="My Favorite Mics"
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Description (optional)</label>
                    <Textarea
                      value={newPlaylist.description}
                      onChange={(e) => setNewPlaylist({ ...newPlaylist, description: e.target.value })}
                      placeholder="A collection of my favorite open mics..."
                      className="mt-1"
                    />
                  </div>
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="is_public"
                      checked={newPlaylist.is_public}
                      onChange={(e) => setNewPlaylist({ ...newPlaylist, is_public: e.target.checked })}
                      className="rounded"
                    />
                    <label htmlFor="is_public" className="text-sm font-medium">
                      Make this playlist public
                    </label>
                  </div>
                  <div className="flex justify-end space-x-2">
                    <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                      Cancel
                    </Button>
                    <Button 
                      onClick={createPlaylist}
                      disabled={!newPlaylist.name.trim()}
                      className="bg-gradient-to-r from-[#0E4898] to-[#5DC8E2] text-white"
                    >
                      Create Playlist
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Playlists Grid */}
        {loading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#0E4898] mx-auto"></div>
            <p className="mt-2 text-gray-600">Loading playlists...</p>
          </div>
        ) : playlists.length === 0 ? (
          <div className="text-center py-12">
            <Music className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No playlists yet</h3>
            <p className="text-gray-600 mb-6">Create your first playlist to start organizing your favorite mics</p>
            <Button 
              onClick={() => setShowCreateDialog(true)}
              className="bg-gradient-to-r from-[#0E4898] to-[#5DC8E2] text-white"
            >
              <Plus className="w-4 h-4 mr-2" />
              Create Your First Playlist
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {playlists.map((playlist) => (
              <Card key={playlist.id} className="border-[#5DC8E2] bg-white/80 backdrop-blur hover:shadow-lg transition-shadow">
                <CardHeader className="bg-gradient-to-r from-[#0E4898] to-[#5DC8E2] rounded-t-lg">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-white text-lg">{playlist.name}</CardTitle>
                      {playlist.description && (
                        <CardDescription className="text-white/80 mt-1">
                          {playlist.description}
                        </CardDescription>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      {playlist.is_public ? (
                        <Eye className="w-4 h-4 text-white/80" />
                      ) : (
                        <EyeOff className="w-4 h-4 text-white/80" />
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" className="bg-[#FFE8D4] text-gray-700">
                        {playlist.item_count} {playlist.item_count === 1 ? 'mic' : 'mics'}
                      </Badge>
                      {playlist.is_public && (
                        <Badge variant="outline" className="text-xs">
                          Public
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setEditingPlaylist(playlist)}
                        className="text-gray-600 hover:text-gray-800"
                      >
                        <Edit3 className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => deletePlaylist(playlist.id)}
                        className="text-red-600 hover:text-red-800"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                  <div className="text-xs text-gray-500 mb-4">
                    Updated {new Date(playlist.updated_at).toLocaleDateString()}
                  </div>
                  <Button 
                    onClick={() => openPlaylist(playlist.id)}
                    className="w-full bg-gradient-to-r from-[#0E4898] to-[#5DC8E2] text-white hover:from-[#0E4898]/90 hover:to-[#5DC8E2]/90"
                  >
                    Open Playlist
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Edit Playlist Dialog */}
        {editingPlaylist && (
          <Dialog open={!!editingPlaylist} onOpenChange={() => setEditingPlaylist(null)}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Edit Playlist</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Name</label>
                  <Input
                    value={editingPlaylist.name}
                    onChange={(e) => setEditingPlaylist({ ...editingPlaylist, name: e.target.value })}
                    placeholder="Playlist name"
                    className="mt-1"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Description (optional)</label>
                  <Textarea
                    value={editingPlaylist.description || ""}
                    onChange={(e) => setEditingPlaylist({ ...editingPlaylist, description: e.target.value })}
                    placeholder="Playlist description..."
                    className="mt-1"
                  />
                </div>
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="edit_is_public"
                    checked={editingPlaylist.is_public}
                    onChange={(e) => setEditingPlaylist({ ...editingPlaylist, is_public: e.target.checked })}
                    className="rounded"
                  />
                  <label htmlFor="edit_is_public" className="text-sm font-medium">
                    Make this playlist public
                  </label>
                </div>
                <div className="flex justify-end space-x-2">
                  <Button variant="outline" onClick={() => setEditingPlaylist(null)}>
                    Cancel
                  </Button>
                  <Button 
                    onClick={updatePlaylist}
                    disabled={!editingPlaylist.name.trim()}
                    className="bg-gradient-to-r from-[#0E4898] to-[#5DC8E2] text-white"
                  >
                    Update Playlist
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </main>
    </div>
  );
}
