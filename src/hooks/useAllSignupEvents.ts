import { useQuery } from '@tanstack/react-query';
import { fetchAllActiveEvents } from '@/api/slots';

export function useAllSignupEvents() {
  return useQuery({
    queryKey: ['allSignupEvents'],
    queryFn: fetchAllActiveEvents,
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  });
}
