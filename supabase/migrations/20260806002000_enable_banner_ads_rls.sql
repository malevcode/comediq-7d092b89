-- Repair banner_ads RLS in environments where the table exists but RLS is off.

ALTER TABLE public.banner_ads ENABLE ROW LEVEL SECURITY;

GRANT SELECT ON public.banner_ads TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.banner_ads TO authenticated;

DROP POLICY IF EXISTS "Anyone can view active banner ads" ON public.banner_ads;
CREATE POLICY "Anyone can view active banner ads"
ON public.banner_ads
FOR SELECT
TO anon, authenticated
USING (is_active IS TRUE);

DROP POLICY IF EXISTS "Admins can insert banner ads" ON public.banner_ads;
CREATE POLICY "Admins can insert banner ads"
ON public.banner_ads
FOR INSERT
TO authenticated
WITH CHECK (EXISTS (SELECT 1 FROM public.profiles WHERE profiles.user_id = auth.uid() AND profiles.isadmin = true));

DROP POLICY IF EXISTS "Admins can update banner ads" ON public.banner_ads;
CREATE POLICY "Admins can update banner ads"
ON public.banner_ads
FOR UPDATE
TO authenticated
USING (EXISTS (SELECT 1 FROM public.profiles WHERE profiles.user_id = auth.uid() AND profiles.isadmin = true))
WITH CHECK (EXISTS (SELECT 1 FROM public.profiles WHERE profiles.user_id = auth.uid() AND profiles.isadmin = true));

DROP POLICY IF EXISTS "Admins can delete banner ads" ON public.banner_ads;
CREATE POLICY "Admins can delete banner ads"
ON public.banner_ads
FOR DELETE
TO authenticated
USING (EXISTS (SELECT 1 FROM public.profiles WHERE profiles.user_id = auth.uid() AND profiles.isadmin = true));
