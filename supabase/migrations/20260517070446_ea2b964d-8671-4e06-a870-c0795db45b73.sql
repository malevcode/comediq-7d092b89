-- Create role enum and table so roles are not stored on profiles
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'app_role') THEN
    CREATE TYPE public.app_role AS ENUM ('performer', 'host', 'showrunner', 'admin');
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  role public.app_role NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

CREATE POLICY "Users can view their own roles"
ON public.user_roles
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all roles"
ON public.user_roles
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin') OR EXISTS (
  SELECT 1 FROM public.user_admin
  WHERE user_admin.user_id = auth.uid()
    AND user_admin.is_admin = true
));

CREATE POLICY "Admins can create roles"
ON public.user_roles
FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin') OR EXISTS (
  SELECT 1 FROM public.user_admin
  WHERE user_admin.user_id = auth.uid()
    AND user_admin.is_admin = true
));

CREATE POLICY "Admins can update roles"
ON public.user_roles
FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin') OR EXISTS (
  SELECT 1 FROM public.user_admin
  WHERE user_admin.user_id = auth.uid()
    AND user_admin.is_admin = true
))
WITH CHECK (public.has_role(auth.uid(), 'admin') OR EXISTS (
  SELECT 1 FROM public.user_admin
  WHERE user_admin.user_id = auth.uid()
    AND user_admin.is_admin = true
));

CREATE POLICY "Admins can delete roles"
ON public.user_roles
FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin') OR EXISTS (
  SELECT 1 FROM public.user_admin
  WHERE user_admin.user_id = auth.uid()
    AND user_admin.is_admin = true
));

-- Document onboarding answers for follow-up and promo/listing outreach
CREATE TABLE IF NOT EXISTS public.user_onboarding_responses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  primary_use public.app_role NOT NULL,
  runs_open_mic boolean NOT NULL DEFAULT false,
  runs_show boolean NOT NULL DEFAULT false,
  mic_or_show_name text,
  wants_listing_promo boolean NOT NULL DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.user_onboarding_responses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own onboarding response"
ON public.user_onboarding_responses
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own onboarding response"
ON public.user_onboarding_responses
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own onboarding response"
ON public.user_onboarding_responses
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all onboarding responses"
ON public.user_onboarding_responses
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin') OR EXISTS (
  SELECT 1 FROM public.user_admin
  WHERE user_admin.user_id = auth.uid()
    AND user_admin.is_admin = true
));

-- Reusable timestamp trigger function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS update_user_roles_updated_at ON public.user_roles;
CREATE TRIGGER update_user_roles_updated_at
BEFORE UPDATE ON public.user_roles
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_user_onboarding_responses_updated_at ON public.user_onboarding_responses;
CREATE TRIGGER update_user_onboarding_responses_updated_at
BEFORE UPDATE ON public.user_onboarding_responses
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON public.user_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_onboarding_responses_user_id ON public.user_onboarding_responses(user_id);