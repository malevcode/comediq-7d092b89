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

const HEADSHOT_MAX_INPUT_BYTES = 15 * 1024 * 1024;
const HEADSHOT_MAX_SIDE = 1024;

/**
 * Shrinks a picked photo to a web-sized JPEG. Phone photos are often 5MB or more
 * and some are HEIC, which browsers cannot show. If the browser cannot decode the
 * file, the original is uploaded as is.
 */
export async function prepareHeadshot(file: File): Promise<{ blob: Blob; ext: string; type: string }> {
  try {
    const bitmap = await createImageBitmap(file);
    const scale = Math.min(1, HEADSHOT_MAX_SIDE / Math.max(bitmap.width, bitmap.height));
    const canvas = document.createElement('canvas');
    canvas.width = Math.max(1, Math.round(bitmap.width * scale));
    canvas.height = Math.max(1, Math.round(bitmap.height * scale));
    const context = canvas.getContext('2d');
    if (context) {
      context.fillStyle = '#ffffff'; // PNGs with see-through areas would turn black in a JPEG
      context.fillRect(0, 0, canvas.width, canvas.height);
      context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
      const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/jpeg', 0.88));
      if (blob) return { blob, ext: 'jpg', type: 'image/jpeg' };
    }
  } catch {
    // fall through to the original file
  }
  const ext = (file.name.split('.').pop() || 'jpg').toLowerCase();
  return { blob: file, ext, type: file.type || 'image/jpeg' };
}

const describeError = (error: unknown): string => {
  if (error && typeof error === 'object' && 'message' in error) {
    return String((error as { message: unknown }).message);
  }
  return String(error);
};

/**
 * Uploads a headshot image to storage and saves its URL on the profile.
 * Errors say which step failed and why, so a failure can be diagnosed.
 */
export async function uploadHeadshot(userId: string, file: File): Promise<string> {
  if (file.type && !file.type.startsWith('image/')) {
    throw new Error('Please choose an image file (JPG, PNG or similar).');
  }
  if (file.size > HEADSHOT_MAX_INPUT_BYTES) {
    throw new Error('That photo is over 15 MB. Please choose a smaller one.');
  }

  const { blob, ext, type } = await prepareHeadshot(file);
  const filePath = `${userId}/headshot.${ext}`;

  const { error: uploadError } = await supabase.storage
    .from('headshots')
    .upload(filePath, blob, { upsert: true, contentType: type, cacheControl: '3600' });

  if (uploadError) {
    throw new Error(`Photo upload failed: ${describeError(uploadError)}`);
  }

  const { data } = supabase.storage.from('headshots').getPublicUrl(filePath);
  // Same path every time, so add a version to get past browser and CDN caches.
  const url = `${data.publicUrl}?v=${Date.now()}`;

  try {
    await updateUserProfile(userId, { headshot_url: url });
  } catch (error) {
    throw new Error(`Photo uploaded, but saving it to your profile failed: ${describeError(error)}`);
  }

  return url;
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
