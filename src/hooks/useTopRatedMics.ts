import { useQuery } from "@tanstack/react-query";
import { OpenMic } from "@/types/openMic";

const CACHE_KEY = 'comediq_top_rated_v1';

function loadCached(): (OpenMic & { likeCount: number })[] | null {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const { data } = JSON.parse(raw);
    return data;
  } catch {
    return null;
  }
}

// Supabase calls disabled — serve from localStorage only
export const useTopRatedMics = () => {
  const cached = loadCached();

  return useQuery({
    queryKey: ['topRatedMics'],
    queryFn: async () => cached ?? [],
    placeholderData: cached ?? undefined,
    staleTime: Infinity,
    gcTime: Infinity,
    refetchOnWindowFocus: false,
  });
};
