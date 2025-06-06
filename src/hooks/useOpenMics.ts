
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { OpenMic } from '@/types/openMic';

export const useOpenMics = () => {
  return useQuery({
    queryKey: ['openMics'],
    queryFn: async (): Promise<OpenMic[]> => {
      console.log('Fetching open mics from Supabase...');
      
      const { data, error } = await supabase
        .from('open_mics')
        .select('*')
        .order('day', { ascending: true })
        .order('startTime', { ascending: true });

      if (error) {
        console.error('Error fetching open mics:', error);
        throw error;
      }

      console.log('Fetched open mics:', data);
      return data || [];
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    cacheTime: 10 * 60 * 1000, // 10 minutes
  });
};
