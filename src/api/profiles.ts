/**
 * Profiles API
 * Handles all user profile-related backend operations
 */

import { supabase } from '@/integrations/supabase/client';

export interface UserProfile {
  user_id: string;
  display_name?: string;
  avatar_url?: string;
  level?: number;
  created_at?: string;
  updated_at?: string;
  [key: string]: any;
}

/**
 * Fetches a user's profile by user ID
 */
export async function fetchUserProfile(userId: string): Promise<UserProfile | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data;
}

/**
 * Updates a user's profile
 */
export async function updateUserProfile(userId: string, updates: Partial<UserProfile>) {
  const { data, error } = await supabase
    .from('profiles')
    .update(updates)
    .eq('user_id', userId)
    .select()
    .single();

  if (error) {
    throw error;
  }

  return data;
}

/**
 * Fetches user visits for streak calculation
 */
export async function fetchUserVisits(userId: string) {
  const { data, error } = await supabase
    .from('user_visits')
    .select('visit_date')
    .eq('user_id', userId)
    .order('visit_date', { ascending: false });

  if (error) {
    throw error;
  }

  return data || [];
}

/**
 * Records a user visit
 */
export async function recordUserVisit(userId: string) {
  const today = new Date().toISOString().split('T')[0];
  
  const { error } = await supabase
    .from('user_visits')
    .upsert(
      { user_id: userId, visit_date: today },
      { onConflict: 'user_id,visit_date' }
    );

  if (error) {
    throw error;
  }
}
