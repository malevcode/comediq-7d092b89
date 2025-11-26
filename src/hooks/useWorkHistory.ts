import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import * as api from '@/api/workHistory';

// ============= Query Keys =============
export const workHistoryKeys = {
  all: ['workHistory'] as const,
  user: (userId: string) => [...workHistoryKeys.all, 'user', userId] as const,
  stats: (userId: string) => [...workHistoryKeys.all, 'stats', userId] as const,
  roleExperience: (userId: string, roleType?: string) => 
    [...workHistoryKeys.all, 'role', userId, roleType] as const,
};

// ============= Hooks =============

export function useUserWorkHistory(userId?: string) {
  return useQuery({
    queryKey: workHistoryKeys.user(userId || ''),
    queryFn: () => api.fetchUserWorkHistory(userId!),
    enabled: !!userId,
  });
}

export function useUserWorkStats(userId?: string) {
  return useQuery({
    queryKey: workHistoryKeys.stats(userId || ''),
    queryFn: () => api.fetchUserWorkStats(userId!),
    enabled: !!userId,
  });
}

export function useUserRoleExperience(userId?: string, roleType?: string) {
  return useQuery({
    queryKey: workHistoryKeys.roleExperience(userId || '', roleType),
    queryFn: () => api.fetchUserRoleExperience(userId!, roleType),
    enabled: !!userId,
  });
}

export function useCompleteApplication() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ 
      applicationId, 
      rating, 
      notes 
    }: { 
      applicationId: string; 
      rating?: number; 
      notes?: string 
    }) => api.completeApplication(applicationId, rating, notes),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: workHistoryKeys.user(data.user_id) });
      queryClient.invalidateQueries({ queryKey: workHistoryKeys.stats(data.user_id) });
      queryClient.invalidateQueries({ queryKey: ['jobBoard', 'applications'] });
      toast.success('Work completed and added to history');
    },
    onError: () => {
      toast.error('Failed to mark as completed');
    },
  });
}

export function useMarkNoShow() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ applicationId, notes }: { applicationId: string; notes?: string }) => 
      api.markNoShow(applicationId, notes),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['jobBoard', 'applications'] });
      toast.success('Marked as no-show');
    },
    onError: () => {
      toast.error('Failed to mark as no-show');
    },
  });
}
