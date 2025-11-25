
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { OpenMic } from "@/types/openMic";

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
      
      // Map the database columns to our OpenMic interface
      const mappedData = filteredData.map((row: unknown) => {
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
          signupEnabled: row["signup_enabled"] || false
        };
        return mapped;
      });

      console.log("Final mapped data count:", mappedData.length);
      return mappedData;
    },
    staleTime: 10 * 60 * 1000, // 10 minutes - data is fresh for 10 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes - keep unused data in cache for 30 minutes
    refetchOnWindowFocus: false, // Don't refetch when window regains focus
    refetchOnMount: false, // Don't refetch when component mounts if data is fresh
    retry: 1,
    retryDelay: 1000,
  });
};
