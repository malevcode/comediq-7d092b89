-- Update the type check constraint to include 'podcast'
ALTER TABLE growth_opportunities DROP CONSTRAINT growth_opportunities_type_check;
ALTER TABLE growth_opportunities ADD CONSTRAINT growth_opportunities_type_check CHECK (type = ANY (ARRAY['barking'::text, 'festival'::text, 'school_ad'::text, 'podcast'::text]));

-- Seed the Likeable podcast
INSERT INTO growth_opportunities (title, type, description, venue_name, contact_info, external_url, compensation, is_featured, is_active, status)
VALUES (
  'Likeable with David Stickle',
  'podcast',
  'Stand-up comedy from an entry level perspective. Each week David Stickle sits down with comedians at every stage of the game for real, unfiltered conversations about the craft, the hustle, and what it actually takes to make people laugh. 40 episodes in and just getting started.',
  'Likeable',
  '@likeablepod',
  'https://www.youtube.com/playlist?list=PLnHfEX5rBprYo7ASx3JK_PLnJCTvNFnx',
  'Weekly (every Wednesday)',
  true,
  true,
  'approved'
);