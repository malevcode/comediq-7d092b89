-- Public read access to mic vote counts, without publishing who voted.
--
-- The problem: public.mic_like_counts is security_invoker (set deliberately in
-- 20260806003000_repair_public_rls_and_view_security.sql), so it runs with the
-- caller's rights and inherits RLS on user_mic_ratings. Anonymous visitors have
-- no select policy there, so the view returns permission denied and the
-- /leaderboard page cannot load for anyone who is not signed in. That is most
-- of the audience for a contest promoted by a public voting form.
--
-- The fix we are NOT doing: granting select on user_mic_ratings to anon. That
-- table holds user_id, mic_unique_identifier and rating, so it would publish
-- exactly which comedian upvoted or downvoted which room. In a scene this size
-- that is a real harm, and it is not needed to show a leaderboard.
--
-- What this does instead: one security definer function that reads the view
-- with the owner's rights and returns only the aggregate. Individual votes stay
-- unreadable. The view keeps security_invoker, so the earlier hardening is not
-- reversed for any other caller.
--
-- It returns json rather than a typed table on purpose: user_mic_ratings was
-- created outside migrations, so the concrete type of mic_unique_identifier is
-- not knowable from this repo, and json sidesteps having to guess it.

create or replace function public.get_mic_like_counts(
  min_likes int default 1,
  row_limit int default 120
)
returns json
language sql
stable
security definer
-- Pinned so the body cannot be redirected by a caller's search_path.
set search_path = public, pg_temp
as $$
  select coalesce(json_agg(t), '[]'::json)
  from (
    select mic_unique_identifier, likes
    from public.mic_like_counts
    where likes >= greatest(min_likes, 1)
    order by likes desc
    -- Hard ceiling regardless of what a caller asks for, so this can never be
    -- turned into a bulk export of the whole table by passing a huge limit.
    limit least(greatest(row_limit, 1), 500)
  ) t;
$$;

comment on function public.get_mic_like_counts(int, int) is
  'Aggregate upvote counts per mic for the public leaderboard. Security definer so anonymous visitors can read counts without read access to individual votes in user_mic_ratings.';

revoke all on function public.get_mic_like_counts(int, int) from public;
grant execute on function public.get_mic_like_counts(int, int) to anon, authenticated;
