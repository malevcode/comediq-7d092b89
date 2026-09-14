CREATE TABLE public.mic_rating_totals (
  mic_unique_identifier text PRIMARY KEY,
  likes integer NOT NULL DEFAULT 0,
  dislikes integer NOT NULL DEFAULT 0,
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.mic_rating_totals TO anon, authenticated;
GRANT ALL ON public.mic_rating_totals TO service_role;

ALTER TABLE public.mic_rating_totals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Mic rating totals are publicly readable"
ON public.mic_rating_totals
FOR SELECT
TO anon, authenticated
USING (true);

INSERT INTO public.mic_rating_totals (mic_unique_identifier, likes, dislikes)
SELECT
  mic_unique_identifier,
  count(*) FILTER (WHERE rating = 'like')::integer,
  count(*) FILTER (WHERE rating = 'dislike')::integer
FROM public.user_mic_ratings
GROUP BY mic_unique_identifier;

CREATE OR REPLACE FUNCTION public.refresh_mic_rating_total(p_mic_unique_identifier text)
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  INSERT INTO public.mic_rating_totals (mic_unique_identifier, likes, dislikes, updated_at)
  SELECT
    p_mic_unique_identifier,
    count(*) FILTER (WHERE rating = 'like')::integer,
    count(*) FILTER (WHERE rating = 'dislike')::integer,
    now()
  FROM public.user_mic_ratings
  WHERE mic_unique_identifier = p_mic_unique_identifier
  ON CONFLICT (mic_unique_identifier) DO UPDATE
  SET likes = EXCLUDED.likes,
      dislikes = EXCLUDED.dislikes,
      updated_at = EXCLUDED.updated_at;
$$;

REVOKE ALL ON FUNCTION public.refresh_mic_rating_total(text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.refresh_mic_rating_total(text) TO service_role;

CREATE OR REPLACE FUNCTION public.sync_mic_rating_total()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    PERFORM public.refresh_mic_rating_total(OLD.mic_unique_identifier);
    RETURN OLD;
  END IF;

  PERFORM public.refresh_mic_rating_total(NEW.mic_unique_identifier);

  IF TG_OP = 'UPDATE' AND OLD.mic_unique_identifier IS DISTINCT FROM NEW.mic_unique_identifier THEN
    PERFORM public.refresh_mic_rating_total(OLD.mic_unique_identifier);
  END IF;

  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.sync_mic_rating_total() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.sync_mic_rating_total() TO service_role;

CREATE TRIGGER sync_mic_rating_totals_after_vote
AFTER INSERT OR UPDATE OR DELETE ON public.user_mic_ratings
FOR EACH ROW
EXECUTE FUNCTION public.sync_mic_rating_total();

CREATE OR REPLACE FUNCTION public.get_mic_like_counts(min_likes integer DEFAULT 1, row_limit integer DEFAULT 120)
RETURNS TABLE (mic_unique_identifier text, likes integer, dislikes integer)
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = public
AS $$
  SELECT t.mic_unique_identifier, t.likes, t.dislikes
  FROM public.mic_rating_totals AS t
  WHERE t.likes >= greatest(min_likes, 0)
  ORDER BY t.likes DESC, t.mic_unique_identifier ASC
  LIMIT least(greatest(row_limit, 1), 500)
$$;

REVOKE ALL ON FUNCTION public.get_mic_like_counts(integer, integer) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_mic_like_counts(integer, integer) TO anon, authenticated, service_role;