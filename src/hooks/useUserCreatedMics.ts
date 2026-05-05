import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { OpenMic, MicStatus, MicFrequency, SignupMethod } from '@/types/openMic';

function mapRow(row: Record<string, any>): OpenMic {
  return {
    id: row.unique_identifier,
    openMic: row.open_mic || '',
    day: row.day || '',
    startTime: row.start_time || '',
    latestEndTime: row.latest_end_time || '',
    venueName: row.venue_name || '',
    borough: (row.borough || '').trim(),
    neighborhood: row.neighborhood || '',
    location: row.location || '',
    venueType: row.venue_type || '',
    cost: row.cost || '',
    stageTime: row.stage_time || '',
    signUpInstructions: row.sign_up_instructions || '',
    hosts: row.hosts_organizers || '',
    instagramHandle: row.changes_updates || '',
    lastVerified: row.last_verified || '',
    uniqueIdentifier: row.unique_identifier || '',
    city: row.city || '',
    signupEnabled: row.signup_enabled || false,
    otherRules: row.other_rules || '',
    coverImageUrl: row.cover_image_url || undefined,
    status: (row.status as MicStatus) || 'trial',
    frequency: (row.frequency as MicFrequency) || 'weekly',
    verificationCount: row.verification_count || 0,
    submissionDate: row.submission_date || undefined,
    creatorId: row.creator_id || undefined,
    signupMethod: (row.signup_method as SignupMethod) || undefined,
    signupUrl: row.signup_url || undefined,
    frequencyCustomText: row.frequency_custom_text || undefined,
    slotsEnabled: row.slots_enabled || false,
    slotDurationMinutes: row.slot_duration_minutes || 5,
  };
}

export function useUserCreatedMics(userId: string | undefined) {
  return useQuery({
    queryKey: ['userCreatedMics', userId],
    queryFn: async () => {
      if (!userId) return [];
      const { data, error } = await supabase
        .from('open_mics_historical')
        .select('*')
        .eq('creator_id', userId)
        .order('submission_date', { ascending: false });
      if (error) throw error;
      return (data || []).map(mapRow);
    },
    enabled: !!userId,
  });
}

export function useDeleteUserMic() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (uniqueIdentifier: string) => {
      const { error } = await supabase
        .from('open_mics_historical')
        .update({ active: false })
        .eq('unique_identifier', uniqueIdentifier);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['userCreatedMics'] });
      queryClient.invalidateQueries({ queryKey: ['openMics'] });
    },
  });
}
