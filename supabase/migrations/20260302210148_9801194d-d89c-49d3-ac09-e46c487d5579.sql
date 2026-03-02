
-- Create venue_sources table
CREATE TABLE public.venue_sources (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  source_key text UNIQUE NOT NULL,
  venue_name text NOT NULL,
  is_active boolean NOT NULL DEFAULT false,
  permission_status text NOT NULL DEFAULT 'pending',
  contact_name text,
  contact_email text,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.venue_sources ENABLE ROW LEVEL SECURITY;

-- Admin full access
CREATE POLICY "Admins can manage venue_sources"
ON public.venue_sources FOR ALL
TO authenticated
USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.user_id = auth.uid() AND profiles.isadmin = true))
WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE profiles.user_id = auth.uid() AND profiles.isadmin = true));

-- Public can see active venues
CREATE POLICY "Public can view active venues"
ON public.venue_sources FOR SELECT
TO anon, authenticated
USING (is_active = true);

-- Trigger for updated_at
CREATE TRIGGER update_venue_sources_updated_at
BEFORE UPDATE ON public.venue_sources
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Seed existing scraped clubs (inactive by default)
INSERT INTO public.venue_sources (source_key, venue_name, is_active, permission_status) VALUES
  ('nycc', 'New York Comedy Club', false, 'pending'),
  ('grislypear', 'Grisly Pear', false, 'pending'),
  ('stmarks', 'St. Marks Comedy Club', false, 'pending');

-- Update audience_shows public SELECT policy to gate on venue_sources
DROP POLICY IF EXISTS "Anyone can view verified active shows" ON public.audience_shows;

CREATE POLICY "Anyone can view verified active shows"
ON public.audience_shows FOR SELECT
TO anon, authenticated
USING (
  verified = true
  AND status = 'active'
  AND (
    source IS NULL
    OR EXISTS (
      SELECT 1 FROM public.venue_sources vs
      WHERE vs.source_key = audience_shows.source
      AND vs.is_active = true
    )
  )
);

-- Create admin_todos table
CREATE TABLE public.admin_todos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category text NOT NULL,
  title text NOT NULL,
  description text,
  status text NOT NULL DEFAULT 'todo',
  priority text NOT NULL DEFAULT 'medium',
  assigned_to text,
  due_date date,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.admin_todos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage admin_todos"
ON public.admin_todos FOR ALL
TO authenticated
USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.user_id = auth.uid() AND profiles.isadmin = true))
WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE profiles.user_id = auth.uid() AND profiles.isadmin = true));

CREATE TRIGGER update_admin_todos_updated_at
BEFORE UPDATE ON public.admin_todos
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
