import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';

export interface UserPlan {
  id: string;
  user_id: string;
  mic_unique_identifier: string;
  planned_date: string;
  status: string;
  verified_at: string | null;
  created_at: string;
}

export const useUserPlans = (date?: string) => {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ['userPlans', user?.id, date],
    queryFn: async (): Promise<UserPlan[]> => {
      if (!user) return [];
      let query = supabase
        .from('user_plans')
        .select('*')
        .eq('user_id', user.id)
        .order('planned_date', { ascending: true });
      
      if (date) {
        query = query.eq('planned_date', date);
      }
      
      const { data, error } = await query;
      if (error) throw error;
      return (data || []) as UserPlan[];
    },
    enabled: !!user,
  });
};

export const usePlanToHit = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ micId, plannedDate }: { micId: string; plannedDate: string }) => {
      if (!user) throw new Error('Must be logged in');
      const { data, error } = await supabase
        .from('user_plans')
        .insert({ user_id: user.id, mic_unique_identifier: micId, planned_date: plannedDate })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['userPlans'] });
      toast({
        title: '📍 Planned!',
        description: 'Added to your day plan.',
        className: 'bg-[hsl(40,33%,94%)] text-[hsl(213,73%,40%)] border-[hsl(213,73%,40%)]',
      });
    },
    onError: (err: any) => {
      if (err.message?.includes('duplicate')) {
        toast({ title: 'Already planned!', description: 'This mic is already in your plan.' });
      } else {
        toast({ title: 'Error', description: err.message, variant: 'destructive' });
      }
    },
  });
};

export const useRemovePlan = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (planId: string) => {
      const { error } = await supabase.from('user_plans').delete().eq('id', planId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['userPlans'] });
    },
  });
};

export const useVerifyPlan = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (planId: string) => {
      if (!user) throw new Error('Must be logged in');
      
      // Get the plan details first
      const { data: plan, error: fetchError } = await supabase
        .from('user_plans')
        .select('*')
        .eq('id', planId)
        .single();
      if (fetchError) throw fetchError;

      // Call verify RPC
      const ipHash = await hashIP();
      const { data: result, error: verifyError } = await supabase.rpc('verify_mic_with_points', {
        mic_identifier: (plan as any).mic_unique_identifier,
        user_id_param: user.id,
        ip_hash_param: ipHash,
        status_param: 'verified',
      });
      if (verifyError) throw verifyError;

      // Mark plan as verified
      await supabase
        .from('user_plans')
        .update({ status: 'verified', verified_at: new Date().toISOString() })
        .eq('id', planId);

      return result;
    },
    onSuccess: (result: any) => {
      queryClient.invalidateQueries({ queryKey: ['userPlans'] });
      if (result?.alreadyVerified) {
        toast({ title: 'Already verified today!' });
      } else {
        toast({
          title: '+2 Points! ✅',
          description: 'Verified from your plan!',
          className: 'bg-[hsl(40,33%,94%)] text-[hsl(213,73%,40%)] border-[hsl(213,73%,40%)]',
        });
      }
    },
    onError: (err: any) => {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    },
  });
};

async function hashIP(): Promise<string> {
  try {
    const res = await fetch('https://api.ipify.org?format=text');
    const ip = await res.text();
    const encoder = new TextEncoder();
    const data = encoder.encode(ip);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  } catch {
    return 'unknown';
  }
}
