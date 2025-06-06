
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { OpenMic } from "@/types/openMic";

export const useOpenMics = () => {
  return useQuery({
    queryKey: ["openMics"],
    queryFn: async (): Promise<OpenMic[]> => {
      console.log("Fetching open mics from Supabase...");
      
      try {
        const { data, error } = await supabase
          .from("open_mics")
          .select("*");

        if (error) {
          console.error("Supabase error:", error);
          throw error;
        }

        console.log("Successfully fetched open mics:", data?.length || 0);

        // Map the database columns to our OpenMic interface
        return data?.map((row: any) => ({
          openMic: row["Open Mic"] || "",
          day: row["Day"] || "",
          startTime: row["Start Time"] || "",
          latestEndTime: row["Latest End Time"] || "",
          venueName: row["Venue Name"] || "",
          borough: row["Borough"] || "",
          neighborhood: row["Neighborhood"] || "",
          location: row["Location"] || "",
          venueType: row["Venue type"] || "",
          cost: row["Cost"] || "",
          stageTime: row["Stage time"] || "",
          signUpInstructions: row["Sign-Up Instructions"] || "",
          hosts: row["Host(s) / Organizer"] || "",
          changesUpdates: row["Changes/updates"] || "",
          lastVerified: row["Last verified"] || "",
          otherRules: row["Other Rules"] || ""
        })) || [];
      } catch (err) {
        console.error("Network or other error:", err);
        throw err;
      }
    },
    retry: 1,
    retryDelay: 1000,
  });
};
