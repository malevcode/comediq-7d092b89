
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { OpenMic, MicStatus, MicFrequency, SignupMethod } from "@/types/openMic";

export const useOpenMics = (tableName: 'open_mics_historical' = 'open_mics_historical') => {
  return useQuery({
    queryKey: ["openMics", tableName],
    queryFn: async (): Promise<OpenMic[]> => {
      console.log(`Fetching open mics from Supabase table: ${tableName}...`);
      const { data, error } = await supabase
        .from(tableName)
        .select("*");

      if (error) {
        console.error("Supabase error:", error);
        throw error;
      }

      console.log("Number of records fetched:", data?.length || 0);

      if (!data || data.length === 0) {
        console.warn(`No data returned from ${tableName} table`);
        return [];
      }

      const filteredData = data.filter((row: unknown) => row["active"] === true || row["active"] === 1);
      console.log("Filtered data count:", filteredData.length);
      
      // Also filter out pending mics from public view
      const publicData = filteredData.filter((row: unknown) => {
        const status = row["status"] as string | null;
        return status !== 'pending'; // Show trial and verified, hide pending
      });
      
      const mappedData = publicData.map((row: unknown) => {
        const mapped: OpenMic = {
          id: row["unique_identifier"],
          openMic: row["open_mic"] || "",
          day: row["day"] || "",
          startTime: row["start_time"] || "",
          latestEndTime: row["latest_end_time"] || "",
          venueName: row["venue_name"] || "",
          borough: row["borough"]?.trim() || "",
          neighborhood: row["neighborhood"] || "",
          location: row["location"] || "",
          venueType: row["venue_type"] || "",
          cost: row["cost"] || "",
          stageTime: row["stage_time"] || "",
          signUpInstructions: row["sign_up_instructions"] || "",
          hosts: row["hosts_organizers"] || "",
          instagramHandle: row["changes_updates"] || "",
          lastVerified: row["last_verified"] || "",
          uniqueIdentifier: row["unique_identifier"] || "",
          city: row["city"] || "",
          signupEnabled: row["signup_enabled"] || false,
          otherRules: row["other_rules"] || "",
          coverImageUrl: row["cover_image_url"] || undefined,
          // New fields
          status: (row["status"] as MicStatus) || 'verified',
          frequency: (row["frequency"] as MicFrequency) || 'weekly',
          verificationCount: row["verification_count"] || 0,
          submissionDate: row["submission_date"] || undefined,
          legacyTag: row["legacy_tag"] || undefined,
          creatorId: row["creator_id"] || undefined,
          signupMethod: (row["signup_method"] as SignupMethod) || undefined,
          signupUrl: row["signup_url"] || undefined,
          slotsEnabled: row["slots_enabled"] || false,
          slotDurationMinutes: row["slot_duration_minutes"] || 5,
          pricePerSlot: row["price_per_slot"] || undefined,
        };
        return mapped;
      });

      console.log("Final mapped data count:", mappedData.length);
      return mappedData;
    },
    staleTime: 10 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    retry: 1,
    retryDelay: 1000,
  });
};
