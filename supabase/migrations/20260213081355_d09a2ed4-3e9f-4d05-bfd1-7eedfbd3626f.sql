
-- 1. Create ad_contacts table
CREATE TABLE public.ad_contacts (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  business_name text NOT NULL,
  contact_name text,
  email text,
  phone text,
  instagram text,
  website text,
  business_type text DEFAULT 'other',
  borough text,
  status text DEFAULT 'lead',
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.ad_contacts ENABLE ROW LEVEL SECURITY;

CREATE TRIGGER update_ad_contacts_updated_at
  BEFORE UPDATE ON public.ad_contacts
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 2. Create ad_contact_notes table
CREATE TABLE public.ad_contact_notes (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  contact_id uuid NOT NULL REFERENCES public.ad_contacts(id) ON DELETE CASCADE,
  note text NOT NULL,
  created_by uuid,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.ad_contact_notes ENABLE ROW LEVEL SECURITY;

-- 3. Create ad_outreach table
CREATE TABLE public.ad_outreach (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  contact_id uuid NOT NULL REFERENCES public.ad_contacts(id) ON DELETE CASCADE,
  outreach_date date DEFAULT CURRENT_DATE,
  method text DEFAULT 'email',
  subject text,
  outcome text DEFAULT 'no_reply',
  follow_up_date date,
  notes text,
  created_by uuid,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.ad_outreach ENABLE ROW LEVEL SECURITY;

-- 4. Add contact_id to banner_ads
ALTER TABLE public.banner_ads ADD COLUMN contact_id uuid REFERENCES public.ad_contacts(id);

-- 5. RLS policies for ad_contacts (admin-only)
CREATE POLICY "Admins can select ad_contacts" ON public.ad_contacts FOR SELECT
  USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.user_id = auth.uid() AND profiles.isadmin = true));

CREATE POLICY "Admins can insert ad_contacts" ON public.ad_contacts FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE profiles.user_id = auth.uid() AND profiles.isadmin = true));

CREATE POLICY "Admins can update ad_contacts" ON public.ad_contacts FOR UPDATE
  USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.user_id = auth.uid() AND profiles.isadmin = true));

CREATE POLICY "Admins can delete ad_contacts" ON public.ad_contacts FOR DELETE
  USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.user_id = auth.uid() AND profiles.isadmin = true));

-- RLS policies for ad_contact_notes (admin-only)
CREATE POLICY "Admins can select ad_contact_notes" ON public.ad_contact_notes FOR SELECT
  USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.user_id = auth.uid() AND profiles.isadmin = true));

CREATE POLICY "Admins can insert ad_contact_notes" ON public.ad_contact_notes FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE profiles.user_id = auth.uid() AND profiles.isadmin = true));

CREATE POLICY "Admins can delete ad_contact_notes" ON public.ad_contact_notes FOR DELETE
  USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.user_id = auth.uid() AND profiles.isadmin = true));

-- RLS policies for ad_outreach (admin-only)
CREATE POLICY "Admins can select ad_outreach" ON public.ad_outreach FOR SELECT
  USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.user_id = auth.uid() AND profiles.isadmin = true));

CREATE POLICY "Admins can insert ad_outreach" ON public.ad_outreach FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE profiles.user_id = auth.uid() AND profiles.isadmin = true));

CREATE POLICY "Admins can update ad_outreach" ON public.ad_outreach FOR UPDATE
  USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.user_id = auth.uid() AND profiles.isadmin = true));

CREATE POLICY "Admins can delete ad_outreach" ON public.ad_outreach FOR DELETE
  USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.user_id = auth.uid() AND profiles.isadmin = true));

-- 6. Revenue summary view
CREATE OR REPLACE VIEW public.ad_revenue_summary AS
SELECT
  COUNT(*) FILTER (WHERE ba.is_active = true AND (ba.start_date IS NULL OR ba.start_date <= CURRENT_DATE) AND (ba.end_date IS NULL OR ba.end_date >= CURRENT_DATE)) AS active_ads_count,
  COALESCE(SUM(ba.amount_paid), 0) AS total_revenue,
  (SELECT COUNT(*) FROM public.ad_clicks) AS total_clicks
FROM public.banner_ads ba;
