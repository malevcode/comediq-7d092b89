/**
 * Signup System API
 * Handles all mic signup-related backend operations
 */

import { supabase } from '@/integrations/supabase/client';
import { awardPoints } from '@/services/pointsService';

// Helper to get the next occurrence of a day
function getNextOccurrence(dayName: string): Date {
  const daysOfWeek = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  const today = new Date();
  const currentDay = today.getDay();
  const targetDay = daysOfWeek.indexOf(dayName);
  
  if (targetDay === -1) {
    const nextDate = new Date(today);
    nextDate.setDate(today.getDate() + 7);
    return nextDate;
  }
  
  let daysUntil = targetDay - currentDay;
  if (daysUntil <= 0) {
    daysUntil += 7;
  }
  
  const nextDate = new Date(today);
  nextDate.setDate(today.getDate() + daysUntil);
  return nextDate;
}

// Get or create the next signup event for a mic
export async function getOrCreateNextEvent(micId: string, micDay: string, micStartTime?: string) {
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) throw new Error('Must be authenticated');

  const today = new Date().toISOString().split('T')[0];
  
  const { data: existingEvents, error: fetchError } = await supabase
    .from('mic_signup_events')
    .select('*')
    .eq('mic_id', micId)
    .eq('is_active', true)
    .gte('event_date', today)
    .order('event_date', { ascending: true })
    .limit(1);

  if (fetchError) throw fetchError;

  if (existingEvents && existingEvents.length > 0) {
    return existingEvents[0];
  }

  const { data: hostId, error: hostError } = await (supabase as any)
    .rpc('get_or_create_system_host', { mic_id_param: micId });

  if (hostError) throw hostError;

  const nextDate = getNextOccurrence(micDay);
  const eventDate = nextDate.toISOString().split('T')[0];

  const { data: newEvent, error: createError } = await supabase
    .from('mic_signup_events')
    .insert({
      mic_id: micId,
      host_id: hostId,
      event_date: eventDate,
      event_time: micStartTime || null,
      total_spots: 15,
      spots_remaining: 15,
      signup_mode: 'first_come' as const,
      is_active: true,
    })
    .select()
    .single();

  if (createError) throw createError;
  return newEvent;
}

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
  
  // Award points for claiming a mic
  awardPoints('mic_claim', 'Claimed a mic listing', { mic_id: micId }).catch(console.error);
  
  return data;
}

// Check if user is a verified host for a mic
export async function checkHostStatus(userId: string) {
  const { data, error } = await supabase
    .from('mic_hosts')
    .select('*, open_mics_historical(open_mic, venue_name, unique_identifier)')
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

// Sign up for a spot (authenticated)
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

  // Award points for signing up
  awardPoints('mic_signup', 'Signed up for a mic slot', { event_id: eventId }).catch(console.error);

  return data;
}

// Sign up as a guest (unauthenticated)
export async function guestSignUpForEvent(eventId: string, guestInfo: {
  name: string;
  email: string;
  phone?: string;
  notes?: string;
}) {
  const { data, error } = await supabase
    .from('mic_signups')
    .insert({
      event_id: eventId,
      user_id: null as any, // nullable now
      guest_name: guestInfo.name,
      guest_email: guestInfo.email,
      guest_phone: guestInfo.phone || null,
      notes: guestInfo.notes || null,
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
        open_mics_historical (open_mic, venue_name, borough, day, start_time, unique_identifier)
      )
    `)
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
}
