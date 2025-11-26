import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import * as api from '@/api/jobBoard';
import type { PostingFilters, CreatePostingData, CreateRoleData } from '@/types/jobBoard';

// ============= Query Keys =============
export const jobBoardKeys = {
  all: ['jobBoard'] as const,
  postings: () => [...jobBoardKeys.all, 'postings'] as const,
  posting: (id: string) => [...jobBoardKeys.postings(), id] as const,
  myPostings: () => [...jobBoardKeys.postings(), 'my'] as const,
  openPostings: (filters?: PostingFilters) => [...jobBoardKeys.postings(), 'open', filters] as const,
  applications: () => [...jobBoardKeys.all, 'applications'] as const,
  myApplications: () => [...jobBoardKeys.applications(), 'my'] as const,
  roleApplications: (roleId: string) => [...jobBoardKeys.applications(), 'role', roleId] as const,
  savedShows: () => [...jobBoardKeys.all, 'savedShows'] as const,
  userRole: (userId: string) => [...jobBoardKeys.all, 'userRole', userId] as const,
  messages: (applicationId: string) => [...jobBoardKeys.all, 'messages', applicationId] as const,
};

// ============= User Role Hooks =============

export function useUserJobRole(userId?: string) {
  return useQuery({
    queryKey: jobBoardKeys.userRole(userId || ''),
    queryFn: () => api.fetchUserJobRole(userId!),
    enabled: !!userId,
  });
}

export function useUpsertUserJobRole() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ 
      userId, 
      role, 
      producerData 
    }: { 
      userId: string; 
      role: 'producer' | 'talent' | 'both'; 
      producerData?: { producer_bio?: string; company_name?: string } 
    }) => api.upsertUserJobRole(userId, role, producerData),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: jobBoardKeys.userRole(variables.userId) });
      toast.success('Role updated successfully');
    },
    onError: () => {
      toast.error('Failed to update role');
    },
  });
}

// ============= Show Postings Hooks =============

export function useOpenPostings(filters?: PostingFilters) {
  return useQuery({
    queryKey: jobBoardKeys.openPostings(filters),
    queryFn: () => api.fetchAllOpenPostings(filters),
  });
}

export function useMyPostings() {
  return useQuery({
    queryKey: jobBoardKeys.myPostings(),
    queryFn: api.fetchMyPostings,
  });
}

export function usePosting(id: string) {
  return useQuery({
    queryKey: jobBoardKeys.posting(id),
    queryFn: () => api.fetchPostingById(id),
    enabled: !!id,
  });
}

export function useCreatePosting() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreatePostingData) => api.createShowPosting(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: jobBoardKeys.myPostings() });
      queryClient.invalidateQueries({ queryKey: jobBoardKeys.openPostings() });
      toast.success('Show posted successfully');
    },
    onError: () => {
      toast.error('Failed to create posting');
    },
  });
}

export function useUpdatePosting() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<CreatePostingData> }) => 
      api.updateShowPosting(id, updates),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: jobBoardKeys.posting(variables.id) });
      queryClient.invalidateQueries({ queryKey: jobBoardKeys.myPostings() });
      toast.success('Posting updated');
    },
    onError: () => {
      toast.error('Failed to update posting');
    },
  });
}

export function useDeletePosting() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => api.deleteShowPosting(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: jobBoardKeys.myPostings() });
      toast.success('Posting deleted');
    },
    onError: () => {
      toast.error('Failed to delete posting');
    },
  });
}

export function useDuplicatePosting() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => api.duplicatePosting(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: jobBoardKeys.myPostings() });
      toast.success('Posting duplicated as draft');
    },
    onError: () => {
      toast.error('Failed to duplicate posting');
    },
  });
}

// ============= Role Hooks =============

export function useAddRole() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateRoleData) => api.addRoleToPosting(data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: jobBoardKeys.posting(variables.posting_id) });
      queryClient.invalidateQueries({ queryKey: jobBoardKeys.myPostings() });
      toast.success('Role added');
    },
    onError: () => {
      toast.error('Failed to add role');
    },
  });
}

export function useUpdateRole() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<CreateRoleData> }) => 
      api.updateRole(id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: jobBoardKeys.postings() });
      toast.success('Role updated');
    },
    onError: () => {
      toast.error('Failed to update role');
    },
  });
}

export function useRemoveRole() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => api.removeRole(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: jobBoardKeys.postings() });
      toast.success('Role removed');
    },
    onError: () => {
      toast.error('Failed to remove role');
    },
  });
}

export function useMarkRoleFilled() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => api.markRoleFilled(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: jobBoardKeys.postings() });
      toast.success('Role marked as filled');
    },
    onError: () => {
      toast.error('Failed to update role');
    },
  });
}

// ============= Application Hooks =============

export function useMyApplications() {
  return useQuery({
    queryKey: jobBoardKeys.myApplications(),
    queryFn: api.fetchMyApplications,
  });
}

export function useRoleApplications(roleId: string) {
  return useQuery({
    queryKey: jobBoardKeys.roleApplications(roleId),
    queryFn: () => api.fetchApplicationsForRole(roleId),
    enabled: !!roleId,
  });
}

export function useApplyToRole() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ roleId, message }: { roleId: string; message?: string }) => 
      api.applyToRole(roleId, message),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: jobBoardKeys.myApplications() });
      toast.success('Application submitted');
    },
    onError: (error: any) => {
      if (error.code === '23505') {
        toast.error('You have already applied to this role');
      } else {
        toast.error('Failed to submit application');
      }
    },
  });
}

export function useWithdrawApplication() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => api.withdrawApplication(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: jobBoardKeys.myApplications() });
      toast.success('Application withdrawn');
    },
    onError: () => {
      toast.error('Failed to withdraw application');
    },
  });
}

export function useUpdateApplicationStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ 
      id, 
      status, 
      producerNotes 
    }: { 
      id: string; 
      status: 'accepted' | 'declined' | 'waitlisted'; 
      producerNotes?: string 
    }) => api.updateApplicationStatus(id, status, producerNotes),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: jobBoardKeys.applications() });
      toast.success('Application status updated');
    },
    onError: () => {
      toast.error('Failed to update status');
    },
  });
}

// ============= Saved Shows Hooks =============

export function useSavedShows() {
  return useQuery({
    queryKey: jobBoardKeys.savedShows(),
    queryFn: api.fetchSavedShows,
  });
}

export function useToggleSaveShow() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ postingId, isSaved }: { postingId: string; isSaved: boolean }) => {
      if (isSaved) {
        await api.unsaveShow(postingId);
      } else {
        await api.saveShow(postingId);
      }
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: jobBoardKeys.savedShows() });
      toast.success(variables.isSaved ? 'Show unsaved' : 'Show saved');
    },
    onError: () => {
      toast.error('Failed to update saved shows');
    },
  });
}

// ============= Messages Hooks =============

export function useMessages(applicationId: string) {
  return useQuery({
    queryKey: jobBoardKeys.messages(applicationId),
    queryFn: () => api.fetchMessages(applicationId),
    enabled: !!applicationId,
  });
}

export function useSendMessage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ applicationId, message }: { applicationId: string; message: string }) =>
      api.sendMessage(applicationId, message),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: jobBoardKeys.messages(variables.applicationId) });
    },
    onError: () => {
      toast.error('Failed to send message');
    },
  });
}
