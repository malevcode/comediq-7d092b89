import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface PlatformStats {
  totalMics: number;
  activeMics: number;
  inactiveMics: number;
  freeMics: number;
  freePercentage: number;
  totalUsers: number;
  totalVisits: number;
  totalRatings: number;
  savedMics: number;
  neighborhoods: number;
  venues: number;
  boroughStats: { borough: string; count: number }[];
  dayStats: { day: string; count: number }[];
}

export const usePlatformStats = () => {
  return useQuery<PlatformStats>({
    queryKey: ['platform-stats'],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke('get-platform-stats');
      
      if (error) {
        console.error('Error fetching platform stats:', error);
        throw error;
      }
      
      return data as PlatformStats;
    },
    staleTime: 60 * 60 * 1000, // 1 hour
    gcTime: 24 * 60 * 60 * 1000, // 24 hours
  });
};
