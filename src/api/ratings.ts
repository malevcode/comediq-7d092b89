/**
 * Ratings API
 * Handles all mic rating (like/dislike) operations
 */

import { supabase } from '@/integrations/supabase/client';

export type RatingType = 'like' | 'dislike';

export interface RatingCounts {
  likes: number;
  dislikes: number;
}

/**
 * Fetches the current user's rating for a specific mic
 */
export async function fetchUserRating(userId: string, micId: string): Promise<RatingType | null> {
  const { data, error } = await supabase
    .from('user_mic_ratings')
    .select('rating')
    .eq('user_id', userId)
    .eq('mic_unique_identifier', micId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data?.rating as RatingType | null;
}

/**
 * Fetches like and dislike counts for a specific mic
 */
export async function fetchRatingCounts(micId: string): Promise<RatingCounts> {
  const { data, error } = await supabase
    .from('mic_like_counts')
    .select('likes, dislikes')
    .eq('mic_unique_identifier', micId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return {
    likes: data?.likes || 0,
    dislikes: data?.dislikes || 0,
  };
}

/**
 * Submits or updates a rating for a mic
 */
export async function rateMic(userId: string, micId: string, ratingType: RatingType) {
  const { error } = await supabase
    .from('user_mic_ratings')
    .upsert({
      user_id: userId,
      mic_unique_identifier: micId,
      rating: ratingType,
    }, {
      onConflict: 'user_id,mic_unique_identifier'
    });

  if (error) {
    throw error;
  }
}

/**
 * Removes a user's rating for a mic
 */
export async function removeRating(userId: string, micId: string) {
  const { error } = await supabase
    .from('user_mic_ratings')
    .delete()
    .eq('user_id', userId)
    .eq('mic_unique_identifier', micId);

  if (error) {
    throw error;
  }
}

/**
 * Fetches all mics that a user has liked
 */
export async function fetchUserLikedMics(userId: string): Promise<string[]> {
  const { data, error } = await supabase
    .from('user_mic_ratings')
    .select('mic_unique_identifier')
    .eq('user_id', userId)
    .eq('rating', 'like');

  if (error) {
    throw error;
  }

  return data?.map(item => item.mic_unique_identifier) || [];
}
