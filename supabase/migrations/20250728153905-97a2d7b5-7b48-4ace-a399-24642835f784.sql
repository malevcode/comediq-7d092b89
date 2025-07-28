-- Fix critical privilege escalation in profiles table
-- Users should not be able to update their own isadmin field
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;

-- Create new policy that prevents users from updating isadmin field
CREATE POLICY "Users can update their own profile (except admin status)" 
ON public.profiles 
FOR UPDATE 
USING (auth.uid() = user_id)
WITH CHECK (
  auth.uid() = user_id AND 
  -- Prevent users from changing their admin status
  isadmin = (SELECT isadmin FROM public.profiles WHERE user_id = auth.uid())
);

-- Create security definer function to check admin status safely
CREATE OR REPLACE FUNCTION public.is_admin(check_user_id uuid DEFAULT auth.uid())
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT COALESCE(isadmin, false) 
  FROM public.profiles 
  WHERE user_id = check_user_id;
$$;

-- Add policy for admins to update other users' profiles (including admin status)
CREATE POLICY "Admins can update any profile" 
ON public.profiles 
FOR UPDATE 
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- Enable RLS on open_mics_june table (currently missing)
ALTER TABLE public.open_mics_june ENABLE ROW LEVEL SECURITY;

-- Add read access for all users on open_mics_june
CREATE POLICY "Enable read access for all users" 
ON public.open_mics_june 
FOR SELECT 
USING (true);

-- Add admin-only policies for open_mics_june
CREATE POLICY "Enable insert for admins" 
ON public.open_mics_june 
FOR INSERT 
WITH CHECK (public.is_admin());

CREATE POLICY "Enable update for admins" 
ON public.open_mics_june 
FOR UPDATE 
USING (public.is_admin());

-- Add missing RLS policies for profiles_duplicate table
ALTER TABLE public.profiles_duplicate ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable read access for admins only" 
ON public.profiles_duplicate 
FOR SELECT 
USING (public.is_admin());

-- Clean up invalid phone numbers first
UPDATE public.profiles 
SET phone = NULL 
WHERE phone IS NOT NULL AND phone !~ '^[0-9]{10}$';

-- Add database constraint for phone number validation (after cleanup)
ALTER TABLE public.profiles 
ADD CONSTRAINT valid_phone_format 
CHECK (phone IS NULL OR (phone ~ '^[0-9]{10}$'));

-- Add constraint to prevent empty usernames
ALTER TABLE public.profiles 
ADD CONSTRAINT valid_username 
CHECK (username IS NOT NULL AND length(trim(username)) > 0);

-- Create audit table for admin actions
CREATE TABLE public.admin_audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_user_id uuid NOT NULL,
  action text NOT NULL,
  target_table text,
  target_id text,
  old_values jsonb,
  new_values jsonb,
  created_at timestamp with time zone DEFAULT now()
);

-- Enable RLS on audit log
ALTER TABLE public.admin_audit_log ENABLE ROW LEVEL SECURITY;

-- Only admins can read audit logs
CREATE POLICY "Admins can read audit logs" 
ON public.admin_audit_log 
FOR SELECT 
USING (public.is_admin());

-- Create function to log admin actions
CREATE OR REPLACE FUNCTION public.log_admin_action(
  action_type text,
  table_name text DEFAULT NULL,
  record_id text DEFAULT NULL,
  old_data jsonb DEFAULT NULL,
  new_data jsonb DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF public.is_admin() THEN
    INSERT INTO public.admin_audit_log (
      admin_user_id, 
      action, 
      target_table, 
      target_id, 
      old_values, 
      new_values
    )
    VALUES (
      auth.uid(), 
      action_type, 
      table_name, 
      record_id, 
      old_data, 
      new_data
    );
  END IF;
END;
$$;