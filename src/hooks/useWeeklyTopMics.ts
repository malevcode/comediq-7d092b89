import { useQuery } from '@tanstack/react-query';
import { pb } from '@/integrations/pocketbase/client';

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
      const data = await pb.collection('weekly_top_mics').getFullList({
        sort: '+rank',
        limit: 5,
      } as any);
      return data as unknown as WeeklyTopMic[];
    },
    staleTime: 60 * 60 * 1000,
    gcTime: 24 * 60 * 60 * 1000,
  });
}
