import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface AdminAnalytics {
  totalUsers: number;
  totalVisits: number;
  totalRatings: number;
  totalSavedMics: number;
  recentUsers: { date: string; count: number }[];
  dailyVisits: { date: string; count: number }[];
  userGrowth: { month: string; count: number }[];
}

export function useAdminAnalytics() {
  return useQuery({
    queryKey: ['adminAnalytics'],
    queryFn: async (): Promise<AdminAnalytics> => {
      // Fetch total users
      const { count: totalUsers } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true });

      // Fetch total visits
      const { count: totalVisits } = await supabase
        .from('user_visits')
        .select('*', { count: 'exact', head: true });

      // Fetch total ratings
      const { count: totalRatings } = await supabase
        .from('user_mic_ratings')
        .select('*', { count: 'exact', head: true });

      // Fetch total saved mics (profile_open_mics)
      const { count: totalSavedMics } = await supabase
        .from('profile_open_mics')
        .select('*', { count: 'exact', head: true });

      // Fetch recent user signups (last 30 days)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      const { data: recentUsersData } = await supabase
        .from('profiles')
        .select('created_at')
        .gte('created_at', thirtyDaysAgo.toISOString())
        .order('created_at', { ascending: true });

      // Group users by date
      const recentUsers = groupByDate(recentUsersData || [], 'created_at');

      // Fetch daily visits (last 30 days)
      const { data: visitsData } = await supabase
        .from('user_visits')
        .select('visit_date')
        .gte('visit_date', thirtyDaysAgo.toISOString())
        .order('visit_date', { ascending: true });

      const dailyVisits = groupByDate(visitsData || [], 'visit_date');

      // Fetch user growth by month (last 12 months)
      const twelveMonthsAgo = new Date();
      twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12);

      const { data: growthData } = await supabase
        .from('profiles')
        .select('created_at')
        .gte('created_at', twelveMonthsAgo.toISOString())
        .order('created_at', { ascending: true });

      const userGrowth = groupByMonth(growthData || [], 'created_at');

      return {
        totalUsers: totalUsers || 0,
        totalVisits: totalVisits || 0,
        totalRatings: totalRatings || 0,
        totalSavedMics: totalSavedMics || 0,
        recentUsers,
        dailyVisits,
        userGrowth,
      };
    },
  });
}

function groupByDate(data: any[], dateField: string): { date: string; count: number }[] {
  const grouped: Record<string, number> = {};
  
  data.forEach(item => {
    const date = new Date(item[dateField]).toISOString().split('T')[0];
    grouped[date] = (grouped[date] || 0) + 1;
  });

  return Object.entries(grouped).map(([date, count]) => ({ date, count }));
}

function groupByMonth(data: any[], dateField: string): { month: string; count: number }[] {
  const grouped: Record<string, number> = {};
  
  data.forEach(item => {
    const date = new Date(item[dateField]);
    const month = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    grouped[month] = (grouped[month] || 0) + 1;
  });

  return Object.entries(grouped).map(([month, count]) => ({ month, count }));
}
