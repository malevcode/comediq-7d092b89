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

async function fetchFromSupabase(tableName: string): Promise<OpenMic[]> {
  // Page through Supabase since the default cap is 1000 (we currently have ~400)
  const pageSize = 1000;
  let from = 0;
  const all: Record<string, unknown>[] = [];
  // Cap at a few pages defensively
  for (let i = 0; i < 5; i++) {
    const { data, error } = await (supabase as any)
      .from(tableName)
      .select("*")
      .eq("active", true)
      .neq("status", "pending")
      .range(from, from + pageSize - 1);
    if (error) throw error;
    if (!data || data.length === 0) break;
    all.push(...(data as Record<string, unknown>[]));
    if (data.length < pageSize) break;
    from += pageSize;
  }
  return all.map(mapRow);
}

export const useOpenMics = (tableName: "open_mics_historical" = "open_mics_historical") => {
  const cached = loadCached();

  return useQuery({
    queryKey: ["openMics", tableName],
    queryFn: async (): Promise<OpenMic[]> => {
      try {
        const rows = await fetchFromSupabase(tableName);
        if (rows.length > 0) {
          saveCache(rows);
          return rows;
        }
      } catch (e) {
        console.warn("[useOpenMics] Supabase fetch failed:", e);
      }

      // Fallback: localStorage cache
      if (cached && cached.length > 0) return cached;

      throw new Error("Mic data unavailable");
    },
    placeholderData: cached ?? undefined,
    staleTime: 10 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
    refetchOnWindowFocus: false,
    retry: 1,
    retryDelay: 1500,
  });
};
