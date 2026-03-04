
-- Create growth_opportunities table
CREATE TABLE public.growth_opportunities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  type text NOT NULL CHECK (type IN ('barking', 'festival', 'school_ad')),
  title text NOT NULL,
  description text,
  venue_name text,
  borough text,
  date date,
  time text,
  compensation text,
  contact_info text,
  external_url text,
  image_url text,
  is_featured boolean NOT NULL DEFAULT false,
  is_active boolean NOT NULL DEFAULT true,
  submitted_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  contact_id uuid REFERENCES public.ad_contacts(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.growth_opportunities ENABLE ROW LEVEL SECURITY;

-- Public read for active entries
CREATE POLICY "Anyone can view active opportunities"
  ON public.growth_opportunities FOR SELECT
  USING (is_active = true);

-- Authenticated users can submit their own
CREATE POLICY "Authenticated users can submit opportunities"
  ON public.growth_opportunities FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = submitted_by);

-- Admin full access
CREATE POLICY "Admins have full access to opportunities"
  ON public.growth_opportunities FOR ALL
  TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.user_id = auth.uid() AND profiles.isadmin = true))
  WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE profiles.user_id = auth.uid() AND profiles.isadmin = true));

-- Updated_at trigger
CREATE TRIGGER update_growth_opportunities_updated_at
  BEFORE UPDATE ON public.growth_opportunities
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
