import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { OpenMic, MicStatus, MicFrequency, SignupMethod } from "@/types/openMic";

const CACHE_KEY = "comediq_open_mics_v1";
const CACHE_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

function loadCached(): OpenMic[] | null {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const { data, savedAt } = JSON.parse(raw);
    if (Date.now() - savedAt > CACHE_TTL_MS) return null;
    return data as OpenMic[];
  } catch {
    return null;
  }
}

function saveCache(data: OpenMic[]) {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify({ data, savedAt: Date.now() }));
  } catch {}
}

export const useOpenMics = (tableName: "open_mics_historical" = "open_mics_historical") => {
  const cached = loadCached();

  return useQuery({
    queryKey: ["openMics", tableName],
    queryFn: async (): Promise<OpenMic[]> => {
      console.log(`Fetching open mics from Supabase table: ${tableName}...`);
      let data: unknown[], error: unknown;
      try {
        const result = await supabase.from(tableName).select("*").eq("active", true).neq("status", "pending");
        data = result.data ?? [];
        error = result.error;
      } catch (e) {
        if (cached) return cached;
        throw e;
      }

      if (error) {
        console.error("Supabase error:", error);
        if (cached) return cached;
        throw error;
      }

      if (error) {
        console.error("Supabase error:", error);
        throw error;
      }

      console.log("Number of records fetched:", data?.length || 0);

      if (!data || data.length === 0) {
        console.warn(`No data returned from ${tableName} table`);
        return cached ?? [];
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

      console.log("Final mapped data count:", mappedData.length);
      saveCache(mappedData);
      return mappedData;
    },
    initialData: cached ?? undefined,
    staleTime: 10 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    retry: 1,
    retryDelay: 1000,
  });
};
