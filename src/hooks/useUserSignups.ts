import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface UserSignup {
  id: string;
  event_id: string;
  status: 'confirmed' | 'waitlist' | 'lottery_pending' | 'cancelled';
  signup_order: number | null;
  notes: string | null;
  created_at: string;
  event: {
    id: string;
    event_date: string;
    event_time: string | null;
    total_spots: number;
    spots_remaining: number;
    mic: {
      open_mic: string;
      venue_name: string;
      borough: string;
      day: string;
      start_time: string;
    } | null;
  } | null;
}

export function useUserSignups(userId?: string) {
  return useQuery({
    queryKey: ['userSignups', userId],
    queryFn: async (): Promise<UserSignup[]> => {
      if (!userId) return [];

      const { data, error } = await supabase
        .from('mic_signups')
        .select(`
          id,
          event_id,
          status,
          signup_order,
          notes,
          created_at,
          mic_signup_events (
            id,
            event_date,
            event_time,
            total_spots,
            spots_remaining,
            open_mics_historical (
              open_mic,
              venue_name,
              borough,
              day,
              start_time
            )
          )
        `)
        .eq('user_id', userId)
        .neq('status', 'cancelled')
        .order('created_at', { ascending: false });

      if (error) throw error;

      return (data || []).map((signup: any) => ({
        id: signup.id,
        event_id: signup.event_id,
        status: signup.status,
        signup_order: signup.signup_order,
        notes: signup.notes,
        created_at: signup.created_at,
        event: signup.mic_signup_events ? {
          id: signup.mic_signup_events.id,
          event_date: signup.mic_signup_events.event_date,
          event_time: signup.mic_signup_events.event_time,
          total_spots: signup.mic_signup_events.total_spots,
          spots_remaining: signup.mic_signup_events.spots_remaining,
          mic: signup.mic_signup_events.open_mics_historical,
        } : null,
      }));
    },
    enabled: !!userId,
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  });
}
