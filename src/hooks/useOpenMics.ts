import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { OpenMic, MicStatus, MicFrequency, SignupMethod } from "@/types/openMic";

const LS_CACHE_KEY = "comediq_mics_v1";
const LS_CACHE_TTL = 2 * 60 * 60 * 1000; // 2 hours

const SELECTED_COLUMNS = [
  "unique_identifier", "open_mic", "day", "start_time", "latest_end_time",
  "venue_name", "borough", "neighborhood", "location", "venue_type",
  "cost", "stage_time", "sign_up_instructions", "hosts_organizers",
  "changes_updates", "last_verified", "city", "signup_enabled", "other_rules",
  "cover_image_url", "status", "frequency", "verification_count",
  "submission_date", "legacy_tag", "creator_id", "signup_method",
  "signup_url", "frequency_custom_text", "slots_enabled", "slot_duration_minutes",
].join(",");

function readLocalCache(): OpenMic[] | null {
  try {
    const raw = localStorage.getItem(LS_CACHE_KEY);
    if (!raw) return null;
    const { data, timestamp } = JSON.parse(raw);
    if (Date.now() - timestamp > LS_CACHE_TTL) return null;
    return data as OpenMic[];
  } catch {
    return null;
  }
}

function writeLocalCache(data: OpenMic[]) {
  try {
    localStorage.setItem(LS_CACHE_KEY, JSON.stringify({ data, timestamp: Date.now() }));
  } catch {
    // localStorage quota exceeded — silently skip
  }
}

export const useOpenMics = (tableName: "open_mics_historical" = "open_mics_historical") => {
  return useQuery({
    queryKey: ["openMics", tableName],
    queryFn: async (): Promise<OpenMic[]> => {
      const cached = readLocalCache();
      if (cached) return cached;

      const { data, error } = await supabase
        .from(tableName)
        .select(SELECTED_COLUMNS)
        .eq("active", true)
        .neq("status", "pending");

      if (error) {
        console.error("Supabase error:", error);
        throw error;
      }

      if (!data || data.length === 0) {
        return [];
      }

      const mappedData = data.map((row: unknown) => {
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
        };
        return mapped;
      });

      writeLocalCache(mappedData);
      return mappedData;
    },
    staleTime: LS_CACHE_TTL,
    gcTime: LS_CACHE_TTL * 2,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    retry: 1,
    retryDelay: 1000,
  });
};
