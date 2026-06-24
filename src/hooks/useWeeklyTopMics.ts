import { useQuery } from '@tanstack/react-query';

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

function loadCached(): WeeklyTopMic[] | null {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const { data } = JSON.parse(raw);
    return data as WeeklyTopMic[];
  } catch {
    return null;
  }
}

export function useWeeklyTopMics() {
  const cached = loadCached();

  return useQuery({
    queryKey: ['weekly-top-mics'],
    queryFn: async () => cached ?? [],
    placeholderData: cached ?? undefined,
    staleTime: Infinity,
    gcTime: Infinity,
    refetchOnWindowFocus: false,
  });
}
