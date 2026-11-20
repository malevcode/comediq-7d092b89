-- "Claim This Mic" failed with: Could not choose the best candidate function between
-- public.claim_mic_host(p_mic_id => text) and public.claim_mic_host(p_mic_id => uuid).
-- Two versions of the function existed; the text one is the one to keep.
drop function if exists public.claim_mic_host(uuid);
