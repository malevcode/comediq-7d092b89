-- Mic comments become the place people report wrong data.
--
-- The table, its RLS and its grants already existed and worked; the UI trigger
-- was simply removed at some point, so nothing could reach it. Turning it back
-- on needs three things the original schema does not have.

-- 1. Room to write an actual report.
--
-- The original CHECK capped a comment at 180 characters, which is a tweet. The
-- comments this feature wants read like "cover went up to $10, and Ashley said
-- no mic next Monday because of the holiday" and do not fit.
ALTER TABLE public.mic_comments
  DROP CONSTRAINT IF EXISTS mic_comments_comment_text_check;

ALTER TABLE public.mic_comments
  ADD CONSTRAINT mic_comments_comment_text_check
  CHECK (length(comment_text) <= 1000);

-- 2. An admin has to be able to delete a comment.
--
-- Public threads mean spam and venue drama eventually. The author can already
-- delete their own; this is the only moderation tool shipping with it, which is
-- deliberate. Uses the same two helpers every other admin policy here uses
-- (20260813090000_fix_motd_admin_rls.sql), which cover both profiles.isadmin and
-- user_roles.role = 'admin'.
DROP POLICY IF EXISTS "Admins can delete any comment" ON public.mic_comments;

CREATE POLICY "Admins can delete any comment"
ON public.mic_comments FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin') OR public.is_current_user_admin());

-- 3. The comment-count view has to be readable by signed-out visitors.
--
-- mic_comment_counts is security_invoker over mic_comments and carries no GRANT
-- of its own anywhere in the migrations, while mic_comments itself needed an
-- explicit grant migration (20260805002000) before anyone could read it. That
-- combination is exactly what broke upvoting for two weeks: mic_like_counts was
-- security_invoker over a table anonymous visitors had no policy on, so every
-- signed-out read came back empty and no error was raised. mic_comments does
-- have a public SELECT policy, so the view should already work, but granting it
-- explicitly costs nothing and removes the whole failure mode.
GRANT SELECT ON public.mic_comment_counts TO anon;
GRANT SELECT ON public.mic_comment_counts TO authenticated;

-- Note on the missing foreign key: mic_comments.mic_unique_identifier is uuid
-- while open_mics_historical.unique_identifier is text, so a plain FK will not
-- attach. The identifiers really are UUIDs in the data, so this is fixable, but
-- it needs a column retype on a live table and buys only orphan cleanup. Left
-- out of this migration on purpose rather than done hastily alongside a UI change.
