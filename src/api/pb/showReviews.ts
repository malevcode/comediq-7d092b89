import { pb } from '@/integrations/pocketbase/client';
import type { ShowReview, ShowReviewWithShow, ReviewInput } from '../showReviews';

export type { ShowReview, ShowReviewWithShow, ReviewInput };

export async function fetchUserReviews(): Promise<ShowReviewWithShow[]> {
  const user = pb.authStore.record;
  if (!user) throw new Error('Must be logged in to fetch reviews');

  const reviews = await pb.collection('show_reviews').getFullList({
    filter: `user_id = "${user.id}"`,
    sort: '-attended_date',
  });

  // Batch-fetch shows
  const showIds = [...new Set(reviews.map(r => r.show_id as string))];
  const shows = showIds.length > 0
    ? await pb.collection('audience_shows').getFullList({
        filter: showIds.map(id => `id = "${id}"`).join(' || '),
        fields: 'id,title,venue_name,image_url,show_date',
      })
    : [];

  const showMap = Object.fromEntries(shows.map(s => [s.id, s]));
  return reviews.map(r => ({
    ...r,
    show: showMap[r.show_id as string] ?? null,
  })) as unknown as ShowReviewWithShow[];
}

export async function fetchUserReviewForShow(showId: string): Promise<ShowReview | null> {
  const user = pb.authStore.record;
  if (!user) return null;

  const results = await pb.collection('show_reviews').getFullList({
    filter: `user_id = "${user.id}" && show_id = "${showId}"`,
  });
  return results[0] as unknown as ShowReview ?? null;
}

export async function submitReview(review: ReviewInput): Promise<ShowReview> {
  const user = pb.authStore.record;
  if (!user) throw new Error('Must be logged in to submit a review');

  const data = await pb.collection('show_reviews').create({
    user_id: user.id,
    show_id: review.show_id,
    rating: review.rating,
    review_text: review.review_text || null,
    favorite_comedian: review.favorite_comedian || null,
    attended_date: review.attended_date,
  });
  return data as unknown as ShowReview;
}

export async function updateReview(reviewId: string, updates: Partial<ReviewInput>): Promise<ShowReview> {
  const data = await pb.collection('show_reviews').update(reviewId, {
    ...(updates.rating !== undefined && { rating: updates.rating }),
    ...(updates.review_text !== undefined && { review_text: updates.review_text || null }),
    ...(updates.favorite_comedian !== undefined && { favorite_comedian: updates.favorite_comedian || null }),
    ...(updates.attended_date !== undefined && { attended_date: updates.attended_date }),
    updated_at: new Date().toISOString(),
  });
  return data as unknown as ShowReview;
}

export async function deleteReview(reviewId: string): Promise<void> {
  await pb.collection('show_reviews').delete(reviewId);
}
