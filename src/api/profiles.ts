/**
 * Profiles API
 * Handles all user profile-related backend operations including comedian profiles
 */

import { supabase } from '@/integrations/supabase/client';

export interface UserProfile {
  user_id: string;
  username?: string;
  stage_name?: string;
  headshot_url?: string;
  credit?: string;
  bio?: string;
  years_performing?: number;
  phone?: string;
  created_at?: string;
  updated_at?: string;
  [key: string]: any;
}

export interface SocialLink {
  id: string;
  user_id: string;
  platform: string;
  handle: string;
  url: string;
  is_primary: boolean;
  created_at: string;
}

export interface ComedianProfile extends UserProfile {
  social_links: SocialLink[];
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
  const now = new Date();
  const today = [
    now.getFullYear(),
    String(now.getMonth() + 1).padStart(2, '0'),
    String(now.getDate()).padStart(2, '0'),
  ].join('-');
  
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

/**
 * Fetches a comedian's full profile including social links
 */
export async function fetchComedianProfile(userId: string): Promise<ComedianProfile | null> {
  const [profileResult, linksResult] = await Promise.all([
    supabase.from('profiles').select('*').eq('user_id', userId).maybeSingle(),
    supabase.from('comedian_social_links').select('*').eq('user_id', userId)
  ]);

  if (profileResult.error) throw profileResult.error;
  if (linksResult.error) throw linksResult.error;

  if (!profileResult.data) return null;

  return {
    ...profileResult.data,
    social_links: linksResult.data || []
  };
}

/**
 * Uploads a headshot image to storage
 */
export async function uploadHeadshot(userId: string, file: File): Promise<string> {
  const fileExt = file.name.split('.').pop();
  const filePath = `${userId}/headshot.${fileExt}`;

  // Delete old headshot if exists
  await supabase.storage.from('headshots').remove([filePath]);

  const { error: uploadError } = await supabase.storage
    .from('headshots')
    .upload(filePath, file, { upsert: true });

  if (uploadError) throw uploadError;

  const { data } = supabase.storage.from('headshots').getPublicUrl(filePath);
  
  return data.publicUrl;
}

/**
 * Adds a social link for a comedian
 */
export async function addSocialLink(
  userId: string,
  platform: string,
  handle: string,
  url: string,
  isPrimary: boolean = false
) {
  const { data, error } = await supabase
    .from('comedian_social_links')
    .upsert({
      user_id: userId,
      platform,
      handle,
      url,
      is_primary: isPrimary
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Removes a social link
 */
export async function removeSocialLink(userId: string, platform: string) {
  const { error } = await supabase
    .from('comedian_social_links')
    .delete()
    .eq('user_id', userId)
    .eq('platform', platform);

  if (error) throw error;
}

/**
 * Fetches multiple comedian profiles by IDs (for lineup generation)
 */
export async function fetchComediansByIds(userIds: string[]): Promise<ComedianProfile[]> {
  const [profilesResult, linksResult] = await Promise.all([
    supabase.from('profiles').select('*').in('user_id', userIds),
    supabase.from('comedian_social_links').select('*').in('user_id', userIds)
  ]);

  if (profilesResult.error) throw profilesResult.error;
  if (linksResult.error) throw linksResult.error;

  const profiles = profilesResult.data || [];
  const links = linksResult.data || [];

  return profiles.map(profile => ({
    ...profile,
    social_links: links.filter(link => link.user_id === profile.user_id)
  }));
}
