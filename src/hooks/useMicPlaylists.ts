import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface MicPlaylist {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  is_public: boolean;
  created_at: string;
  updated_at: string;
  item_count?: number;
}

export interface MicPlaylistItem {
  id: string;
  playlist_id: string;
  mic_unique_identifier: string;
  notes: string | null;
  order_index: number;
  added_at: string;
}

export function useMicPlaylists() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Fetch all playlists for current user
  const { data: playlists = [], isLoading, error } = useQuery({
    queryKey: ["mic-playlists", user?.id],
    queryFn: async () => {
      if (!user) return [];

      const { data: playlistsData, error: playlistsError } = await supabase
        .from("mic_playlists")
        .select("*")
        .eq("user_id", user.id)
        .order("updated_at", { ascending: false });

      if (playlistsError) throw playlistsError;

      // Get item counts for each playlist
      const playlistIds = (playlistsData || []).map(p => p.id);
      const { data: itemsData } = await supabase
        .from("mic_playlist_items")
        .select("playlist_id")
        .in("playlist_id", playlistIds);

      const countMap = new Map<string, number>();
      (itemsData || []).forEach(item => {
        countMap.set(item.playlist_id, (countMap.get(item.playlist_id) || 0) + 1);
      });

      return (playlistsData || []).map(playlist => ({
        ...playlist,
        item_count: countMap.get(playlist.id) || 0
      })) as MicPlaylist[];
    },
    enabled: !!user,
    staleTime: 15 * 60 * 1000,
  });

  // Create playlist mutation
  const createPlaylistMutation = useMutation({
    mutationFn: async ({ name, description, isPublic }: { name: string; description?: string; isPublic?: boolean }) => {
      if (!user) throw new Error("Must be logged in");
      if (name.length > 100) throw new Error("Name must be 100 characters or less");

      const { data, error } = await supabase
        .from("mic_playlists")
        .insert({
          user_id: user.id,
          name: name.trim(),
          description: description?.trim() || null,
          is_public: isPublic || false
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["mic-playlists", user?.id] });
    }
  });

  // Update playlist mutation
  const updatePlaylistMutation = useMutation({
    mutationFn: async ({ playlistId, name, description, isPublic }: { 
      playlistId: string; 
      name?: string; 
      description?: string; 
      isPublic?: boolean 
    }) => {
      if (!user) throw new Error("Must be logged in");

      const updates: any = {};
      if (name !== undefined) updates.name = name.trim();
      if (description !== undefined) updates.description = description.trim() || null;
      if (isPublic !== undefined) updates.is_public = isPublic;

      const { data, error } = await supabase
        .from("mic_playlists")
        .update(updates)
        .eq("id", playlistId)
        .eq("user_id", user.id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["mic-playlists", user?.id] });
    }
  });

  // Delete playlist mutation
  const deletePlaylistMutation = useMutation({
    mutationFn: async (playlistId: string) => {
      if (!user) throw new Error("Must be logged in");

      const { error } = await supabase
        .from("mic_playlists")
        .delete()
        .eq("id", playlistId)
        .eq("user_id", user.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["mic-playlists", user?.id] });
    }
  });

  // Add mic to playlist mutation
  const addToPlaylistMutation = useMutation({
    mutationFn: async ({ playlistId, micUniqueIdentifier, notes }: { 
      playlistId: string; 
      micUniqueIdentifier: string;
      notes?: string;
    }) => {
      if (!user) throw new Error("Must be logged in");

      // Get current max order_index
      const { data: existingItems } = await supabase
        .from("mic_playlist_items")
        .select("order_index")
        .eq("playlist_id", playlistId)
        .order("order_index", { ascending: false })
        .limit(1);

      const nextOrderIndex = (existingItems?.[0]?.order_index ?? -1) + 1;

      const { data, error } = await supabase
        .from("mic_playlist_items")
        .insert({
          playlist_id: playlistId,
          mic_unique_identifier: micUniqueIdentifier,
          notes: notes?.trim() || null,
          order_index: nextOrderIndex
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["mic-playlists", user?.id] });
      queryClient.invalidateQueries({ queryKey: ["playlist-items"] });
    }
  });

  // Remove mic from playlist mutation
  const removeFromPlaylistMutation = useMutation({
    mutationFn: async ({ playlistId, micUniqueIdentifier }: { playlistId: string; micUniqueIdentifier: string }) => {
      if (!user) throw new Error("Must be logged in");

      const { error } = await supabase
        .from("mic_playlist_items")
        .delete()
        .eq("playlist_id", playlistId)
        .eq("mic_unique_identifier", micUniqueIdentifier);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["mic-playlists", user?.id] });
      queryClient.invalidateQueries({ queryKey: ["playlist-items"] });
    }
  });

  return {
    playlists,
    isLoading,
    error,
    createPlaylist: createPlaylistMutation.mutateAsync,
    updatePlaylist: updatePlaylistMutation.mutateAsync,
    deletePlaylist: deletePlaylistMutation.mutateAsync,
    addToPlaylist: addToPlaylistMutation.mutateAsync,
    removeFromPlaylist: removeFromPlaylistMutation.mutateAsync,
    isCreating: createPlaylistMutation.isPending,
    isUpdating: updatePlaylistMutation.isPending,
  };
}

// Hook for fetching items in a specific playlist
export function usePlaylistItems(playlistId: string) {
  const { user } = useAuth();

  const { data: items = [], isLoading, error } = useQuery({
    queryKey: ["playlist-items", playlistId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("mic_playlist_items")
        .select("*")
        .eq("playlist_id", playlistId)
        .order("order_index", { ascending: true });

      if (error) throw error;
      return data as MicPlaylistItem[];
    },
    enabled: !!playlistId && !!user,
    staleTime: 10 * 60 * 1000,
  });

  return { items, isLoading, error };
}
