import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  fetchComedianProfile, 
  updateUserProfile, 
  uploadHeadshot,
  addSocialLink,
  removeSocialLink,
  ComedianProfile,
  UserProfile
} from '@/api/profiles';
import { useToast } from '@/hooks/use-toast';

export function useComedianProfile(userId: string | undefined) {
  return useQuery({
    queryKey: ['comedian-profile', userId],
    queryFn: () => fetchComedianProfile(userId!),
    enabled: !!userId,
  });
}

export function useUpdateProfile() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ userId, updates }: { userId: string; updates: Partial<UserProfile> }) =>
      updateUserProfile(userId, updates),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['comedian-profile', variables.userId] });
      toast({
        title: 'Profile updated',
        description: 'Your profile has been updated successfully.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: 'Failed to update profile. Please try again.',
        variant: 'destructive',
      });
      console.error('Profile update error:', error);
    },
  });
}

export function useUploadHeadshot() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ userId, file }: { userId: string; file: File }) =>
      uploadHeadshot(userId, file),
    onSuccess: (url, variables) => {
      queryClient.invalidateQueries({ queryKey: ['comedian-profile', variables.userId] });
      return updateUserProfile(variables.userId, { headshot_url: url });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: 'Failed to upload headshot. Please try again.',
        variant: 'destructive',
      });
      console.error('Headshot upload error:', error);
    },
  });
}

export function useAddSocialLink() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ 
      userId, 
      platform, 
      handle, 
      url, 
      isPrimary 
    }: { 
      userId: string; 
      platform: string; 
      handle: string; 
      url: string; 
      isPrimary?: boolean 
    }) => addSocialLink(userId, platform, handle, url, isPrimary),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['comedian-profile', variables.userId] });
      toast({
        title: 'Social link added',
        description: `Your ${variables.platform} link has been added.`,
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: 'Failed to add social link. Please try again.',
        variant: 'destructive',
      });
      console.error('Add social link error:', error);
    },
  });
}

export function useRemoveSocialLink() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ userId, platform }: { userId: string; platform: string }) =>
      removeSocialLink(userId, platform),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['comedian-profile', variables.userId] });
      toast({
        title: 'Social link removed',
        description: `Your ${variables.platform} link has been removed.`,
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: 'Failed to remove social link. Please try again.',
        variant: 'destructive',
      });
      console.error('Remove social link error:', error);
    },
  });
}
