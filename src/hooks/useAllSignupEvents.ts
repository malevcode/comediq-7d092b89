import { useQuery } from '@tanstack/react-query';
import { fetchAllActiveEvents } from '@/api/pb/slots';

export function useAllSignupEvents() {
  return useQuery({
    queryKey: ['allSignupEvents'],
    queryFn: fetchAllActiveEvents,
    refetchInterval: 30000, // refresh every 30s
  });
}
