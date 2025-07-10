
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { OpenMic } from "@/types/openMic";

export const useOpenMics = () => {
  return useQuery({
    queryKey: ["openMics"],
    queryFn: async (): Promise<OpenMic[]> => {
      console.log("Fetching open mics from Supabase...");
      
      const { data, error } = await supabase
        .from("open_mics_july")
        .select("*");

      if (error) {
        console.error("Supabase error:", error);
        throw error;
      }

      console.log("Raw data from Supabase:", data);
      console.log("Number of records fetched:", data?.length || 0);

      if (!data || data.length === 0) {
        console.warn("No data returned from open_mics table");
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
    retry: 1,
    retryDelay: 1000,
  });
};
