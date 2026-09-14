CREATE OR REPLACE FUNCTION public.get_mic_like_counts(min_likes integer DEFAULT 1, row_limit integer DEFAULT 120)
RETURNS TABLE (mic_unique_identifier text, likes integer, dislikes integer)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    r.mic_unique_identifier,
    count(*) FILTER (WHERE r.rating = 'like')::integer AS likes,
    count(*) FILTER (WHERE r.rating = 'dislike')::integer AS dislikes
  FROM public.user_mic_ratings AS r
  GROUP BY r.mic_unique_identifier
  HAVING count(*) FILTER (WHERE r.rating = 'like') >= greatest(min_likes, 0)
  ORDER BY likes DESC, r.mic_unique_identifier ASC
  LIMIT least(greatest(row_limit, 1), 500)
$$;

REVOKE ALL ON FUNCTION public.get_mic_like_counts(integer, integer) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_mic_like_counts(integer, integer) TO anon, authenticated, service_role;