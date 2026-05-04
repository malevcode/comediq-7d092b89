import { useQuery } from "@tanstack/react-query";
import { pb } from "@/integrations/pocketbase/client";
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

function mapRow(row: Record<string, unknown>): OpenMic {
  return {
    id: row["unique_identifier"] as string,
    openMic: (row["open_mic"] as string) || "",
    day: (row["day"] as string) || "",
    startTime: (row["start_time"] as string) || "",
    latestEndTime: (row["latest_end_time"] as string) || "",
    venueName: (row["venue_name"] as string) || "",
    borough: ((row["borough"] as string) || "").trim(),
    neighborhood: (row["neighborhood"] as string) || "",
    location: (row["location"] as string) || "",
    venueType: (row["venue_type"] as string) || "",
    cost: (row["cost"] as string) || "",
    stageTime: (row["stage_time"] as string) || "",
    signUpInstructions: (row["sign_up_instructions"] as string) || "",
    hosts: (row["hosts_organizers"] as string) || "",
    instagramHandle: (row["changes_updates"] as string) || "",
    lastVerified: (row["last_verified"] as string) || "",
    uniqueIdentifier: (row["unique_identifier"] as string) || "",
    city: (row["city"] as string) || "",
    signupEnabled: (row["signup_enabled"] as boolean) || false,
    otherRules: (row["other_rules"] as string) || "",
    coverImageUrl: (row["cover_image_url"] as string) || undefined,
    status: (row["status"] as MicStatus) || "verified",
    frequency: (row["frequency"] as MicFrequency) || "weekly",
    verificationCount: (row["verification_count"] as number) || 0,
    submissionDate: (row["submission_date"] as string) || undefined,
    legacyTag: (row["legacy_tag"] as string) || undefined,
    creatorId: (row["creator_id"] as string) || undefined,
    signupMethod: (row["signup_method"] as SignupMethod) || undefined,
    signupUrl: (row["signup_url"] as string) || undefined,
    frequencyCustomText: (row["frequency_custom_text"] as string) || undefined,
    slotsEnabled: (row["slots_enabled"] as boolean) || false,
    slotDurationMinutes: (row["slot_duration_minutes"] as number) || 5,
  };
}

export const useOpenMics = (tableName: "open_mics_historical" = "open_mics_historical") => {
  const cached = loadCached();

  return useQuery({
    queryKey: ["openMics", tableName],
    queryFn: async (): Promise<OpenMic[]> => {
      let rows: Record<string, unknown>[];
      try {
        rows = await pb.collection(tableName).getFullList({
          filter: 'active = true && status != "pending"',
          sort: "+day,+start_time",
        }) as Record<string, unknown>[];
      } catch (e) {
        if (cached) return cached;
        throw e;
      }

      if (!rows || rows.length === 0) {
        return cached ?? [];
      }

      const mappedData = rows.map(mapRow);
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
