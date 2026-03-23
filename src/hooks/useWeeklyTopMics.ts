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

export function useWeeklyTopMics() {
  return useQuery({
    queryKey: ['weekly-top-mics'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('weekly_top_mics')
        .select('*')
        .order('rank')
        .limit(5);

      if (error) throw error;
      return (data || []) as WeeklyTopMic[];
    },
    staleTime: 60 * 60 * 1000, // 1 hour
    gcTime: 24 * 60 * 60 * 1000,
  });
}
