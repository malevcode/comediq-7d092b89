GRANT SELECT ON public.mic_verifications TO anon, authenticated;

DROP TRIGGER IF EXISTS on_mic_verification ON public.mic_verifications;

CREATE TRIGGER on_mic_verification
AFTER INSERT OR UPDATE OF verified_at, status ON public.mic_verifications
FOR EACH ROW EXECUTE FUNCTION public.update_mic_last_verified();
