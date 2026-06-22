import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { OpenMic } from "@/types/openMic";

const CACHE_KEY = 'comediq_top_rated_v1';
const CACHE_FRESH_MS = 4 * 60 * 60 * 1000;

function loadCached(): (OpenMic & { likeCount: number })[] | null {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const { data, savedAt } = JSON.parse(raw);
    if (Date.now() - savedAt > CACHE_FRESH_MS) return null;
    return data;
  } catch {
    return null;
  }
}

function saveCache(data: (OpenMic & { likeCount: number })[]) {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify({ data, savedAt: Date.now() }));
  } catch {}
}

export const useTopRatedMics = () => {
  const cached = loadCached();

  return useQuery({
    queryKey: ['topRatedMics'],
    queryFn: async () => {
      const fresh = loadCached();
      if (fresh && fresh.length > 0) return fresh;

      const { data: likeCounts, error: likeError } = await supabase
        .from('mic_like_counts')
        .select('mic_unique_identifier, likes')
        .order('likes', { ascending: false })
        .limit(10);

      if (likeError) throw likeError;
      if (!likeCounts || likeCounts.length === 0) return [];

      const micIds = likeCounts.map(lc => lc.mic_unique_identifier);
      const { data: mics, error: micsError } = await supabase
        .from('open_mics_historical')
        .select('unique_identifier,open_mic,day,start_time,venue_name,borough,neighborhood,cost')
        .in('unique_identifier', micIds)
        .eq('active', true);

      if (micsError) throw micsError;

      const mappedMics = mics?.map((row: any) => {
        const likeCount = likeCounts.find(lc => lc.mic_unique_identifier === row.unique_identifier);
        return {
          id: row.unique_identifier,
          openMic: row.open_mic || "",
          day: row.day || "",
          startTime: row.start_time || "",
          latestEndTime: "",
          venueName: row.venue_name || "",
          borough: row.borough?.trim() || "",
          neighborhood: row.neighborhood || "",
          location: "",
          cost: row.cost || "",
          stageTime: "",
          signUpInstructions: "",
          hosts: "",
          instagramHandle: "",
          lastVerified: "",
          uniqueIdentifier: row.unique_identifier || "",
          city: "",
          signupEnabled: false,
          otherRules: "",
          status: "verified" as const,
          frequency: "weekly" as const,
          slotsEnabled: false,
          slotDurationMinutes: 5,
          likeCount: likeCount?.likes || 0,
        };
      }) || [];

      const sorted = mappedMics.sort((a, b) => b.likeCount - a.likeCount);
      if (sorted.length > 0) saveCache(sorted);
      return sorted;
    },
    placeholderData: cached ?? undefined,
    staleTime: 4 * 60 * 60 * 1000,
    gcTime: 24 * 60 * 60 * 1000,
    refetchOnWindowFocus: false,
  });
};
