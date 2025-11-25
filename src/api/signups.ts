/**
 * Signup System API
 * Handles all mic signup-related backend operations
 */

import { supabase } from '@/integrations/supabase/client';

// Claim to be a host for a mic
export async function claimHostStatus(micId: string) {
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) throw new Error('Must be authenticated');

  const { data, error } = await supabase
    .from('mic_hosts')
    .insert({
      user_id: user.id,
      mic_id: micId,
      is_verified: false
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

// Check if user is a verified host for a mic
export async function checkHostStatus(userId: string) {
  const { data, error } = await supabase
    .from('mic_hosts')
    .select('*, open_mics_historical(*)')
    .eq('user_id', userId);

  if (error) throw error;
  return data || [];
}

// Create a signup event (verified hosts only)
export async function createSignupEvent(eventData: {
  mic_id: string;
  host_id: string;
  event_date: string;
  event_time?: string;
  total_spots: number;
  signup_mode: 'first_come' | 'lottery' | 'bucket';
  signup_opens_at?: string;
  signup_closes_at?: string;
  notes?: string;
}) {
  const { data, error } = await supabase
    .from('mic_signup_events')
    .insert(eventData)
    .select()
    .single();

  if (error) throw error;
  return data;
}

// Fetch signup events for a mic
export async function fetchSignupEvents(micId: string) {
  const { data, error } = await supabase
    .from('mic_signup_events')
    .select(`
      *,
      mic_hosts (
        user_id,
        profiles (username)
      )
    `)
    .eq('mic_id', micId)
    .eq('is_active', true)
    .order('event_date', { ascending: true });

  if (error) throw error;
  return data || [];
}

// Sign up for a spot
export async function signUpForEvent(eventId: string, notes?: string) {
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) throw new Error('Must be authenticated');

  const { data, error } = await supabase
    .from('mic_signups')
    .insert({
      event_id: eventId,
      user_id: user.id,
      notes,
      status: 'confirmed'
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

// Fetch signups for an event
export async function fetchEventSignups(eventId: string) {
  const { data, error } = await supabase
    .from('mic_signups')
    .select(`
      *,
      profiles (username)
    `)
    .eq('event_id', eventId)
    .order('created_at', { ascending: true });

  if (error) throw error;
  return data || [];
}

// Cancel a signup
export async function cancelSignup(signupId: string) {
  const { error } = await supabase
    .from('mic_signups')
    .update({ status: 'cancelled' })
    .eq('id', signupId);

  if (error) throw error;
}

// Fetch user's upcoming signups
export async function fetchUserSignups(userId: string) {
  const { data, error } = await supabase
    .from('mic_signups')
    .select(`
      *,
      mic_signup_events (
        *,
        open_mics_historical (*)
      )
    `)
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
}
