export type JobBoardRole = 'producer' | 'talent' | 'both';
export type RoleCategory = 'performer' | 'crew';
export type CompensationType = 'paid' | 'unpaid' | 'door_split' | 'bringer' | 'stage_time' | 'tip_jar' | 'negotiable';
export type ExperienceLevel = 'beginner' | 'intermediate' | 'experienced' | 'pro';
export type ApplicationStatus = 'pending' | 'accepted' | 'declined' | 'withdrawn' | 'waitlisted';
export type PostingStatus = 'open' | 'filled' | 'cancelled' | 'draft';

export interface UserJobRole {
  id: string;
  user_id: string;
  role: JobBoardRole;
  is_verified_producer: boolean;
  producer_bio?: string;
  company_name?: string;
  created_at: string;
  updated_at: string;
}

export interface ShowPosting {
  id: string;
  producer_id: string;
  title: string;
  description?: string;
  venue_name: string;
  venue_address?: string;
  borough?: string;
  show_date: string;
  show_time?: string;
  call_time?: string;
  show_type?: string;
  expected_audience?: number;
  application_deadline?: string;
  is_featured: boolean;
  is_boosted: boolean;
  boost_expires_at?: string;
  status: PostingStatus;
  created_at: string;
  updated_at: string;
}

export interface RoleOpening {
  id: string;
  posting_id: string;
  role_category: RoleCategory;
  role_type: string;
  spots_available: number;
  spots_filled: number;
  experience_level: ExperienceLevel;
  requirements?: string;
  stage_time_minutes?: number;
  compensation_type: CompensationType;
  compensation_amount?: number;
  compensation_details?: string;
  status: PostingStatus;
  created_at: string;
}

export interface JobApplication {
  id: string;
  role_id: string;
  applicant_id: string;
  message?: string;
  status: ApplicationStatus;
  producer_notes?: string;
  applied_at: string;
  responded_at?: string;
}

export interface SavedShow {
  id: string;
  user_id: string;
  posting_id: string;
  created_at: string;
}

export interface JobMessage {
  id: string;
  application_id: string;
  sender_id: string;
  message: string;
  is_read: boolean;
  created_at: string;
}

export interface PostingWithRoles extends ShowPosting {
  roles: RoleOpening[];
  producer?: {
    username?: string;
    stage_name?: string;
    company_name?: string;
  };
}

export interface ApplicationWithDetails extends JobApplication {
  role: RoleOpening & {
    posting: ShowPosting;
  };
}

export interface CreatePostingData {
  title: string;
  description?: string;
  venue_name: string;
  venue_address?: string;
  borough?: string;
  show_date: string;
  show_time?: string;
  call_time?: string;
  show_type?: string;
  expected_audience?: number;
  application_deadline?: string;
  status?: PostingStatus;
}

export interface CreateRoleData {
  posting_id: string;
  role_category: RoleCategory;
  role_type: string;
  spots_available: number;
  experience_level: ExperienceLevel;
  requirements?: string;
  stage_time_minutes?: number;
  compensation_type: CompensationType;
  compensation_amount?: number;
  compensation_details?: string;
}

export interface PostingFilters {
  roleCategory?: RoleCategory;
  roleType?: string;
  borough?: string;
  compensationType?: CompensationType;
  experienceLevel?: ExperienceLevel;
  dateFrom?: string;
  dateTo?: string;
  showType?: string;
}

export interface WorkHistoryItem {
  id: string;
  user_id: string;
  application_id?: string;
  posting_id?: string;
  role_id?: string;
  
  // Show details (preserved)
  show_title: string;
  venue_name: string;
  venue_address?: string;
  borough?: string;
  show_date: string;
  show_type?: string;
  
  // Role details
  role_category: RoleCategory;
  role_type: string;
  stage_time_minutes?: number;
  compensation_type?: CompensationType;
  compensation_amount?: number;
  
  // Verification
  confirmed_by_producer: boolean;
  producer_id?: string;
  producer_rating?: number;
  producer_notes?: string;
  
  completed_at: string;
  created_at: string;
}

export interface WorkStats {
  total_gigs: number;
  performer_gigs: number;
  crew_gigs: number;
  role_breakdown: Record<string, number>;
  average_rating?: number;
  total_ratings: number;
  venues_worked: string[];
  first_gig_date?: string;
  latest_gig_date?: string;
}
