import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface AnalyticsDashboardData {
  // Overview
  todayViews: number;
  weekViews: number;
  monthViews: number;
  todayUnique: number;
  weekUnique: number;
  monthUnique: number;
  // Daily trend (last 30 days)
  dailyViews: { date: string; views: number; unique: number }[];
  // Top pages
  topPages: { page: string; views: number }[];
  // Top clicks
  topClicks: { name: string; count: number }[];
  // Feature usage
  featureUsage: { name: string; count: number }[];
  // Hourly heatmap (0-23)
  hourlyActivity: { hour: number; count: number }[];
}

export function useAnalyticsDashboard() {
  return useQuery({
    queryKey: ['analytics-dashboard'],
    queryFn: async (): Promise<AnalyticsDashboardData> => {
      const now = new Date();
      const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
      const weekStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
      const monthStart = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();

      // Fetch all events from last 30 days (up to 1000 per query, paginate if needed)
      const { data: events, error } = await supabase
        .from('analytics_events')
        .select('*')
        .gte('created_at', monthStart)
        .order('created_at', { ascending: false })
        .limit(1000);

      if (error) throw error;
      const allEvents = events || [];

      // Page views
      const pageViews = allEvents.filter(e => e.event_type === 'page_view');
      const clicks = allEvents.filter(e => e.event_type === 'click');
      const features = allEvents.filter(e => e.event_type === 'feature_use');

      // Today/week/month views
      const todayViews = pageViews.filter(e => e.created_at >= todayStart).length;
      const weekViews = pageViews.filter(e => e.created_at >= weekStart).length;
      const monthViews = pageViews.length;

      // Unique sessions
      const todayUnique = new Set(pageViews.filter(e => e.created_at >= todayStart).map(e => e.session_id)).size;
      const weekUnique = new Set(pageViews.filter(e => e.created_at >= weekStart).map(e => e.session_id)).size;
      const monthUnique = new Set(pageViews.map(e => e.session_id)).size;

      // Daily views (last 30 days)
      const dailyMap: Record<string, { views: number; sessions: Set<string> }> = {};
      pageViews.forEach(e => {
        const date = e.created_at.split('T')[0];
        if (!dailyMap[date]) dailyMap[date] = { views: 0, sessions: new Set() };
        dailyMap[date].views++;
        dailyMap[date].sessions.add(e.session_id);
      });
      const dailyViews = Object.entries(dailyMap)
        .map(([date, d]) => ({ date, views: d.views, unique: d.sessions.size }))
        .sort((a, b) => a.date.localeCompare(b.date));

      // Top pages
      const pageCount: Record<string, number> = {};
      pageViews.forEach(e => {
        const p = e.page_path || '/';
        pageCount[p] = (pageCount[p] || 0) + 1;
      });
      const topPages = Object.entries(pageCount)
        .map(([page, views]) => ({ page, views }))
        .sort((a, b) => b.views - a.views)
        .slice(0, 10);

      // Top clicks
      const clickCount: Record<string, number> = {};
      clicks.forEach(e => {
        clickCount[e.event_name] = (clickCount[e.event_name] || 0) + 1;
      });
      const topClicks = Object.entries(clickCount)
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10);

      // Feature usage
      const featureCount: Record<string, number> = {};
      features.forEach(e => {
        featureCount[e.event_name] = (featureCount[e.event_name] || 0) + 1;
      });
      const featureUsage = Object.entries(featureCount)
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10);

      // Hourly activity
      const hourMap: Record<number, number> = {};
      for (let i = 0; i < 24; i++) hourMap[i] = 0;
      allEvents.forEach(e => {
        const hour = new Date(e.created_at).getHours();
        hourMap[hour]++;
      });
      const hourlyActivity = Object.entries(hourMap)
        .map(([hour, count]) => ({ hour: Number(hour), count }));

      return {
        todayViews, weekViews, monthViews,
        todayUnique, weekUnique, monthUnique,
        dailyViews, topPages, topClicks, featureUsage, hourlyActivity,
      };
    },
    staleTime: 30 * 60 * 1000,
  });
}
