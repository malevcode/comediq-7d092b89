import { pb } from '@/integrations/pocketbase/client';
import type { RatingType, RatingCounts } from '../ratings';

export type { RatingType, RatingCounts };

export async function fetchUserRating(userId: string, micId: string): Promise<RatingType | null> {
  const results = await pb.collection('user_mic_ratings').getFullList({
    filter: `user_id = "${userId}" && mic_unique_identifier = "${micId}"`,
    fields: 'rating',
  });
  return (results[0]?.rating as RatingType) ?? null;
}

// PocketBase has no mic_like_counts view — compute from user_mic_ratings directly
export async function fetchRatingCounts(micId: string): Promise<RatingCounts> {
  const all = await pb.collection('user_mic_ratings').getFullList({
    filter: `mic_unique_identifier = "${micId}"`,
    fields: 'rating',
  });
  return {
    likes: all.filter(r => r.rating === 'like').length,
    dislikes: all.filter(r => r.rating === 'dislike').length,
  };
}

export async function rateMic(userId: string, micId: string, ratingType: RatingType) {
  const existing = await pb.collection('user_mic_ratings').getFullList({
    filter: `user_id = "${userId}" && mic_unique_identifier = "${micId}"`,
    fields: 'id',
  });
  if (existing[0]) {
    await pb.collection('user_mic_ratings').update(existing[0].id, { rating: ratingType });
  } else {
    await pb.collection('user_mic_ratings').create({
      user_id: userId,
      mic_unique_identifier: micId,
      rating: ratingType,
    });
  }
}

export async function removeRating(userId: string, micId: string) {
  const records = await pb.collection('user_mic_ratings').getFullList({
    filter: `user_id = "${userId}" && mic_unique_identifier = "${micId}"`,
    fields: 'id',
  });
  for (const r of records) {
    await pb.collection('user_mic_ratings').delete(r.id);
  }
}

export async function fetchUserLikedMics(userId: string): Promise<string[]> {
  const data = await pb.collection('user_mic_ratings').getFullList({
    filter: `user_id = "${userId}" && rating = "like"`,
    fields: 'mic_unique_identifier',
  });
  return data.map(r => r.mic_unique_identifier as string);
}
