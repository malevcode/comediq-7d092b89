-- Create audience_shows table for audience-facing comedy show listings
CREATE TABLE public.audience_shows (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  venue_name TEXT NOT NULL,
  venue_address TEXT,
  borough TEXT,
  show_date DATE NOT NULL,
  show_time TIME NOT NULL,
  doors_time TIME,
  description TEXT,
  lineup TEXT,
  ticket_url TEXT,
  ticket_price TEXT,
  show_type TEXT DEFAULT 'Stand-up',
  host_name TEXT,
  instagram_handle TEXT,
  image_url TEXT,
  expected_audience INTEGER,
  age_restriction TEXT DEFAULT '21+',
  is_featured BOOLEAN DEFAULT false,
  status TEXT DEFAULT 'active',
  submitted_by UUID REFERENCES auth.users(id),
  verified BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.audience_shows ENABLE ROW LEVEL SECURITY;

-- Create policies for public read access (verified shows only)
CREATE POLICY "Anyone can view verified active shows" 
ON public.audience_shows 
FOR SELECT 
USING (verified = true AND status = 'active');

-- Create policy for authenticated users to submit shows
CREATE POLICY "Authenticated users can submit shows" 
ON public.audience_shows 
FOR INSERT 
WITH CHECK (auth.uid() = submitted_by);

-- Create policy for users to update their own submissions
CREATE POLICY "Users can update their own submissions" 
ON public.audience_shows 
FOR UPDATE 
USING (auth.uid() = submitted_by);

-- Create policy for admins to manage all shows (using correct column name)
CREATE POLICY "Admins can manage all shows" 
ON public.audience_shows 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() AND isadmin = true
  )
);

-- Create index for common queries
CREATE INDEX idx_audience_shows_date ON public.audience_shows(show_date);
CREATE INDEX idx_audience_shows_borough ON public.audience_shows(borough);
CREATE INDEX idx_audience_shows_status ON public.audience_shows(status);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_audience_shows_updated_at
BEFORE UPDATE ON public.audience_shows
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();