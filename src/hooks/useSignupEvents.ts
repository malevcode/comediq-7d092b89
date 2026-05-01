import { useQuery } from '@tanstack/react-query';
import { fetchSignupEvents, fetchEventSignups } from '@/api/pb/signups';

export function useSignupEvents(micId: string) {
  return useQuery({
    queryKey: ['signupEvents', micId],
    queryFn: () => fetchSignupEvents(micId),
    enabled: !!micId,
  });
}

export function useEventSignups(eventId: string) {
  return useQuery({
    queryKey: ['eventSignups', eventId],
    queryFn: () => fetchEventSignups(eventId),
    enabled: !!eventId,
  });
}
