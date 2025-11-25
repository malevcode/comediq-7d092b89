import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { OpenMic } from "@/types/openMic";

export const useTopRatedMics = () => {
  return useQuery({
    queryKey: ['topRatedMics'],
    queryFn: async () => {
      // Get mics with the most likes
      const { data: likeCounts, error: likeError } = await supabase
        .from('mic_like_counts')
        .select('mic_unique_identifier, likes')
        .order('likes', { ascending: false })
        .limit(10);

      if (likeError) throw likeError;

      if (!likeCounts || likeCounts.length === 0) {
        return [];
      }

      // Fetch full mic data for these top mics
      const micIds = likeCounts.map(lc => lc.mic_unique_identifier);
      const { data: mics, error: micsError } = await supabase
        .from('open_mics_historical')
        .select('*')
        .in('unique_identifier', micIds)
        .eq('active', true);

      if (micsError) throw micsError;

      // Map to OpenMic format and attach like counts
      const mappedMics = mics?.map((row: any) => {
        const likeCount = likeCounts.find(lc => lc.mic_unique_identifier === row.unique_identifier);
        return {
          id: row.unique_identifier,
          openMic: row.open_mic || "",
          day: row.day || "",
          startTime: row.start_time || "",
          latestEndTime: row.latest_end_time || "",
          venueName: row.venue_name || "",
          borough: row.borough?.trim() || "",
          neighborhood: row.neighborhood || "",
          location: row.location || "",
          venueType: row.venue_type || "",
          cost: row.cost || "",
          stageTime: row.stage_time || "",
          signUpInstructions: row.sign_up_instructions || "",
          hosts: row.hosts_organizers || "",
          instagramHandle: row.changes_updates || "",
          lastVerified: row.last_verified || "",
          uniqueIdentifier: row.unique_identifier || "",
          city: row.city || "",
          signupEnabled: row.signup_enabled || false,
          likeCount: likeCount?.likes || 0
        };
      }) || [];

      // Sort by like count
      return mappedMics.sort((a, b) => b.likeCount - a.likeCount);
    },
    staleTime: 15 * 60 * 1000, // 15 minutes
    gcTime: 30 * 60 * 1000,
  });
};
