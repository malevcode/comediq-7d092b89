import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { rsvpForShow, cancelRsvp, fetchUserRsvpForShow, fetchUserRsvps } from '@/api/audienceShows';
import { toast } from 'sonner';

export function useUserRsvpForShow(showId: string | null) {
  return useQuery({
    queryKey: ['userRsvp', showId],
    queryFn: () => showId ? fetchUserRsvpForShow(showId) : null,
    enabled: !!showId,
  });
}

export function useUserRsvps() {
  return useQuery({
    queryKey: ['userRsvps'],
    queryFn: fetchUserRsvps,
  });
}

export function useRsvpMutation() {
  const queryClient = useQueryClient();

  const rsvpMutation = useMutation({
    mutationFn: ({ showId, partySize }: { showId: string; partySize: number }) => 
      rsvpForShow(showId, partySize),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['userRsvp', variables.showId] });
      queryClient.invalidateQueries({ queryKey: ['userRsvps'] });
      queryClient.invalidateQueries({ queryKey: ['audienceShows'] });
      toast.success("You're on the list! See you there 🎉");
    },
    onError: (error: Error) => {
      if (error.message.includes('duplicate key') || error.message.includes('unique constraint')) {
        toast.error("You've already RSVP'd to this show");
      } else if (error.message.includes('Must be logged in')) {
        toast.error('Please sign in to RSVP');
      } else {
        toast.error('Failed to RSVP. Please try again.');
      }
    },
  });

  const cancelMutation = useMutation({
    mutationFn: cancelRsvp,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['userRsvp'] });
      queryClient.invalidateQueries({ queryKey: ['userRsvps'] });
      queryClient.invalidateQueries({ queryKey: ['audienceShows'] });
      toast.success('RSVP cancelled');
    },
    onError: () => {
      toast.error('Failed to cancel RSVP');
    },
  });

  return { rsvpMutation, cancelMutation };
}
