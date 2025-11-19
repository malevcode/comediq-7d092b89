/**
 * Shows API
 * Handles all show-related backend operations (both open mics and custom shows)
 */

import { supabase } from '@/integrations/supabase/client';

export interface UserShow {
  id: string;
  profile_id: string;
  open_mic_id: string;
  schedule_type: 'upcoming' | 'completed' | 'cancelled';
  notes?: string;
  created_at: string;
  last_modified?: string;
}

export interface CustomShow {
  id: string;
  profile_id: string;
  title: string;
  venue: string;
  borough?: string;
  date: string;
  schedule_type: 'upcoming' | 'completed' | 'cancelled';
  notes?: string;
  created_at: string;
  last_modified?: string;
}

/**
 * Fetches all shows for a user from profile_open_mics
 */
export async function fetchUserShows(userId: string): Promise<UserShow[]> {
  const { data, error } = await supabase
    .from('profile_open_mics')
    .select('*')
    .eq('profile_id', userId);

  if (error) {
    throw error;
  }

  return data || [];
}

/**
 * Fetches custom shows for a user
 */
export async function fetchCustomShows(userId: string): Promise<CustomShow[]> {
  const { data, error } = await supabase
    .from('profile_custom_shows')
    .select('*')
    .eq('profile_id', userId);

  if (error) {
    throw error;
  }

  return data || [];
}

/**
 * Adds a custom show
 */
export async function addCustomShow(show: Omit<CustomShow, 'id' | 'created_at' | 'last_modified'>) {
  const { data, error } = await supabase
    .from('profile_custom_shows')
    .insert(show)
    .select()
    .single();

  if (error) {
    throw error;
  }

  return data;
}

/**
 * Updates a custom show
 */
export async function updateCustomShow(showId: string, updates: Partial<CustomShow>) {
  const { data, error } = await supabase
    .from('profile_custom_shows')
    .update({
      ...updates,
      last_modified: new Date().toISOString(),
    })
    .eq('id', showId)
    .select()
    .single();

  if (error) {
    throw error;
  }

  return data;
}

/**
 * Deletes a custom show
 */
export async function deleteCustomShow(showId: string) {
  const { error } = await supabase
    .from('profile_custom_shows')
    .delete()
    .eq('id', showId);

  if (error) {
    throw error;
  }
}

/**
 * Fetches completed shows for calculating stage time
 */
export async function fetchCompletedShows(userId: string) {
  const { data, error } = await supabase
    .from('profile_open_mics')
    .select(`
      *,
      open_mics_historical!inner(stage_time)
    `)
    .eq('profile_id', userId)
    .eq('schedule_type', 'completed');

  if (error) {
    throw error;
  }

  return data || [];
}
