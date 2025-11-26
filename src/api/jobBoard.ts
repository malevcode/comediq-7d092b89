import { supabase } from '@/integrations/supabase/client';
import type {
  ShowPosting,
  RoleOpening,
  JobApplication,
  SavedShow,
  JobMessage,
  CreatePostingData,
  CreateRoleData,
  PostingWithRoles,
  ApplicationWithDetails,
  PostingFilters,
  UserJobRole,
} from '@/types/jobBoard';

// ============= User Role Management =============

export async function fetchUserJobRole(userId: string): Promise<UserJobRole | null> {
  const { data, error } = await supabase
    .from('user_job_roles')
    .select('*')
    .eq('user_id', userId)
    .single();

  if (error) {
    console.error('Error fetching user job role:', error);
    return null;
  }
  return data;
}

export async function upsertUserJobRole(
  userId: string,
  role: 'producer' | 'talent' | 'both',
  producerData?: { producer_bio?: string; company_name?: string }
) {
  const { data, error } = await supabase
    .from('user_job_roles')
    .upsert({
      user_id: userId,
      role,
      ...producerData,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

// ============= Show Postings =============

export async function createShowPosting(postingData: CreatePostingData) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('show_postings')
    .insert({
      ...postingData,
      producer_id: user.id,
    })
    .select()
    .single();

  if (error) throw error;
  return data as ShowPosting;
}

export async function updateShowPosting(id: string, updates: Partial<CreatePostingData>) {
  const { data, error } = await supabase
    .from('show_postings')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data as ShowPosting;
}

export async function deleteShowPosting(id: string) {
  const { error } = await supabase
    .from('show_postings')
    .delete()
    .eq('id', id);

  if (error) throw error;
}

export async function fetchMyPostings(): Promise<PostingWithRoles[]> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from('show_postings')
    .select(`
      *,
      roles:role_openings(*)
    `)
    .eq('producer_id', user.id)
    .order('show_date', { ascending: true });

  if (error) {
    console.error('Error fetching my postings:', error);
    return [];
  }
  return data as PostingWithRoles[];
}

export async function fetchAllOpenPostings(filters?: PostingFilters): Promise<PostingWithRoles[]> {
  let query = supabase
    .from('show_postings')
    .select(`
      *,
      roles:role_openings(*),
      producer:profiles!show_postings_producer_id_fkey(username, stage_name)
    `)
    .eq('status', 'open')
    .gte('show_date', new Date().toISOString().split('T')[0]);

  if (filters?.borough) {
    query = query.eq('borough', filters.borough);
  }
  if (filters?.showType) {
    query = query.eq('show_type', filters.showType);
  }
  if (filters?.dateFrom) {
    query = query.gte('show_date', filters.dateFrom);
  }
  if (filters?.dateTo) {
    query = query.lte('show_date', filters.dateTo);
  }

  query = query.order('show_date', { ascending: true });

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching open postings:', error);
    return [];
  }

  let result = data as PostingWithRoles[];

  // Client-side filtering for role-specific filters
  if (filters?.roleCategory) {
    result = result.filter(p => 
      p.roles?.some(r => r.role_category === filters.roleCategory)
    );
  }
  if (filters?.roleType) {
    result = result.filter(p => 
      p.roles?.some(r => r.role_type === filters.roleType)
    );
  }
  if (filters?.compensationType) {
    result = result.filter(p => 
      p.roles?.some(r => r.compensation_type === filters.compensationType)
    );
  }
  if (filters?.experienceLevel) {
    result = result.filter(p => 
      p.roles?.some(r => r.experience_level === filters.experienceLevel)
    );
  }

  return result;
}

export async function fetchPostingById(id: string): Promise<PostingWithRoles | null> {
  const { data, error } = await supabase
    .from('show_postings')
    .select(`
      *,
      roles:role_openings(*),
      producer:profiles!show_postings_producer_id_fkey(username, stage_name)
    `)
    .eq('id', id)
    .single();

  if (error) {
    console.error('Error fetching posting:', error);
    return null;
  }
  return data as PostingWithRoles;
}

export async function duplicatePosting(id: string) {
  const original = await fetchPostingById(id);
  if (!original) throw new Error('Posting not found');

  const { roles, producer, ...postingData } = original;
  
  // Create new posting without id, created_at, updated_at
  const { id: _, created_at: __, updated_at: ___, ...newPostingData } = postingData;
  
  const newPosting = await createShowPosting({
    ...newPostingData,
    status: 'draft',
  });

  // Duplicate roles
  if (roles && roles.length > 0) {
    for (const role of roles) {
      const { id: roleId, posting_id: _, created_at: __, ...roleData } = role;
      await addRoleToPosting({
        ...roleData,
        posting_id: newPosting.id,
      });
    }
  }

  return newPosting;
}

// ============= Role Openings =============

export async function addRoleToPosting(roleData: CreateRoleData) {
  const { data, error } = await supabase
    .from('role_openings')
    .insert(roleData)
    .select()
    .single();

  if (error) throw error;
  return data as RoleOpening;
}

export async function updateRole(id: string, updates: Partial<CreateRoleData>) {
  const { data, error } = await supabase
    .from('role_openings')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data as RoleOpening;
}

export async function removeRole(id: string) {
  const { error } = await supabase
    .from('role_openings')
    .delete()
    .eq('id', id);

  if (error) throw error;
}

export async function markRoleFilled(id: string) {
  const { data, error } = await supabase
    .from('role_openings')
    .update({ status: 'filled' })
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data as RoleOpening;
}

// ============= Applications =============

export async function applyToRole(roleId: string, message?: string) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('job_applications')
    .insert({
      role_id: roleId,
      applicant_id: user.id,
      message,
    })
    .select()
    .single();

  if (error) throw error;
  return data as JobApplication;
}

export async function withdrawApplication(id: string) {
  const { data, error } = await supabase
    .from('job_applications')
    .update({ status: 'withdrawn' })
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data as JobApplication;
}

export async function fetchMyApplications(): Promise<ApplicationWithDetails[]> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from('job_applications')
    .select(`
      *,
      role:role_openings(
        *,
        posting:show_postings(*)
      )
    `)
    .eq('applicant_id', user.id)
    .order('applied_at', { ascending: false });

  if (error) {
    console.error('Error fetching my applications:', error);
    return [];
  }
  return data as ApplicationWithDetails[];
}

export async function fetchApplicationsForRole(roleId: string) {
  const { data, error } = await supabase
    .from('job_applications')
    .select(`
      *,
      applicant:profiles!job_applications_applicant_id_fkey(
        username,
        stage_name,
        headshot_url,
        credit,
        bio,
        years_performing
      )
    `)
    .eq('role_id', roleId)
    .order('applied_at', { ascending: true });

  if (error) {
    console.error('Error fetching role applications:', error);
    return [];
  }
  return data;
}

export async function updateApplicationStatus(
  id: string,
  status: 'accepted' | 'declined' | 'waitlisted',
  producerNotes?: string
) {
  const { data, error } = await supabase
    .from('job_applications')
    .update({
      status,
      producer_notes: producerNotes,
      responded_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data as JobApplication;
}

// ============= Saved Shows =============

export async function saveShow(postingId: string) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('saved_shows')
    .insert({
      user_id: user.id,
      posting_id: postingId,
    })
    .select()
    .single();

  if (error) throw error;
  return data as SavedShow;
}

export async function unsaveShow(postingId: string) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { error } = await supabase
    .from('saved_shows')
    .delete()
    .eq('user_id', user.id)
    .eq('posting_id', postingId);

  if (error) throw error;
}

export async function fetchSavedShows(): Promise<PostingWithRoles[]> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from('saved_shows')
    .select(`
      posting:show_postings(
        *,
        roles:role_openings(*),
        producer:profiles!show_postings_producer_id_fkey(username, stage_name)
      )
    `)
    .eq('user_id', user.id);

  if (error) {
    console.error('Error fetching saved shows:', error);
    return [];
  }
  return data.map(d => d.posting).filter(Boolean) as PostingWithRoles[];
}

// ============= Messages =============

export async function sendMessage(applicationId: string, message: string) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('job_messages')
    .insert({
      application_id: applicationId,
      sender_id: user.id,
      message,
    })
    .select()
    .single();

  if (error) throw error;
  return data as JobMessage;
}

export async function fetchMessages(applicationId: string): Promise<JobMessage[]> {
  const { data, error } = await supabase
    .from('job_messages')
    .select('*')
    .eq('application_id', applicationId)
    .order('created_at', { ascending: true });

  if (error) {
    console.error('Error fetching messages:', error);
    return [];
  }
  return data;
}

export async function markMessagesRead(applicationId: string) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  const { error } = await supabase
    .from('job_messages')
    .update({ is_read: true })
    .eq('application_id', applicationId)
    .neq('sender_id', user.id);

  if (error) {
    console.error('Error marking messages read:', error);
  }
}
