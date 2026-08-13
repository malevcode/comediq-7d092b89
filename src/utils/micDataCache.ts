import { OpenMic } from "@/types/openMic";

export const OPEN_MICS_CACHE_KEY = "comediq_open_mics_v7";
export const OPEN_MICS_CACHE_TTL_MS = 30 * 24 * 60 * 60 * 1000;

function hasCoordinates(mic: OpenMic): boolean {
  return mic.latitude !== null
    && mic.latitude !== undefined
    && mic.longitude !== null
    && mic.longitude !== undefined;
}

export function hasUsableCoordinateData(data: OpenMic[]): boolean {
  return data.length === 0 || data.some(hasCoordinates);
}

export function loadCachedOpenMics(): OpenMic[] | null {
  try {
    const raw = localStorage.getItem(OPEN_MICS_CACHE_KEY);
    if (!raw) return null;
    const { data, savedAt } = JSON.parse(raw);
    if (Date.now() - savedAt > OPEN_MICS_CACHE_TTL_MS) return null;
    if (!Array.isArray(data) || !hasUsableCoordinateData(data)) return null;
    return data as OpenMic[];
  } catch {
    return null;
  }
}

export function saveCachedOpenMics(data: OpenMic[]) {
  try {
    localStorage.setItem(OPEN_MICS_CACHE_KEY, JSON.stringify({ data, savedAt: Date.now() }));
  } catch {
    // Cache writes are best effort only.
  }
}

export function clearCachedOpenMics() {
  try {
    localStorage.removeItem(OPEN_MICS_CACHE_KEY);
  } catch {
    // Cache clears are best effort only.
  }
}
