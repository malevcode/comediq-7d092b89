-- Create show_reviews table for users to review attended shows
CREATE TABLE public.show_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  show_id UUID NOT NULL REFERENCES audience_shows(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  review_text TEXT,
  favorite_comedian TEXT,
  attended_date DATE NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, show_id)
);

-- Enable RLS
ALTER TABLE public.show_reviews ENABLE ROW LEVEL SECURITY;

-- Users can view their own reviews
CREATE POLICY "Users can view their own reviews" ON public.show_reviews 
  FOR SELECT USING (auth.uid() = user_id);

-- Users can insert their own reviews
CREATE POLICY "Users can insert their own reviews" ON public.show_reviews 
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can update their own reviews
CREATE POLICY "Users can update their own reviews" ON public.show_reviews 
  FOR UPDATE USING (auth.uid() = user_id);

-- Users can delete their own reviews
CREATE POLICY "Users can delete their own reviews" ON public.show_reviews 
  FOR DELETE USING (auth.uid() = user_id);

-- Add trigger for updated_at
CREATE TRIGGER update_show_reviews_updated_at
  BEFORE UPDATE ON public.show_reviews
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();