import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface SavedMic {
  id: string;
  user_id: string;
  mic_unique_identifier: string;
  created_at: string;
}

export function useSavedMics() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Fetch all saved mics for current user
  const { data: savedMics = [], isLoading, error } = useQuery({
    queryKey: ["saved-mics", user?.id],
    queryFn: async () => {
      if (!user) return [];

      const { data, error } = await supabase
        .from("saved_mics")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as SavedMic[];
    },
    enabled: !!user,
    staleTime: 60 * 1000, // 1 minute
  });

  // Check if a specific mic is saved
  const isMicSaved = (micUniqueIdentifier: string) => {
    return savedMics.some(s => s.mic_unique_identifier === micUniqueIdentifier);
  };

  // Toggle save mutation
  const toggleSaveMutation = useMutation({
    mutationFn: async (micUniqueIdentifier: string) => {
      if (!user) throw new Error("Must be logged in to save mics");

      const isSaved = isMicSaved(micUniqueIdentifier);

      if (isSaved) {
        // Remove save
        const { error } = await supabase
          .from("saved_mics")
          .delete()
          .eq("user_id", user.id)
          .eq("mic_unique_identifier", micUniqueIdentifier);

        if (error) throw error;
        return { saved: false };
      } else {
        // Add save
        const { error } = await supabase
          .from("saved_mics")
          .insert({
            user_id: user.id,
            mic_unique_identifier: micUniqueIdentifier
          });

        if (error) throw error;
        return { saved: true };
      }
    },
    onMutate: async (micUniqueIdentifier) => {
      // Optimistic update
      await queryClient.cancelQueries({ queryKey: ["saved-mics", user?.id] });
      const previousSaved = queryClient.getQueryData(["saved-mics", user?.id]);

      queryClient.setQueryData(["saved-mics", user?.id], (old: SavedMic[] = []) => {
        const isSaved = old.some(s => s.mic_unique_identifier === micUniqueIdentifier);
        if (isSaved) {
          return old.filter(s => s.mic_unique_identifier !== micUniqueIdentifier);
        } else {
          return [...old, {
            id: 'temp-' + Date.now(),
            user_id: user?.id || '',
            mic_unique_identifier: micUniqueIdentifier,
            created_at: new Date().toISOString()
          }];
        }
      });

      return { previousSaved };
    },
    onError: (err, micUniqueIdentifier, context) => {
      // Rollback on error
      if (context?.previousSaved) {
        queryClient.setQueryData(["saved-mics", user?.id], context.previousSaved);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["saved-mics", user?.id] });
    }
  });

  return {
    savedMics,
    isLoading,
    error,
    isMicSaved,
    toggleSave: toggleSaveMutation.mutateAsync,
    isToggling: toggleSaveMutation.isPending,
  };
}
