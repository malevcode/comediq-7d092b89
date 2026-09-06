import { useQuery } from '@tanstack/react-query';
import { fetchCurrentUserHostForMic, fetchSignupEvents, fetchEventSignups } from '@/api/signups';

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

export function useCurrentUserHostForMic(micId: string, enabled = true) {
  return useQuery({
    queryKey: ['currentUserHostForMic', micId],
    queryFn: () => fetchCurrentUserHostForMic(micId),
    enabled: enabled && !!micId,
  });
}
