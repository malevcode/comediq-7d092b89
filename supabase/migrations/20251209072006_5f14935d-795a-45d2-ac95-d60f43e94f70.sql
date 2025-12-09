-- Drop the existing restrictive policy for producers only
DROP POLICY IF EXISTS "Producers can create postings" ON public.show_postings;

-- Create new policy allowing any authenticated user to create postings
CREATE POLICY "Authenticated users can create postings" 
ON public.show_postings 
FOR INSERT 
WITH CHECK (auth.uid() = producer_id);