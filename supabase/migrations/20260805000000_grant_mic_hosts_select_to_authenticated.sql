-- Allow signed-in users to query and request mic_hosts rows through the API.
-- Row-level security still limits returned rows to the existing policies.
GRANT SELECT, INSERT ON public.mic_hosts TO authenticated;
