/**
 * Slots API - Fetches all active signup events for the Slots browse view
 */
import { supabase } from '@/integrations/supabase/client';

export async function fetchAllActiveEvents() {
  const today = new Date().toISOString().split('T')[0];

  const { data, error } = await supabase
    .from('mic_signup_events')
    .select(`
      *,
      open_mics_historical (
        open_mic,
        venue_name,
        borough,
        day,
        location,
        neighborhood
      )
    `)
    .eq('is_active', true)
    .gte('event_date', today)
    .order('event_date', { ascending: true });

  if (error) throw error;
  return data || [];
}

export async function createSlotEvent(params: {
  micId: string;
  hostId: string;
  eventDate: string;
  eventTime?: string;
  totalSpots: number;
  signupMode: 'first_come' | 'lottery' | 'bucket';
  notes?: string;
}) {
  const { data, error } = await supabase
    .from('mic_signup_events')
    .insert({
      mic_id: params.micId,
      host_id: params.hostId,
      event_date: params.eventDate,
      event_time: params.eventTime || null,
      total_spots: params.totalSpots,
      spots_remaining: params.totalSpots,
      signup_mode: params.signupMode,
      notes: params.notes || null,
      is_active: true,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}
