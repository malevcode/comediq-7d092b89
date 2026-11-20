import { useQuery } from '@tanstack/react-query';
import { fetchCurrentUserHostForMic, fetchSignupEvents, fetchEventSignups, fetchEventLineup } from '@/api/signups';

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

/** The running order for a sheet whose lineup is set by check-in. Refreshes while the page is open. */
export function useEventLineup(eventId: string, enabled = true) {
  return useQuery({
    queryKey: ['eventLineup', eventId],
    queryFn: () => fetchEventLineup(eventId),
    enabled: enabled && !!eventId,
    refetchInterval: 20000,
  });
}
