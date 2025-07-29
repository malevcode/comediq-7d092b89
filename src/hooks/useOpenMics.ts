
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
          openMic: row["Open Mic"] || "",
          day: row["Day"] || "",
          startTime: row["Start Time"] || "",
          latestEndTime: row["Latest End Time"] || "",
          venueName: row["Venue Name"] || "",
          borough: row["Borough"]?.trim() || "",
          neighborhood: row["Neighborhood"] || "",
          location: row["Location"] || "",
          venueType: row["Venue type"] || "",
          cost: row["Cost"] || "",
          stageTime: row["Stage time"] || "",
          signUpInstructions: row["Sign-Up Instructions"] || "",
          hosts: row["Host(s) / Organizer"] || "",
          changesUpdates: row["Changes/updates"] || "",
          lastVerified: row["Last verified"] || "",
          otherRules: row["Other Rules"] || "",
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
