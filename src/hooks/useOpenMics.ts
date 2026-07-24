import { useQuery } from "@tanstack/react-query";
import { OpenMic } from "@/types/openMic";

const CACHE_KEY = "comediq_open_mics_v6";
const CACHE_TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30 days — static data

function hasCoordinates(mic: OpenMic): boolean {
  return mic.latitude !== null
    && mic.latitude !== undefined
    && mic.longitude !== null
    && mic.longitude !== undefined;
}

function hasUsableCoordinateData(data: OpenMic[]): boolean {
  return data.length === 0 || data.some(hasCoordinates);
}

function loadCached(): OpenMic[] | null {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const { data, savedAt } = JSON.parse(raw);
    if (Date.now() - savedAt > CACHE_TTL_MS) return null;
    if (!Array.isArray(data) || !hasUsableCoordinateData(data)) return null;
    return data as OpenMic[];
  } catch {
    return null;
  }
}

function saveCache(data: OpenMic[]) {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify({ data, savedAt: Date.now() }));
  } catch {
    // Ignore cache write failures; /mics.json remains the source of truth for public visitors.
  }
}

async function fetchFromStaticJson(): Promise<OpenMic[]> {
  const res = await fetch("/mics.json");
  if (!res.ok) throw new Error(`Failed to fetch /mics.json: ${res.status}`);

  const mics = await res.json();
  if (!Array.isArray(mics)) throw new Error("Static mic data is invalid");
  if (!hasUsableCoordinateData(mics as OpenMic[])) {
    throw new Error("Static mic data is missing coordinates");
  }

  return mics as OpenMic[];
}

export const useOpenMics = (_tableName: "open_mics_historical" = "open_mics_historical") => {
  const cached = loadCached();

  return useQuery({
    queryKey: ["openMics"],
    queryFn: async (): Promise<OpenMic[]> => {
      if (cached && cached.length > 0) return cached;

      try {
        const rows = await fetchFromStaticJson();
        if (rows.length > 0) saveCache(rows);
        return rows;
      } catch (e) {
        console.warn("[useOpenMics] Static JSON fetch failed:", e);
        return [];
      }
    },
    placeholderData: cached ?? undefined,
    staleTime: Infinity,
    gcTime: Infinity,
    refetchOnMount: false,
    refetchOnReconnect: false,
    refetchOnWindowFocus: false,
    retry: 1,
  });
};
