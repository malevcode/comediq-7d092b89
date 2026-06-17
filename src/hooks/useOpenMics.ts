import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { OpenMic, MicStatus, MicFrequency, SignupMethod } from "@/types/openMic";

const CACHE_KEY = "comediq_open_mics_v2";
const CACHE_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days
const CACHE_FRESH_MS = 24 * 60 * 60 * 1000; // 24 hours — open mic schedules do not need per-session refetches

function loadCached(maxAge: number = CACHE_TTL_MS): OpenMic[] | null {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const { data, savedAt } = JSON.parse(raw);
    if (Date.now() - savedAt > maxAge) return null;
    return data as OpenMic[];
  } catch {
    return null;
  }
}

function saveCache(data: OpenMic[]) {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify({ data, savedAt: Date.now() }));
  } catch {
    // Ignore cache write failures; Supabase remains the source of truth.
  }
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
    latitude: (row["latitude"] as number | null) ?? null,
    longitude: (row["longitude"] as number | null) ?? null,
    geocodedAt: (row["geocoded_at"] as string | null) ?? null,
    geocodingProvider: (row["geocoding_provider"] as string | null) ?? null,
    geocodingScore: (row["geocoding_score"] as number | null) ?? null,
    geocodingMatchAddress: (row["geocoding_match_address"] as string | null) ?? null,
  };
}

async function fetchFromSupabase(tableName: string): Promise<OpenMic[]> {
  // Fetch the whole public mic catalog once, then let search/filter/map interactions run in memory.
  const pageSize = 1000;
  let from = 0;
  const all: Record<string, unknown>[] = [];
  // Cap at a few pages defensively
  for (let i = 0; i < 5; i++) {
    const { data, error } = await supabase
      .from(tableName)
      .select("unique_identifier,open_mic,day,start_time,latest_end_time,venue_name,borough,neighborhood,location,venue_type,cost,stage_time,sign_up_instructions,hosts_organizers,changes_updates,last_verified,city,signup_enabled,other_rules,cover_image_url,status,frequency,verification_count,submission_date,legacy_tag,creator_id,signup_method,signup_url,frequency_custom_text,slots_enabled,slot_duration_minutes,latitude,longitude,geocoded_at,geocoding_provider,geocoding_score,geocoding_match_address")
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
      // Skip the DB call entirely while the local browser copy is fresh.
      const fresh = loadCached(CACHE_FRESH_MS);
      if (fresh && fresh.length > 0) return fresh;

      try {
        const rows = await fetchFromSupabase(tableName);
        if (rows.length > 0) {
          saveCache(rows);
          return rows;
        }
      } catch (e) {
        console.warn("[useOpenMics] Supabase fetch failed:", e);
      }

      // Fallback: stale localStorage data (up to 7 days old).
      if (cached && cached.length > 0) return cached;

      throw new Error("Mic data unavailable");
    },
    placeholderData: cached ?? undefined,
    staleTime: CACHE_FRESH_MS,
    gcTime: CACHE_FRESH_MS,
    refetchOnMount: false,
    refetchOnReconnect: false,
    refetchOnWindowFocus: false,
    retry: 1,
    retryDelay: 1500,
  });
};
