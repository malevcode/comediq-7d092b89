ALTER TABLE public.user_mic_ratings
ADD CONSTRAINT user_mic_ratings_user_mic_unique UNIQUE (user_id, mic_unique_identifier);