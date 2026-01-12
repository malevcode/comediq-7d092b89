-- Add recurring show support columns to audience_shows
ALTER TABLE public.audience_shows
ADD COLUMN IF NOT EXISTS is_recurring boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS recurrence_pattern text,
ADD COLUMN IF NOT EXISTS recurrence_day text,
ADD COLUMN IF NOT EXISTS parent_show_id uuid REFERENCES public.audience_shows(id),
ADD COLUMN IF NOT EXISTS is_active boolean DEFAULT true;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_audience_shows_parent ON public.audience_shows(parent_show_id);
CREATE INDEX IF NOT EXISTS idx_audience_shows_active ON public.audience_shows(is_active);
CREATE INDEX IF NOT EXISTS idx_audience_shows_recurring ON public.audience_shows(is_recurring);

-- Insert St. Mark's Comedy Club recurring templates (PAID, ACTIVE)
INSERT INTO public.audience_shows (title, venue_name, venue_address, borough, show_time, doors_time, description, show_type, is_paid, allows_rsvp, age_restriction, is_recurring, recurrence_pattern, recurrence_day, is_active, verified, status, show_date, price_cents)
VALUES
('Sunday Late Show', 'St. Mark''s Comedy Club', '12 St Marks Place, New York, NY 10003', 'Manhattan', '21:30', '21:00', 'Late night comedy at one of NYC''s most iconic venues. Featuring top NYC comedians and special guests.', 'standup', true, false, '21+', true, 'weekly', 'sunday', true, true, 'active', '2026-01-12', 2500),
('Tuesday Late Show', 'St. Mark''s Comedy Club', '12 St Marks Place, New York, NY 10003', 'Manhattan', '21:30', '21:00', 'Weeknight comedy showcasing the best up-and-coming talent in NYC.', 'standup', true, false, '21+', true, 'weekly', 'tuesday', true, true, 'active', '2026-01-13', 2000),
('Wednesday Early Show', 'St. Mark''s Comedy Club', '12 St Marks Place, New York, NY 10003', 'Manhattan', '19:30', '19:00', 'Early bird comedy show - perfect for a weeknight laugh before heading home.', 'standup', true, false, '21+', true, 'weekly', 'wednesday', true, true, 'active', '2026-01-14', 1500),
('Thursday Late Show', 'St. Mark''s Comedy Club', '12 St Marks Place, New York, NY 10003', 'Manhattan', '21:30', '21:00', 'Thursday night comedy featuring a rotating lineup of NYC''s finest comedians.', 'standup', true, false, '21+', true, 'weekly', 'thursday', true, true, 'active', '2026-01-15', 2000);

-- Insert Luxor Lounge recurring templates (FREE RSVP, ACTIVE)
INSERT INTO public.audience_shows (title, venue_name, venue_address, borough, show_time, doors_time, description, show_type, is_paid, allows_rsvp, external_ticket_url, is_recurring, recurrence_pattern, recurrence_day, is_active, verified, status, show_date, price_cents)
VALUES
('Laughs at Lux - Tuesday', 'Luxor Lounge', '116 MacDougal Street, New York, NY 10012', 'Manhattan', '21:00', '20:30', 'Free comedy night in the heart of Greenwich Village. RSVP required.', 'standup', false, true, 'https://www.eventbrite.com/e/laughs-at-lux-tickets-1366037698529', true, 'weekly', 'tuesday', true, true, 'active', '2026-01-13', null),
('Laughs at Lux - Thursday', 'Luxor Lounge', '116 MacDougal Street, New York, NY 10012', 'Manhattan', '21:00', '20:30', 'Free comedy night in the heart of Greenwich Village. RSVP required.', 'standup', false, true, 'https://www.eventbrite.com/e/laughs-at-lux-tickets-1366037698529', true, 'weekly', 'thursday', true, true, 'active', '2026-01-15', null),
('Laughs at Lux - Sunday', 'Luxor Lounge', '116 MacDougal Street, New York, NY 10012', 'Manhattan', '21:00', '20:30', 'Free comedy night in the heart of Greenwich Village. RSVP required.', 'standup', false, true, 'https://www.eventbrite.com/e/laughs-at-lux-tickets-1366037698529', true, 'weekly', 'sunday', true, true, 'active', '2026-01-12', null);

-- Insert Brooklyn Art Haus recurring template (FREE RSVP, ACTIVE)
INSERT INTO public.audience_shows (title, venue_name, venue_address, borough, show_time, doors_time, description, show_type, is_paid, allows_rsvp, external_ticket_url, is_recurring, recurrence_pattern, recurrence_day, is_active, verified, status, show_date, price_cents)
VALUES
('Malev & Friends Comedy Show', 'Brooklyn Art Haus', '24 Marcy Avenue, Brooklyn, NY 11211', 'Brooklyn', '21:00', '20:30', 'Weekly Saturday night comedy show in Williamsburg featuring Malev and rotating special guests.', 'standup', false, true, 'https://www.eventbrite.com/e/malevfriends-comedy-show-tickets-1976414851023', true, 'weekly', 'saturday', true, true, 'active', '2026-01-17', null);

-- Insert The Comedy Shop recurring templates (PAID, INACTIVE - ready to deploy)
INSERT INTO public.audience_shows (title, venue_name, venue_address, borough, show_time, doors_time, description, show_type, is_paid, allows_rsvp, age_restriction, is_recurring, recurrence_pattern, recurrence_day, is_active, verified, status, show_date, price_cents)
VALUES
('Monday Night Comedy', 'The Comedy Shop', '23 MacDougal Street, New York, NY 10012', 'Manhattan', '20:00', '19:30', 'Start your week with laughs at The Comedy Shop.', 'standup', true, false, '21+', true, 'weekly', 'monday', false, false, 'active', '2026-01-12', 1500),
('Tuesday Night Comedy', 'The Comedy Shop', '23 MacDougal Street, New York, NY 10012', 'Manhattan', '20:00', '19:30', 'Tuesday night comedy featuring NYC''s best.', 'standup', true, false, '21+', true, 'weekly', 'tuesday', false, false, 'active', '2026-01-13', 1500),
('Wednesday Night Comedy', 'The Comedy Shop', '23 MacDougal Street, New York, NY 10012', 'Manhattan', '20:00', '19:30', 'Midweek comedy to get you through the week.', 'standup', true, false, '21+', true, 'weekly', 'wednesday', false, false, 'active', '2026-01-14', 1500),
('Thursday Night Comedy', 'The Comedy Shop', '23 MacDougal Street, New York, NY 10012', 'Manhattan', '20:00', '19:30', 'Thursday night showcase at The Comedy Shop.', 'standup', true, false, '21+', true, 'weekly', 'thursday', false, false, 'active', '2026-01-15', 2000);

-- Generate show instances for the next 4 weeks from St. Mark's templates
-- Week 1: Jan 12-18
INSERT INTO public.audience_shows (title, venue_name, venue_address, borough, show_date, show_time, doors_time, description, show_type, is_paid, allows_rsvp, age_restriction, parent_show_id, is_active, verified, status, price_cents)
SELECT title, venue_name, venue_address, borough, 
  CASE recurrence_day
    WHEN 'sunday' THEN '2026-01-12'::date
    WHEN 'tuesday' THEN '2026-01-13'::date
    WHEN 'wednesday' THEN '2026-01-14'::date
    WHEN 'thursday' THEN '2026-01-15'::date
  END,
  show_time, doors_time, description, show_type, is_paid, allows_rsvp, age_restriction, id, is_active, verified, status, price_cents
FROM public.audience_shows
WHERE venue_name = 'St. Mark''s Comedy Club' AND is_recurring = true;

-- Week 2: Jan 19-25
INSERT INTO public.audience_shows (title, venue_name, venue_address, borough, show_date, show_time, doors_time, description, show_type, is_paid, allows_rsvp, age_restriction, parent_show_id, is_active, verified, status, price_cents)
SELECT title, venue_name, venue_address, borough, 
  CASE recurrence_day
    WHEN 'sunday' THEN '2026-01-19'::date
    WHEN 'tuesday' THEN '2026-01-20'::date
    WHEN 'wednesday' THEN '2026-01-21'::date
    WHEN 'thursday' THEN '2026-01-22'::date
  END,
  show_time, doors_time, description, show_type, is_paid, allows_rsvp, age_restriction, id, is_active, verified, status, price_cents
FROM public.audience_shows
WHERE venue_name = 'St. Mark''s Comedy Club' AND is_recurring = true;

-- Week 3: Jan 26 - Feb 1
INSERT INTO public.audience_shows (title, venue_name, venue_address, borough, show_date, show_time, doors_time, description, show_type, is_paid, allows_rsvp, age_restriction, parent_show_id, is_active, verified, status, price_cents)
SELECT title, venue_name, venue_address, borough, 
  CASE recurrence_day
    WHEN 'sunday' THEN '2026-01-26'::date
    WHEN 'tuesday' THEN '2026-01-27'::date
    WHEN 'wednesday' THEN '2026-01-28'::date
    WHEN 'thursday' THEN '2026-01-29'::date
  END,
  show_time, doors_time, description, show_type, is_paid, allows_rsvp, age_restriction, id, is_active, verified, status, price_cents
FROM public.audience_shows
WHERE venue_name = 'St. Mark''s Comedy Club' AND is_recurring = true;

-- Week 4: Feb 2-8
INSERT INTO public.audience_shows (title, venue_name, venue_address, borough, show_date, show_time, doors_time, description, show_type, is_paid, allows_rsvp, age_restriction, parent_show_id, is_active, verified, status, price_cents)
SELECT title, venue_name, venue_address, borough, 
  CASE recurrence_day
    WHEN 'sunday' THEN '2026-02-02'::date
    WHEN 'tuesday' THEN '2026-02-03'::date
    WHEN 'wednesday' THEN '2026-02-04'::date
    WHEN 'thursday' THEN '2026-02-05'::date
  END,
  show_time, doors_time, description, show_type, is_paid, allows_rsvp, age_restriction, id, is_active, verified, status, price_cents
FROM public.audience_shows
WHERE venue_name = 'St. Mark''s Comedy Club' AND is_recurring = true;

-- Generate Luxor Lounge instances for 4 weeks
-- Week 1
INSERT INTO public.audience_shows (title, venue_name, venue_address, borough, show_date, show_time, doors_time, description, show_type, is_paid, allows_rsvp, external_ticket_url, parent_show_id, is_active, verified, status)
SELECT title, venue_name, venue_address, borough, 
  CASE recurrence_day
    WHEN 'sunday' THEN '2026-01-12'::date
    WHEN 'tuesday' THEN '2026-01-13'::date
    WHEN 'thursday' THEN '2026-01-15'::date
  END,
  show_time, doors_time, description, show_type, is_paid, allows_rsvp, external_ticket_url, id, is_active, verified, status
FROM public.audience_shows
WHERE venue_name = 'Luxor Lounge' AND is_recurring = true;

-- Week 2
INSERT INTO public.audience_shows (title, venue_name, venue_address, borough, show_date, show_time, doors_time, description, show_type, is_paid, allows_rsvp, external_ticket_url, parent_show_id, is_active, verified, status)
SELECT title, venue_name, venue_address, borough, 
  CASE recurrence_day
    WHEN 'sunday' THEN '2026-01-19'::date
    WHEN 'tuesday' THEN '2026-01-20'::date
    WHEN 'thursday' THEN '2026-01-22'::date
  END,
  show_time, doors_time, description, show_type, is_paid, allows_rsvp, external_ticket_url, id, is_active, verified, status
FROM public.audience_shows
WHERE venue_name = 'Luxor Lounge' AND is_recurring = true;

-- Week 3
INSERT INTO public.audience_shows (title, venue_name, venue_address, borough, show_date, show_time, doors_time, description, show_type, is_paid, allows_rsvp, external_ticket_url, parent_show_id, is_active, verified, status)
SELECT title, venue_name, venue_address, borough, 
  CASE recurrence_day
    WHEN 'sunday' THEN '2026-01-26'::date
    WHEN 'tuesday' THEN '2026-01-27'::date
    WHEN 'thursday' THEN '2026-01-29'::date
  END,
  show_time, doors_time, description, show_type, is_paid, allows_rsvp, external_ticket_url, id, is_active, verified, status
FROM public.audience_shows
WHERE venue_name = 'Luxor Lounge' AND is_recurring = true;

-- Week 4
INSERT INTO public.audience_shows (title, venue_name, venue_address, borough, show_date, show_time, doors_time, description, show_type, is_paid, allows_rsvp, external_ticket_url, parent_show_id, is_active, verified, status)
SELECT title, venue_name, venue_address, borough, 
  CASE recurrence_day
    WHEN 'sunday' THEN '2026-02-02'::date
    WHEN 'tuesday' THEN '2026-02-03'::date
    WHEN 'thursday' THEN '2026-02-05'::date
  END,
  show_time, doors_time, description, show_type, is_paid, allows_rsvp, external_ticket_url, id, is_active, verified, status
FROM public.audience_shows
WHERE venue_name = 'Luxor Lounge' AND is_recurring = true;

-- Generate Brooklyn Art Haus Saturday instances for 4 weeks
INSERT INTO public.audience_shows (title, venue_name, venue_address, borough, show_date, show_time, doors_time, description, show_type, is_paid, allows_rsvp, external_ticket_url, parent_show_id, is_active, verified, status)
SELECT title, venue_name, venue_address, borough, '2026-01-17'::date, show_time, doors_time, description, show_type, is_paid, allows_rsvp, external_ticket_url, id, is_active, verified, status
FROM public.audience_shows WHERE venue_name = 'Brooklyn Art Haus' AND is_recurring = true;

INSERT INTO public.audience_shows (title, venue_name, venue_address, borough, show_date, show_time, doors_time, description, show_type, is_paid, allows_rsvp, external_ticket_url, parent_show_id, is_active, verified, status)
SELECT title, venue_name, venue_address, borough, '2026-01-24'::date, show_time, doors_time, description, show_type, is_paid, allows_rsvp, external_ticket_url, id, is_active, verified, status
FROM public.audience_shows WHERE venue_name = 'Brooklyn Art Haus' AND is_recurring = true;

INSERT INTO public.audience_shows (title, venue_name, venue_address, borough, show_date, show_time, doors_time, description, show_type, is_paid, allows_rsvp, external_ticket_url, parent_show_id, is_active, verified, status)
SELECT title, venue_name, venue_address, borough, '2026-01-31'::date, show_time, doors_time, description, show_type, is_paid, allows_rsvp, external_ticket_url, id, is_active, verified, status
FROM public.audience_shows WHERE venue_name = 'Brooklyn Art Haus' AND is_recurring = true;

INSERT INTO public.audience_shows (title, venue_name, venue_address, borough, show_date, show_time, doors_time, description, show_type, is_paid, allows_rsvp, external_ticket_url, parent_show_id, is_active, verified, status)
SELECT title, venue_name, venue_address, borough, '2026-02-07'::date, show_time, doors_time, description, show_type, is_paid, allows_rsvp, external_ticket_url, id, is_active, verified, status
FROM public.audience_shows WHERE venue_name = 'Brooklyn Art Haus' AND is_recurring = true;