import { supabase } from '@/integrations/supabase/client';
import type { WorkHistoryItem, WorkStats } from '@/types/jobBoard';

// ============= Work History Management =============

export async function completeApplication(
  applicationId: string,
  producerRating?: number,
  producerNotes?: string
): Promise<WorkHistoryItem> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  // First, fetch the application with all related data
  const { data: application, error: appError } = await supabase
    .from('job_applications')
    .select(`
      *,
      role:role_openings(
        *,
        posting:show_postings(*)
      )
    `)
    .eq('id', applicationId)
    .single();

  if (appError || !application) throw new Error('Application not found');

  const role = application.role as any;
  const posting = role.posting;

  // Update application status to completed
  const { error: updateError } = await supabase
    .from('job_applications')
    .update({
      status: 'completed',
      producer_notes: producerNotes,
      responded_at: new Date().toISOString(),
    })
    .eq('id', applicationId);

  if (updateError) throw updateError;

  // Create work history record
  const { data: workHistory, error: historyError } = await supabase
    .from('work_history')
    .insert({
      user_id: application.applicant_id,
      application_id: applicationId,
      posting_id: posting.id,
      role_id: role.id,
      show_title: posting.title,
      venue_name: posting.venue_name,
      venue_address: posting.venue_address,
      borough: posting.borough,
      show_date: posting.show_date,
      show_type: posting.show_type,
      role_category: role.role_category,
      role_type: role.role_type,
      stage_time_minutes: role.stage_time_minutes,
      compensation_type: role.compensation_type,
      compensation_amount: role.compensation_amount,
      confirmed_by_producer: true,
      producer_id: user.id,
      producer_rating: producerRating,
      producer_notes: producerNotes,
    })
    .select()
    .single();

  if (historyError) throw historyError;
  return workHistory as WorkHistoryItem;
}

export async function markNoShow(applicationId: string, notes?: string) {
  const { error } = await supabase
    .from('job_applications')
    .update({
      status: 'no_show',
      producer_notes: notes,
      responded_at: new Date().toISOString(),
    })
    .eq('id', applicationId);

  if (error) throw error;
}

export async function fetchUserWorkHistory(userId: string): Promise<WorkHistoryItem[]> {
  const { data, error } = await supabase
    .from('work_history')
    .select('*')
    .eq('user_id', userId)
    .order('show_date', { ascending: false });

  if (error) {
    console.error('Error fetching work history:', error);
    return [];
  }
  return data as WorkHistoryItem[];
}

export async function fetchUserWorkStats(userId: string): Promise<WorkStats> {
  const workHistory = await fetchUserWorkHistory(userId);

  const stats: WorkStats = {
    total_gigs: workHistory.length,
    performer_gigs: workHistory.filter(w => w.role_category === 'performer').length,
    crew_gigs: workHistory.filter(w => w.role_category === 'crew').length,
    role_breakdown: {},
    total_ratings: 0,
    venues_worked: [...new Set(workHistory.map(w => w.venue_name))],
    first_gig_date: workHistory.length > 0 ? workHistory[workHistory.length - 1].show_date : undefined,
    latest_gig_date: workHistory.length > 0 ? workHistory[0].show_date : undefined,
  };

  // Calculate role breakdown
  workHistory.forEach(work => {
    stats.role_breakdown[work.role_type] = (stats.role_breakdown[work.role_type] || 0) + 1;
  });

  // Calculate average rating
  const ratedGigs = workHistory.filter(w => w.producer_rating);
  if (ratedGigs.length > 0) {
    const totalRating = ratedGigs.reduce((sum, w) => sum + (w.producer_rating || 0), 0);
    stats.average_rating = totalRating / ratedGigs.length;
    stats.total_ratings = ratedGigs.length;
  }

  return stats;
}

export async function fetchUserRoleExperience(userId: string, roleType?: string) {
  let query = supabase
    .from('work_history')
    .select('*')
    .eq('user_id', userId);

  if (roleType) {
    query = query.eq('role_type', roleType);
  }

  query = query.order('show_date', { ascending: false });

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching role experience:', error);
    return [];
  }
  return data as WorkHistoryItem[];
}
