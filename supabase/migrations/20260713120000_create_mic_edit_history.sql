-- Foundation for the revert mechanism (see EDITING_MODEL_PLAN.md):
-- whenever a mic listing field gets overwritten, the old value is saved
-- here first so nothing is ever permanently erased. The revert UI itself
-- is not wired up yet; this is the append-only storage for it.
CREATE TABLE IF NOT EXISTS public.mic_edit_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  mic_unique_identifier text NOT NULL,
  editor_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  field_name text NOT NULL,
  old_value text,
  new_value text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_mic_edit_history_mic
  ON public.mic_edit_history (mic_unique_identifier, created_at DESC);

ALTER TABLE public.mic_edit_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Edit history is publicly readable"
ON public.mic_edit_history
FOR SELECT
USING (true);

CREATE POLICY "Authenticated users can record edits"
ON public.mic_edit_history
FOR INSERT
TO authenticated
WITH CHECK (true);

-- Intentionally no UPDATE or DELETE policies: history is append-only.
