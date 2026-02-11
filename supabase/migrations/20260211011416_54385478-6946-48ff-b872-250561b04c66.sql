
-- Generate upcoming show instances for active recurring templates
-- Next 4 weeks from today (2026-02-11)

-- Helper: day-of-week mapping
-- sunday=0, monday=1, tuesday=2, wednesday=3, thursday=4, friday=5, saturday=6

INSERT INTO public.audience_shows (
  title, venue_name, venue_address, borough, show_date, show_time, doors_time,
  description, lineup, ticket_url, ticket_price, show_type, host_name,
  instagram_handle, image_url, expected_audience, age_restriction,
  is_featured, status, verified, is_recurring, recurrence_pattern, recurrence_day,
  parent_show_id, is_active, external_ticket_url, price_cents, is_paid, allows_rsvp
)
SELECT
  t.title, t.venue_name, t.venue_address, t.borough,
  d.show_date,
  t.show_time, t.doors_time,
  t.description, t.lineup, t.ticket_url, t.ticket_price, t.show_type, t.host_name,
  t.instagram_handle, t.image_url, t.expected_audience, t.age_restriction,
  t.is_featured, 'active', true, false, null, null,
  t.id, true, t.external_ticket_url, t.price_cents, t.is_paid, t.allows_rsvp
FROM audience_shows t
CROSS JOIN LATERAL (
  SELECT generate_series(
    -- Find the next occurrence of the target day from today
    CURRENT_DATE + ((CASE t.recurrence_day
      WHEN 'sunday' THEN 0
      WHEN 'monday' THEN 1
      WHEN 'tuesday' THEN 2
      WHEN 'wednesday' THEN 3
      WHEN 'thursday' THEN 4
      WHEN 'friday' THEN 5
      WHEN 'saturday' THEN 6
    END - EXTRACT(DOW FROM CURRENT_DATE)::int + 7) % 7)::int * INTERVAL '1 day',
    CURRENT_DATE + INTERVAL '28 days',
    INTERVAL '7 days'
  )::date AS show_date
) d
WHERE t.is_recurring = true
  AND t.is_active = true
  AND t.verified = true
  -- Don't insert duplicates
  AND NOT EXISTS (
    SELECT 1 FROM audience_shows existing
    WHERE existing.parent_show_id = t.id
      AND existing.show_date = d.show_date
  );
