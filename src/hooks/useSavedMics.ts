import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchSavedMics, saveMic, unsaveMic, SavedMic } from "@/api/pb/savedMics";
import { useAuth } from "@/contexts/AuthContext";

export type { SavedMic };

export function useSavedMics() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: savedMics = [], isLoading, error } = useQuery({
    queryKey: ["saved-mics", user?.id],
    queryFn: () => fetchSavedMics(user!.id),
    enabled: !!user,
    staleTime: 60 * 1000,
  });

  const isMicSaved = (micUniqueIdentifier: string) =>
    savedMics.some(s => s.mic_unique_identifier === micUniqueIdentifier);

  const toggleSaveMutation = useMutation({
    mutationFn: async (micUniqueIdentifier: string) => {
      if (!user) throw new Error("Must be logged in to save mics");
      if (isMicSaved(micUniqueIdentifier)) {
        await unsaveMic(user.id, micUniqueIdentifier);
        return { saved: false };
      } else {
        await saveMic(user.id, micUniqueIdentifier);
        return { saved: true };
      }
    },
    onMutate: async (micUniqueIdentifier) => {
      await queryClient.cancelQueries({ queryKey: ["saved-mics", user?.id] });
      const previous = queryClient.getQueryData(["saved-mics", user?.id]);
      queryClient.setQueryData(["saved-mics", user?.id], (old: SavedMic[] = []) => {
        const saved = old.some(s => s.mic_unique_identifier === micUniqueIdentifier);
        return saved
          ? old.filter(s => s.mic_unique_identifier !== micUniqueIdentifier)
          : [...old, { id: 'tmp-' + Date.now(), user_id: user?.id || '', mic_unique_identifier: micUniqueIdentifier, created_at: new Date().toISOString() }];
      });
      return { previous };
    },
    onError: (_err, _mic, context) => {
      if (context?.previous) queryClient.setQueryData(["saved-mics", user?.id], context.previous);
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: ["saved-mics", user?.id] }),
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
