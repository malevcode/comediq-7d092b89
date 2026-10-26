/**
 * Time-block mic signup API.
 *
 * Layered on top of the existing mic_hosts / mic_signup_events / mic_signups
 * tables from src/api/signups.ts. Cancelling reuses cancelSignup from there
 * unchanged, since it is already generic across signup modes. Everything
 * else here is specific to time-block mode: a host row resolved by its
 * public slug, one event with named blocks instead of one ordered list, and
 * capacity enforced by the signup_for_mic_slot RPC rather than a plain
 * insert, so two people cannot take the last spot in a block.
 */

import { supabase } from '@/integrations/supabase/client';
import { awardPoints } from '@/services/pointsService';

export interface MicSlotHost {
  id: string;
  mic_id: string;
  user_id: string;
  is_verified: boolean;
}

export interface TimeBlockEvent {
  id: string;
  event_date: string;
  event_time: string | null;
  slot_minutes: number | null;
  spots_per_slot: number | null;
  slot_count: number | null;
  min_signups: number | null;
  signup_rules: string | null;
  mic_display_name: string | null;
  venue_display_name: string | null;
}

export interface SlotCount {
  slot_start: string;
  confirmed_count: number;
}

export interface MicSlotHostViewRow {
  slot_start: string;
  display_name: string;
  created_at: string;
}

// Resolve a host's public slug to the host row. Only hosts who have opted
// into time-block mode have a slug, so an unknown slug finds nothing.
export async function fetchMicSlotHostBySlug(slug: string): Promise<MicSlotHost | null> {
  // slug is not in the generated types yet (it arrives in a migration the
  // database has not run). Same reason for the `as any` casts below.
  const { data, error } = await (supabase as any)
    .from('mic_hosts')
    .select('id, mic_id, user_id, is_verified')
    .eq('slug', slug)
    .maybeSingle();

  if (error) throw error;
  return data as MicSlotHost | null;
}

// The next upcoming time-block event for this host. Reads only this one
// row, never open_mics_historical.
export async function fetchNextTimeBlockEvent(hostId: string): Promise<TimeBlockEvent | null> {
  const today = new Date().toISOString().split('T')[0];

  const { data, error } = await (supabase as any)
    .from('mic_signup_events')
    .select(
      'id, event_date, event_time, slot_minutes, spots_per_slot, slot_count, min_signups, signup_rules, mic_display_name, venue_display_name'
    )
    .eq('host_id', hostId)
    .eq('signup_mode', 'time_block')
    .eq('is_active', true)
    .gte('event_date', today)
    .order('event_date', { ascending: true })
    .limit(1)
    .maybeSingle();

  if (error) throw error;
  return data as TimeBlockEvent | null;
}

// Spots left per block. Numbers only, never signup rows.
export async function fetchTimeBlockSlotCounts(eventId: string): Promise<SlotCount[]> {
  const { data, error } = await (supabase as any).rpc('get_time_block_slot_counts', {
    p_event_id: eventId,
  });

  if (error) throw error;
  return (data || []) as SlotCount[];
}

// The current user's own signup for this event, if any.
export async function fetchMySlotSignup(
  eventId: string
): Promise<{ id: string; slot_start: string } | null> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data, error } = await (supabase as any)
    .from('mic_signups')
    .select('id, slot_start')
    .eq('event_id', eventId)
    .eq('user_id', user.id)
    .eq('status', 'confirmed')
    .maybeSingle();

  if (error) throw error;
  return data as { id: string; slot_start: string } | null;
}

// Take a slot. Capacity is checked inside the RPC, at insert time, not here.
export async function signUpForMicSlot(eventId: string, slotStart: string) {
  const { data, error } = await (supabase as any).rpc('signup_for_mic_slot', {
    p_event_id: eventId,
    p_slot_start: slotStart,
  });

  if (error) throw error;

  awardPoints('mic_signup', 'Signed up for a mic slot', { event_id: eventId }).catch(console.error);

  return data;
}

// Names, host and admin only. Enforced inside the RPC, not by RLS alone.
export async function fetchMicSlotHostView(eventId: string): Promise<MicSlotHostViewRow[]> {
  const { data, error } = await (supabase as any).rpc('get_mic_slot_host_view', {
    p_event_id: eventId,
  });

  if (error) throw error;
  return (data || []) as MicSlotHostViewRow[];
}
