import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface WeeklyTopMic {
  id: string;
  mic_unique_identifier: string;
  mic_name: string;
  venue_name: string | null;
  borough: string | null;
  neighborhood: string | null;
  day: string | null;
  start_time: string | null;
  cost: string | null;
  like_count: number;
  rank: number;
  week_start: string;
}

const CACHE_KEY = 'comediq_weekly_top_v1';
const CACHE_FRESH_MS = 4 * 60 * 60 * 1000;

function loadCached(): WeeklyTopMic[] | null {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const { data, savedAt } = JSON.parse(raw);
    if (Date.now() - savedAt > CACHE_FRESH_MS) return null;
    return data as WeeklyTopMic[];
  } catch {
    return null;
  }
}

function saveCache(data: WeeklyTopMic[]) {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify({ data, savedAt: Date.now() }));
  } catch {}
}

export function useWeeklyTopMics() {
  const cached = loadCached();

  return useQuery({
    queryKey: ['weekly-top-mics'],
    queryFn: async () => {
      const fresh = loadCached();
      if (fresh && fresh.length > 0) return fresh;

      const { data, error } = await supabase
        .from('weekly_top_mics')
        .select('id,mic_unique_identifier,mic_name,venue_name,borough,neighborhood,day,start_time,cost,like_count,rank,week_start')
        .order('rank')
        .limit(5);

      if (error) throw error;
      const rows = (data || []) as WeeklyTopMic[];
      if (rows.length > 0) saveCache(rows);
      return rows;
    },
    placeholderData: cached ?? undefined,
    staleTime: 4 * 60 * 60 * 1000,
    gcTime: 24 * 60 * 60 * 1000,
    refetchOnWindowFocus: false,
  });
}
