-- Add 'completed' and 'no_show' status to application workflow
ALTER TYPE application_status ADD VALUE IF NOT EXISTS 'completed';
ALTER TYPE application_status ADD VALUE IF NOT EXISTS 'no_show';

-- Create work_history table for permanent record of completed work
CREATE TABLE IF NOT EXISTS public.work_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  
  -- Link to original data
  application_id UUID REFERENCES job_applications(id) ON DELETE SET NULL,
  posting_id UUID REFERENCES show_postings(id) ON DELETE SET NULL,
  role_id UUID REFERENCES role_openings(id) ON DELETE SET NULL,
  
  -- Denormalized show details (preserved even if posting deleted)
  show_title TEXT NOT NULL,
  venue_name TEXT NOT NULL,
  venue_address TEXT,
  borough TEXT,
  show_date DATE NOT NULL,
  show_type TEXT,
  
  -- Role details (preserved)
  role_category role_category NOT NULL,
  role_type TEXT NOT NULL,
  stage_time_minutes INTEGER,
  compensation_type compensation_type,
  compensation_amount DECIMAL(10,2),
  
  -- Verification
  confirmed_by_producer BOOLEAN DEFAULT false,
  producer_id UUID,
  producer_rating INTEGER CHECK (producer_rating >= 1 AND producer_rating <= 5),
  producer_notes TEXT,
  
  -- Timestamps
  completed_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes for fast lookups
CREATE INDEX IF NOT EXISTS idx_work_history_user ON work_history(user_id);
CREATE INDEX IF NOT EXISTS idx_work_history_role_type ON work_history(role_type);
CREATE INDEX IF NOT EXISTS idx_work_history_show_date ON work_history(show_date DESC);
CREATE INDEX IF NOT EXISTS idx_work_history_role_category ON work_history(role_category);

-- Add custom role support to role_openings
ALTER TABLE role_openings ADD COLUMN IF NOT EXISTS is_custom_role BOOLEAN DEFAULT false;

-- Enable RLS
ALTER TABLE work_history ENABLE ROW LEVEL SECURITY;

-- RLS Policies for work_history
CREATE POLICY "Users can view own work history"
ON work_history FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Public can view work history"
ON work_history FOR SELECT
USING (true);

CREATE POLICY "Producers can create work history records"
ON work_history FOR INSERT
WITH CHECK (
  auth.uid() = producer_id OR 
  EXISTS (
    SELECT 1 FROM show_postings 
    WHERE show_postings.id = work_history.posting_id 
    AND show_postings.producer_id = auth.uid()
  )
);

-- Producers can update their own work history records
CREATE POLICY "Producers can update work history"
ON work_history FOR UPDATE
USING (auth.uid() = producer_id);