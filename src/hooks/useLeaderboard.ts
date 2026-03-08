import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface LeaderboardEntry {
  user_id: string;
  username: string | null;
  stage_name: string | null;
  points_balance: number;
  rank: number;
}

export const useLeaderboard = () => {
  const { user } = useAuth();

  const topQuery = useQuery({
    queryKey: ['leaderboard', 'top10'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('user_id, username, stage_name, points_balance')
        .gt('points_balance', 0)
        .order('points_balance', { ascending: false })
        .limit(10);

      if (error) throw error;
      return (data || []).map((entry, i) => ({ ...entry, rank: i + 1 })) as LeaderboardEntry[];
    },
    staleTime: 5 * 60 * 1000,
  });

  const userRankQuery = useQuery({
    queryKey: ['leaderboard', 'userRank', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;

      // Get user's profile
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('user_id, username, stage_name, points_balance')
        .eq('user_id', user.id)
        .single();

      if (profileError || !profile) return null;

      // Count users with more points
      const { count, error: countError } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .gt('points_balance', profile.points_balance);

      if (countError) return null;

      return {
        ...profile,
        rank: (count || 0) + 1,
      } as LeaderboardEntry;
    },
    enabled: !!user?.id,
    staleTime: 5 * 60 * 1000,
  });

  return {
    top10: topQuery.data || [],
    userRank: userRankQuery.data,
    isLoading: topQuery.isLoading,
  };
};
