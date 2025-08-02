
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
          openMic: row["Open Mic"] || row["open_mic"] || "",
          day: row["Day"] || row["day"] || "",
          startTime: row["Start Time"] || row["start_time"] || "",
          latestEndTime: row["Latest End Time"] || row["latest_end_time"] || "",
          venueName: row["Venue Name"] || row["venue_name"] || "",
          borough: (row["Borough"] || row["borough"])?.trim() || "",
          neighborhood: row["Neighborhood"] || row["neighborhood"] || "",
          location: row["Location"] || row["location"] || "",
          venueType: row["Venue type"] || row["venue_type"] || "",
          cost: row["Cost"] || row["cost"] || "",
          stageTime: row["Stage time"] || row["stage_time"] || "",
          signUpInstructions: row["Sign-Up Instructions"] || row["signup_instructions"] || "",
          hosts: row["Host(s) / Organizer"] || row["hosts"] || "",
          instagramHandle: row["Changes/updates"] || row["instagram_handle"] || "",
          lastVerified: row["Last verified"] || row["last_verified"] || "",
          otherRules: row["Other Rules"] || row["other_rules"] || "",
          uniqueIdentifier: row["unique_identifier"] || ""
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
