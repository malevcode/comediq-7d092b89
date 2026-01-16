import { supabase } from "@/integrations/supabase/client";

export interface ShowReview {
  id: string;
  user_id: string;
  show_id: string;
  rating: number;
  review_text: string | null;
  favorite_comedian: string | null;
  attended_date: string;
  created_at: string;
  updated_at: string;
}

export interface ShowReviewWithShow extends ShowReview {
  show: {
    id: string;
    title: string;
    venue_name: string;
    image_url: string | null;
    show_date: string;
  };
}

export interface ReviewInput {
  show_id: string;
  rating: number;
  review_text?: string;
  favorite_comedian?: string;
  attended_date: string;
}

export async function fetchUserReviews(): Promise<ShowReviewWithShow[]> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Must be logged in to fetch reviews");

  const { data, error } = await supabase
    .from("show_reviews")
    .select(`
      *,
      show:audience_shows(id, title, venue_name, image_url, show_date)
    `)
    .eq("user_id", user.id)
    .order("attended_date", { ascending: false });

  if (error) throw error;
  return (data || []) as unknown as ShowReviewWithShow[];
}

export async function fetchUserReviewForShow(showId: string): Promise<ShowReview | null> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data, error } = await supabase
    .from("show_reviews")
    .select("*")
    .eq("user_id", user.id)
    .eq("show_id", showId)
    .maybeSingle();

  if (error) throw error;
  return data as ShowReview | null;
}

export async function submitReview(review: ReviewInput): Promise<ShowReview> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Must be logged in to submit a review");

  const { data, error } = await supabase
    .from("show_reviews")
    .insert({
      user_id: user.id,
      show_id: review.show_id,
      rating: review.rating,
      review_text: review.review_text || null,
      favorite_comedian: review.favorite_comedian || null,
      attended_date: review.attended_date,
    })
    .select()
    .single();

  if (error) throw error;
  return data as ShowReview;
}

export async function updateReview(
  reviewId: string,
  updates: Partial<ReviewInput>
): Promise<ShowReview> {
  const { data, error } = await supabase
    .from("show_reviews")
    .update({
      ...(updates.rating !== undefined && { rating: updates.rating }),
      ...(updates.review_text !== undefined && { review_text: updates.review_text || null }),
      ...(updates.favorite_comedian !== undefined && { favorite_comedian: updates.favorite_comedian || null }),
      ...(updates.attended_date !== undefined && { attended_date: updates.attended_date }),
    })
    .eq("id", reviewId)
    .select()
    .single();

  if (error) throw error;
  return data as ShowReview;
}

export async function deleteReview(reviewId: string): Promise<void> {
  const { error } = await supabase
    .from("show_reviews")
    .delete()
    .eq("id", reviewId);

  if (error) throw error;
}
