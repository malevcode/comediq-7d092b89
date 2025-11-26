-- Phase 1: Comedy Job Board Database Schema

-- Create enums
CREATE TYPE public.job_board_role AS ENUM ('producer', 'talent', 'both');
CREATE TYPE public.role_category AS ENUM ('performer', 'crew');
CREATE TYPE public.compensation_type AS ENUM ('paid', 'unpaid', 'door_split', 'bringer', 'stage_time', 'tip_jar', 'negotiable');
CREATE TYPE public.experience_level AS ENUM ('beginner', 'intermediate', 'experienced', 'pro');
CREATE TYPE public.application_status AS ENUM ('pending', 'accepted', 'declined', 'withdrawn', 'waitlisted');
CREATE TYPE public.posting_status AS ENUM ('open', 'filled', 'cancelled', 'draft');

-- User job roles table (separate from profiles for security)
CREATE TABLE public.user_job_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role job_board_role NOT NULL DEFAULT 'talent',
  is_verified_producer BOOLEAN DEFAULT false,
  producer_bio TEXT,
  company_name TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id)
);

-- Show postings table
CREATE TABLE public.show_postings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  producer_id UUID NOT NULL REFERENCES profiles(user_id) ON DELETE CASCADE,
  
  -- Show details
  title TEXT NOT NULL,
  description TEXT,
  venue_name TEXT NOT NULL,
  venue_address TEXT,
  borough TEXT,
  
  -- Timing
  show_date DATE NOT NULL,
  show_time TIME,
  call_time TIME,
  
  -- Show type
  show_type TEXT,
  expected_audience INTEGER,
  
  -- Application settings
  application_deadline TIMESTAMPTZ,
  is_featured BOOLEAN DEFAULT false,
  is_boosted BOOLEAN DEFAULT false,
  boost_expires_at TIMESTAMPTZ,
  
  -- Status
  status posting_status DEFAULT 'open',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Role openings table
CREATE TABLE public.role_openings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  posting_id UUID NOT NULL REFERENCES show_postings(id) ON DELETE CASCADE,
  
  -- Role details
  role_category role_category NOT NULL,
  role_type TEXT NOT NULL,
  spots_available INTEGER DEFAULT 1,
  spots_filled INTEGER DEFAULT 0,
  
  -- Requirements
  experience_level experience_level DEFAULT 'beginner',
  requirements TEXT,
  stage_time_minutes INTEGER,
  
  -- Compensation
  compensation_type compensation_type NOT NULL,
  compensation_amount DECIMAL(10,2),
  compensation_details TEXT,
  
  -- Status
  status posting_status DEFAULT 'open',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Job applications table
CREATE TABLE public.job_applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  role_id UUID NOT NULL REFERENCES role_openings(id) ON DELETE CASCADE,
  applicant_id UUID NOT NULL REFERENCES profiles(user_id) ON DELETE CASCADE,
  
  -- Application content
  message TEXT,
  
  -- Status tracking
  status application_status DEFAULT 'pending',
  producer_notes TEXT,
  
  -- Timestamps
  applied_at TIMESTAMPTZ DEFAULT now(),
  responded_at TIMESTAMPTZ,
  
  UNIQUE(role_id, applicant_id)
);

-- Saved shows table
CREATE TABLE public.saved_shows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  posting_id UUID NOT NULL REFERENCES show_postings(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, posting_id)
);

-- Job messages table
CREATE TABLE public.job_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id UUID NOT NULL REFERENCES job_applications(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  message TEXT NOT NULL,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Create indexes for performance
CREATE INDEX idx_show_postings_date ON show_postings(show_date);
CREATE INDEX idx_show_postings_producer ON show_postings(producer_id);
CREATE INDEX idx_show_postings_status ON show_postings(status);
CREATE INDEX idx_role_openings_posting ON role_openings(posting_id);
CREATE INDEX idx_applications_role ON job_applications(role_id);
CREATE INDEX idx_applications_applicant ON job_applications(applicant_id);
CREATE INDEX idx_applications_status ON job_applications(status);

-- Enable RLS on all tables
ALTER TABLE public.user_job_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.show_postings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.role_openings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.job_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.saved_shows ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.job_messages ENABLE ROW LEVEL SECURITY;

-- Security definer function to check producer role
CREATE OR REPLACE FUNCTION public.is_producer(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_job_roles
    WHERE user_id = _user_id
      AND role IN ('producer', 'both')
  )
$$;

-- RLS Policies for user_job_roles
CREATE POLICY "Users can view their own role"
  ON user_job_roles FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own role"
  ON user_job_roles FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own role"
  ON user_job_roles FOR UPDATE
  USING (auth.uid() = user_id);

-- RLS Policies for show_postings
CREATE POLICY "Anyone can view open postings"
  ON show_postings FOR SELECT
  USING (status = 'open' OR producer_id = auth.uid());

CREATE POLICY "Producers can create postings"
  ON show_postings FOR INSERT
  WITH CHECK (public.is_producer(auth.uid()) AND auth.uid() = producer_id);

CREATE POLICY "Producers can update their own postings"
  ON show_postings FOR UPDATE
  USING (auth.uid() = producer_id);

CREATE POLICY "Producers can delete their own postings"
  ON show_postings FOR DELETE
  USING (auth.uid() = producer_id);

-- RLS Policies for role_openings
CREATE POLICY "Anyone can view roles for open postings"
  ON role_openings FOR SELECT
  USING (
    posting_id IN (
      SELECT id FROM show_postings 
      WHERE status = 'open' OR producer_id = auth.uid()
    )
  );

CREATE POLICY "Producers can add roles to their postings"
  ON role_openings FOR INSERT
  WITH CHECK (
    posting_id IN (
      SELECT id FROM show_postings WHERE producer_id = auth.uid()
    )
  );

CREATE POLICY "Producers can update roles in their postings"
  ON role_openings FOR UPDATE
  USING (
    posting_id IN (
      SELECT id FROM show_postings WHERE producer_id = auth.uid()
    )
  );

CREATE POLICY "Producers can delete roles from their postings"
  ON role_openings FOR DELETE
  USING (
    posting_id IN (
      SELECT id FROM show_postings WHERE producer_id = auth.uid()
    )
  );

-- RLS Policies for job_applications
CREATE POLICY "Users can view their own applications"
  ON job_applications FOR SELECT
  USING (auth.uid() = applicant_id);

CREATE POLICY "Producers can view applications for their postings"
  ON job_applications FOR SELECT
  USING (
    role_id IN (
      SELECT ro.id FROM role_openings ro
      JOIN show_postings sp ON ro.posting_id = sp.id
      WHERE sp.producer_id = auth.uid()
    )
  );

CREATE POLICY "Authenticated users can apply"
  ON job_applications FOR INSERT
  WITH CHECK (auth.uid() = applicant_id);

CREATE POLICY "Users can withdraw their own applications"
  ON job_applications FOR UPDATE
  USING (auth.uid() = applicant_id AND status = 'withdrawn');

CREATE POLICY "Producers can update application status"
  ON job_applications FOR UPDATE
  USING (
    role_id IN (
      SELECT ro.id FROM role_openings ro
      JOIN show_postings sp ON ro.posting_id = sp.id
      WHERE sp.producer_id = auth.uid()
    )
  );

-- RLS Policies for saved_shows
CREATE POLICY "Users can view their own saved shows"
  ON saved_shows FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can save shows"
  ON saved_shows FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can unsave shows"
  ON saved_shows FOR DELETE
  USING (auth.uid() = user_id);

-- RLS Policies for job_messages
CREATE POLICY "Users can view messages for their applications"
  ON job_messages FOR SELECT
  USING (
    auth.uid() = sender_id OR
    application_id IN (
      SELECT id FROM job_applications WHERE applicant_id = auth.uid()
    ) OR
    application_id IN (
      SELECT ja.id FROM job_applications ja
      JOIN role_openings ro ON ja.role_id = ro.id
      JOIN show_postings sp ON ro.posting_id = sp.id
      WHERE sp.producer_id = auth.uid()
    )
  );

CREATE POLICY "Users can send messages"
  ON job_messages FOR INSERT
  WITH CHECK (auth.uid() = sender_id);

CREATE POLICY "Users can mark messages as read"
  ON job_messages FOR UPDATE
  USING (
    application_id IN (
      SELECT id FROM job_applications WHERE applicant_id = auth.uid()
    ) OR
    application_id IN (
      SELECT ja.id FROM job_applications ja
      JOIN role_openings ro ON ja.role_id = ro.id
      JOIN show_postings sp ON ro.posting_id = sp.id
      WHERE sp.producer_id = auth.uid()
    )
  );

-- Trigger for updated_at timestamps
CREATE TRIGGER update_user_job_roles_updated_at
  BEFORE UPDATE ON user_job_roles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_show_postings_updated_at
  BEFORE UPDATE ON show_postings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();