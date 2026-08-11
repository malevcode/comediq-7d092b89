-- Allow public mic cards to read comments.
-- Row-level security still controls visibility; the existing SELECT policy allows public reads.
GRANT SELECT ON public.mic_comments TO anon;
GRANT SELECT ON public.mic_comments TO authenticated;

-- Keep comment writes limited to signed-in users through the existing RLS ownership policies.
GRANT INSERT, UPDATE, DELETE ON public.mic_comments TO authenticated;
