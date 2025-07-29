
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { OpenMic } from "@/types/openMic";

export const useOpenMics = (tableName: 'open_mics_active' | 'open_mics_historical' = 'open_mics_active') => {
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

      console.log("Raw data from Supabase:", data);
      console.log("Number of records fetched:", data?.length || 0);

      if (!data || data.length === 0) {
        console.warn(`No data returned from ${tableName} table`);
        return [];
      }

      // Map the database columns to our OpenMic interface
      const mappedData = data.map((row: any) => {
        const mapped: OpenMic = {
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
          signUpInstructions: row["signup_instructions"] || "",
          hosts: row["hosts"] || "",
          changesUpdates: row["instagram_handle"] || "",
          lastVerified: row["last_verified"] || "",
          otherRules: row["other_rules"] || "",
          uniqueIdentifier: row["unique_identifier"] || ""
        };
        return mapped;
      });

      console.log("Final mapped data count:", mappedData.length);
      return mappedData;
    },
    retry: 1,
    retryDelay: 1000,
  });
};
