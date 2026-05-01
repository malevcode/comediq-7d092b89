import { useQuery } from "@tanstack/react-query";
import { pb } from "@/integrations/pocketbase/client";
import { OpenMic, MicStatus, MicFrequency, SignupMethod } from "@/types/openMic";

export const useOpenMics = (tableName: "open_mics_historical" = "open_mics_historical") => {
  return useQuery({
    queryKey: ["openMics", tableName],
    queryFn: async (): Promise<OpenMic[]> => {
      const data = await pb.collection(tableName).getFullList({
        filter: 'active = true && status != "pending"',
      });

      if (!data || data.length === 0) return [];

      return data.map((row) => ({
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
        status: (row["status"] as MicStatus) || "verified",
        frequency: (row["frequency"] as MicFrequency) || "weekly",
        verificationCount: row["verification_count"] || 0,
        submissionDate: row["submission_date"] || undefined,
        legacyTag: row["legacy_tag"] || undefined,
        creatorId: row["creator_id"] || undefined,
        signupMethod: (row["signup_method"] as SignupMethod) || undefined,
        signupUrl: row["signup_url"] || undefined,
        frequencyCustomText: row["frequency_custom_text"] || undefined,
        slotsEnabled: row["slots_enabled"] || false,
        slotDurationMinutes: row["slot_duration_minutes"] || 5,
      }));
    },
    staleTime: 10 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    retry: 1,
    retryDelay: 1000,
  });
};
