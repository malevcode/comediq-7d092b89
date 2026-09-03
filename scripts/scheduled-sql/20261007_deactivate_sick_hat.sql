-- RUN ON OR AFTER 2026-10-08.
-- Sick Hat, Wednesday 8:00 PM @ Cobra Club.
-- On hiatus after the final date of 10/7/26. Host said the mic may relocate,
-- so this is a soft deactivate — reactivate the same row if a new venue lands.
UPDATE public.open_mics_historical
SET active = false,
    other_rules = 'On hiatus after 10/7/26. May relocate venue, TBD.',
    last_verified = '10/07/26'
WHERE unique_identifier = '51495931-553e-44b2-846d-a643502ee193';
