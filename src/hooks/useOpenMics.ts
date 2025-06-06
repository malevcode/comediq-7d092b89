
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { OpenMic } from "@/types/openMic";

export const useOpenMics = () => {
  return useQuery({
    queryKey: ["openMics"],
    queryFn: async (): Promise<OpenMic[]> => {
      console.log("Fetching open mics from Supabase...");
      
      try {
        // Check if we can access the table at all
        console.log("Testing basic table access...");
        const { count, error: countError } = await supabase
          .from("open_mics")
          .select("*", { count: 'exact', head: true });
          
        console.log("Table count result:", { count, error: countError });
        
        // Try to get schema info
        const { data: schemaData, error: schemaError } = await supabase
          .rpc('pg_get_tabledef', {
            in_schema: 'public',
            in_table: 'open_mics'
          })
          .single();
          
        console.log("Schema check result:", { data: schemaData, error: schemaError });

        // Now try the actual query
        const { data, error } = await supabase
          .from("open_mics")
          .select("*");

        console.log("Main query result:", { data, error, dataLength: data?.length });

        if (error) {
          console.error("Supabase error:", error);
          throw error;
        }

        console.log("Raw data from Supabase:", data);
        console.log("Number of records fetched:", data?.length || 0);
        
        if (data && data.length > 0) {
          console.log("First record structure:", Object.keys(data[0]));
          console.log("First record sample:", data[0]);
        }

        // If no data, return empty array
        if (!data || data.length === 0) {
          console.warn("No data returned from open_mics table");
          return [];
        }

        // Map the database columns to our OpenMic interface
        // Database columns have spaces and are case-sensitive
        const mappedData = data.map((row: any) => {
          const mapped: OpenMic = {
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
          };
          
          return mapped;
        });

        console.log("Final mapped data count:", mappedData.length);
        console.log("Sample mapped record:", mappedData[0]);
        return mappedData;
      } catch (err) {
        console.error("Network or other error:", err);
        throw err;
      }
    },
    retry: 1,
    retryDelay: 1000,
  });
};
