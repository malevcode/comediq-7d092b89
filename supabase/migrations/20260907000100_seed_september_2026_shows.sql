-- Seed shows collected from NYC hosts in September 2026.
--
-- source is NULL on every row. fetchAudienceShows() and the public SELECT RLS
-- policy only admit rows where source IS NULL or source matches an approved
-- venue_sources key, so a non-null source here would make the show invisible.
--
-- Every row carries an instagram_handle. That is the one hard requirement: a
-- listing must always give the user somewhere to go for whatever we do not
-- have yet.
--
-- Money is never routed through Comediq for these. is_paid stays false and
-- price_cents stays null, so no Stripe checkout button renders. Cover charges
-- and drink minimums live in the free-text ticket_price field instead.
--
-- Shows whose only known date had already passed (Zofia's Hideout Aug 27,
-- Love & Laughs Sep 5, Flop House EV Sep 3) are deliberately not seeded here.
-- They are handled by host outreach and added once a future date arrives.
--
-- Every insert is guarded by NOT EXISTS so the migration can be re-run safely.

-- ---------------------------------------------------------------------------
-- One-off and TBA shows
-- ---------------------------------------------------------------------------

INSERT INTO public.audience_shows (
  title, venue_name, venue_address, borough, show_date, show_time,
  description, ticket_price, show_type, instagram_handle, age_restriction,
  is_featured, status, verified, is_recurring, is_active,
  is_paid, allows_rsvp, price_cents, source
)
SELECT v.* FROM (VALUES
  -- Complete listing. The flyer gave date, time, price, drink minimum and address.
  (
    'Gilded Age Comedy presents Ladies Night',
    'The Alchemist',
    '1363 N Railroad Ave, Staten Island, NY 10306'::text,
    'Staten Island'::text,
    DATE '2026-09-20',
    TIME '19:00',
    'Ladies Night at the Laugh Lounge, presented by Gilded Age Comedy. $20 at the door with a 2 drink minimum.',
    '$20 + 2 drink minimum'::text,
    'Stand-up',
    '@carlosknowscomedy',
    NULL::text,
    false, 'active', true, false, true,
    false, false, NULL::integer, NULL::text
  ),
  -- Venue confirmed as QED Astoria. Street address is still to be confirmed by
  -- the host, so it stays null rather than being guessed at.
  (
    'Sitcom NYC',
    'QED Astoria',
    NULL,
    'Queens',
    DATE '2026-09-22',
    TIME '21:00',
    'Comedy show from @sitcomnyc at QED in Astoria. Street address pending confirmation, check @sitcomnyc for the latest.',
    NULL,
    'Stand-up',
    '@sitcomnyc',
    NULL,
    false, 'active', true, false, true,
    false, false, NULL, NULL
  ),
  -- These two hosts gave a date and nothing else. They are listed with their
  -- handle so a user always has somewhere to go; venue and time follow once
  -- the host replies to outreach.
  (
    'Clocked Off Comedy',
    'Venue TBA',
    NULL,
    NULL,
    DATE '2026-09-20',
    NULL,
    'Venue and start time are not confirmed yet. Check @clockedoffcomedy for details.',
    NULL,
    'Stand-up',
    '@clockedoffcomedy',
    NULL,
    false, 'active', true, false, true,
    false, false, NULL, NULL
  ),
  (
    'Livin 4 Laughs',
    'Venue TBA',
    NULL,
    NULL,
    DATE '2026-10-03',
    NULL,
    'Venue and start time are not confirmed yet. Check @livin.4.laughs for details.',
    NULL,
    'Stand-up',
    '@livin.4.laughs',
    NULL,
    false, 'active', true, false, true,
    false, false, NULL, NULL
  )
) AS v(title, venue_name, venue_address, borough, show_date, show_time,
       description, ticket_price, show_type, instagram_handle, age_restriction,
       is_featured, status, verified, is_recurring, is_active,
       is_paid, allows_rsvp, price_cents, source)
WHERE NOT EXISTS (
  SELECT 1 FROM public.audience_shows existing
  WHERE existing.title = v.title AND existing.show_date = v.show_date
);

-- ---------------------------------------------------------------------------
-- The Girl Show: monthly template plus six materialized instances
-- ---------------------------------------------------------------------------
--
-- The feed filters on is_recurring = false, so the template never renders.
-- Only the dated instances below appear on the Laugh tab.
--
-- The existing instance generator (20260211011416) only understands weekly
-- recurrence, so these monthly dates are seeded by hand. Each one is a
-- verified first Sunday: 2026-10-04, 2026-11-01, 2026-12-06, 2027-01-03,
-- 2027-02-07, 2027-03-07.

INSERT INTO public.audience_shows (
  title, venue_name, venue_address, borough, show_date, show_time,
  description, ticket_price, show_type, instagram_handle, age_restriction,
  is_featured, status, verified, is_recurring, recurrence_pattern, recurrence_day,
  is_active, is_paid, allows_rsvp, price_cents, source
)
SELECT
  'The Girl Show',
  'Whiskey Cellar (Backroom)',
  '77 E 7th St, New York, NY 10003',
  'Manhattan',
  DATE '2026-10-04',
  TIME '19:00',
  'All-female comedy lineup in the Whiskey Cellar backroom in the East Village. Free sweet treats and trivia with kitchenware prizes. Free to attend, donations accepted, 1 drink minimum.',
  'Free (donations accepted) + 1 drink minimum',
  'Stand-up',
  '@the_girlshow',
  NULL,
  false, 'active', true, true, 'monthly', 'sunday',
  true, false, false, NULL, NULL
WHERE NOT EXISTS (
  SELECT 1 FROM public.audience_shows
  WHERE title = 'The Girl Show' AND is_recurring = true
);

INSERT INTO public.audience_shows (
  title, venue_name, venue_address, borough, show_date, show_time,
  description, ticket_price, show_type, instagram_handle, age_restriction,
  is_featured, status, verified, is_recurring, parent_show_id,
  is_active, is_paid, allows_rsvp, price_cents, source
)
SELECT
  t.title, t.venue_name, t.venue_address, t.borough, d.show_date, t.show_time,
  t.description, t.ticket_price, t.show_type, t.instagram_handle, t.age_restriction,
  t.is_featured, 'active', true, false, t.id,
  true, false, false, NULL, NULL
FROM public.audience_shows t
CROSS JOIN (VALUES
  (DATE '2026-10-04'), (DATE '2026-11-01'), (DATE '2026-12-06'),
  (DATE '2027-01-03'), (DATE '2027-02-07'), (DATE '2027-03-07')
) AS d(show_date)
WHERE t.title = 'The Girl Show'
  AND t.is_recurring = true
  AND NOT EXISTS (
    SELECT 1 FROM public.audience_shows existing
    WHERE existing.parent_show_id = t.id
      AND existing.show_date = d.show_date
  );
