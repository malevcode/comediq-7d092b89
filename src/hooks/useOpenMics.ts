import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { OpenMic } from "@/types/openMic";
import {
  hasUsableCoordinateData,
  loadCachedOpenMics,
  saveCachedOpenMics,
} from "@/utils/micDataCache";

const LIVE_COLUMNS = [
  "unique_identifier",
  "open_mic",
  "day",
  "start_time",
  "latest_end_time",
  "venue_name",
  "borough",
  "neighborhood",
  "location",
  "venue_type",
  "cost",
  "stage_time",
  "sign_up_instructions",
  "hosts_organizers",
  "changes_updates",
  "last_verified",
  "city",
  "signup_enabled",
  "other_rules",
  "cover_image_url",
  "status",
  "frequency",
  "verification_count",
  "submission_date",
  "legacy_tag",
  "creator_id",
  "signup_method",
  "signup_url",
  "frequency_custom_text",
  "slots_enabled",
  "slot_duration_minutes",
  "latitude",
  "longitude",
  "geocoded_at",
  "geocoding_provider",
  "geocoding_score",
  "geocoding_match_address",
].join(",");

async function fetchFromStaticJson(): Promise<OpenMic[]> {
  const res = await fetch("/mics.json", { cache: "no-cache" });
  if (!res.ok) throw new Error(`Failed to fetch /mics.json: ${res.status}`);

  const mics = await res.json();
  if (!Array.isArray(mics)) throw new Error("Static mic data is invalid");
  if (!hasUsableCoordinateData(mics as OpenMic[])) {
    throw new Error("Static mic data is missing coordinates");
  }

  return mics as OpenMic[];
}

function mapSupabaseRow(row: any): OpenMic {
  return {
    id: row.unique_identifier,
    openMic: row.open_mic || "",
    day: row.day || "",
    startTime: row.start_time || "",
    latestEndTime: row.latest_end_time || "",
    venueName: row.venue_name || "",
    borough: (row.borough || "").trim(),
    neighborhood: row.neighborhood || "",
    location: row.location || "",
    venueType: row.venue_type || "",
    cost: row.cost || "",
    stageTime: row.stage_time || "",
    signUpInstructions: row.sign_up_instructions || "",
    hosts: row.hosts_organizers || "",
    instagramHandle: row.changes_updates || "",
    lastVerified: row.last_verified || "",
    uniqueIdentifier: row.unique_identifier || "",
    city: row.city || "",
    signupEnabled: row.signup_enabled || false,
    otherRules: row.other_rules || "",
    coverImageUrl: row.cover_image_url || undefined,
    status: row.status || "verified",
    frequency: row.frequency || "weekly",
    verificationCount: row.verification_count || 0,
    submissionDate: row.submission_date || undefined,
    legacyTag: row.legacy_tag || undefined,
    creatorId: row.creator_id || undefined,
    signupMethod: row.signup_method || undefined,
    signupUrl: row.signup_url || undefined,
    frequencyCustomText: row.frequency_custom_text || undefined,
    slotsEnabled: row.slots_enabled || false,
    slotDurationMinutes: row.slot_duration_minutes || 5,
    latitude: row.latitude ?? null,
    longitude: row.longitude ?? null,
    geocodedAt: row.geocoded_at ?? null,
    geocodingProvider: row.geocoding_provider ?? null,
    geocodingScore: row.geocoding_score ?? null,
    geocodingMatchAddress: row.geocoding_match_address ?? null,
  };
}

async function fetchFromSupabase(): Promise<OpenMic[]> {
  const { data, error } = await supabase
    .from("open_mics_historical")
    .select(LIVE_COLUMNS)
    .eq("active", true)
    .neq("status", "pending")
    .order("day", { ascending: true })
    .order("start_time", { ascending: true });

  if (error) throw error;
  return (data || []).map(mapSupabaseRow);
}

export const useOpenMics = (_tableName: "open_mics_historical" = "open_mics_historical") => {
  const { user } = useAuth();
  const shouldUseLiveData = !!user;
  const cached = loadCachedOpenMics();

  return useQuery({
    queryKey: ["openMics", shouldUseLiveData ? "live" : "static"],
    queryFn: async (): Promise<OpenMic[]> => {
      if (shouldUseLiveData) {
        try {
          const rows = await fetchFromSupabase();
          if (rows.length > 0) saveCachedOpenMics(rows);
          return rows;
        } catch (e) {
          console.warn("[useOpenMics] Live Supabase fetch failed:", e);
        }
      }

      try {
        const rows = await fetchFromStaticJson();
        if (rows.length > 0) saveCachedOpenMics(rows);
        return rows;
      } catch (e) {
        console.warn("[useOpenMics] Static JSON fetch failed:", e);
        return cached ?? [];
      }
    },
    placeholderData: cached ?? undefined,
    staleTime: shouldUseLiveData ? 60 * 1000 : 5 * 60 * 1000,
    gcTime: Infinity,
    refetchOnMount: true,
    refetchOnReconnect: true,
    refetchOnWindowFocus: shouldUseLiveData,
    retry: 1,
  });
};
