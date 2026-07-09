import { useQuery } from "@tanstack/react-query";
import { OpenMic } from "@/types/openMic";

const CACHE_KEY = "comediq_open_mics_v4";
const CACHE_TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30 days — static data

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

async function fetchFromStaticJson(): Promise<OpenMic[]> {
  const res = await fetch("/mics.json");
  if (!res.ok) throw new Error(`Failed to fetch /mics.json: ${res.status}`);
  const mics = await res.json();
  if (!Array.isArray(mics)) {
    throw new Error("Static mic data is invalid");
  }
  return mics as OpenMic[];
}

export const useOpenMics = () => {
  const cached = loadCached();

  return useQuery({
    queryKey: ["openMics"],
    queryFn: async (): Promise<OpenMic[]> => {
      // Serve from localStorage if available — zero network requests
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
    refetchOnWindowFocus: false,
    retry: 1,
  });
};
