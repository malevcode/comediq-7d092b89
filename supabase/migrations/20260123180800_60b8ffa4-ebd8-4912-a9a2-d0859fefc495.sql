-- Fix Security Definer Views - make them SECURITY INVOKER
DROP VIEW IF EXISTS public.mic_comment_counts;
DROP VIEW IF EXISTS public.mic_saved_counts;

CREATE VIEW public.mic_comment_counts 
WITH (security_invoker = true) AS
SELECT mic_unique_identifier, COUNT(*) as comment_count
FROM public.mic_comments
GROUP BY mic_unique_identifier;

CREATE VIEW public.mic_saved_counts
WITH (security_invoker = true) AS
SELECT mic_unique_identifier, COUNT(*) as saved_count
FROM public.saved_mics
GROUP BY mic_unique_identifier;