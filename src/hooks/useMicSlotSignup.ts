import { useQuery } from '@tanstack/react-query';
import {
  fetchMicSlotHostBySlug,
  fetchMicSlotHostView,
  fetchMySlotSignup,
  fetchNextTimeBlockEvent,
  fetchTimeBlockSlotCounts,
} from '@/api/micSlotSignup';
import { useAuth } from '@/contexts/AuthContext';

export function useMicSlotHost(slug: string | undefined) {
  return useQuery({
    queryKey: ['micSlotHost', slug],
    queryFn: () => fetchMicSlotHostBySlug(slug as string),
    enabled: !!slug,
  });
}

export function useNextTimeBlockEvent(hostId: string | undefined) {
  return useQuery({
    queryKey: ['nextTimeBlockEvent', hostId],
    queryFn: () => fetchNextTimeBlockEvent(hostId as string),
    enabled: !!hostId,
  });
}

export function useTimeBlockSlotCounts(eventId: string | undefined) {
  return useQuery({
    queryKey: ['timeBlockSlotCounts', eventId],
    queryFn: () => fetchTimeBlockSlotCounts(eventId as string),
    enabled: !!eventId,
  });
}

export function useMySlotSignup(eventId: string | undefined) {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['mySlotSignup', eventId, user?.id],
    queryFn: () => fetchMySlotSignup(eventId as string),
    enabled: !!eventId && !!user,
  });
}

export function useMicSlotHostView(eventId: string | undefined, canView: boolean) {
  return useQuery({
    queryKey: ['micSlotHostView', eventId],
    queryFn: () => fetchMicSlotHostView(eventId as string),
    enabled: !!eventId && canView,
  });
}
