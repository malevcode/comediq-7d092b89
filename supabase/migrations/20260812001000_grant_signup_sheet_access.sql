GRANT SELECT ON public.mic_signup_events TO anon, authenticated;
GRANT SELECT ON public.mic_signups TO anon, authenticated;

GRANT SELECT ON public.mic_hosts TO authenticated;
GRANT INSERT ON public.mic_hosts TO authenticated;

GRANT INSERT ON public.mic_signup_events TO authenticated;
GRANT UPDATE ON public.mic_signup_events TO authenticated;

GRANT INSERT ON public.mic_signups TO authenticated;
GRANT UPDATE ON public.mic_signups TO authenticated;
