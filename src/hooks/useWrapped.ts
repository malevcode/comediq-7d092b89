import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface WrappedStats {
  totalMics: number;
  uniqueVenues: number;
  uniqueBoroughs: string[];
  uniqueNeighborhoods: string[];
  favoriteDay: string | null;
  topVenue: { name: string; count: number } | null;
  estimatedStageTime: number; // in minutes
  likedMicsCount: number;
  firstMicDate: string | null;
  monthlyBreakdown: { month: string; count: number }[];
  daysBreakdown: { day: string; count: number }[];
}

const DAYS_ORDER = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export const useWrapped = (userId?: string, year: number = 2025) => {
  return useQuery({
    queryKey: ['wrapped', userId, year],
    queryFn: async (): Promise<WrappedStats> => {
      if (!userId) throw new Error('User ID required');

      // Fetch user's tracked mics from profile_open_mics
      const startOfYear = `${year}-01-01`;
      const endOfYear = `${year}-12-31`;

      const { data: trackedMics, error: micsError } = await supabase
        .from('profile_open_mics')
        .select(`
          id,
          created_at,
          notes,
          open_mic_id,
          schedule_type
        `)
        .eq('profile_id', userId)
        .gte('created_at', startOfYear)
        .lte('created_at', endOfYear);

      if (micsError) throw micsError;

      // Get open mic details for the tracked mics
      const micIds = trackedMics?.map(m => m.open_mic_id).filter(Boolean) || [];
      
      const { data: micDetails, error: detailsError } = await supabase
        .from('open_mics_historical')
        .select('unique_identifier, open_mic, venue_name, borough, neighborhood, day, stage_time')
        .in('unique_identifier', micIds);

      if (detailsError) throw detailsError;

      // Get liked mics count
      const { data: likedMics, error: likedError } = await supabase
        .from('user_mic_ratings')
        .select('id')
        .eq('user_id', userId)
        .eq('rating', 'like')
        .gte('created_at', startOfYear)
        .lte('created_at', endOfYear);

      if (likedError) throw likedError;

      // Build mic details map
      const micDetailsMap = new Map(micDetails?.map(m => [m.unique_identifier, m]) || []);

      // Calculate stats
      const venues = new Set<string>();
      const boroughs = new Set<string>();
      const neighborhoods = new Set<string>();
      const venueCount: Record<string, number> = {};
      const dayCount: Record<string, number> = {};
      const monthCount: Record<string, number> = {};
      let totalStageTime = 0;
      let firstDate: Date | null = null;

      trackedMics?.forEach(tracked => {
        const mic = micDetailsMap.get(tracked.open_mic_id);
        if (!mic) return;

        // Venue
        if (mic.venue_name) {
          venues.add(mic.venue_name);
          venueCount[mic.venue_name] = (venueCount[mic.venue_name] || 0) + 1;
        }

        // Borough
        if (mic.borough) boroughs.add(mic.borough);

        // Neighborhood
        if (mic.neighborhood) neighborhoods.add(mic.neighborhood);

        // Day
        if (mic.day) {
          dayCount[mic.day] = (dayCount[mic.day] || 0) + 1;
        }

        // Stage time (parse from string like "5 min" or "5 minutes")
        if (mic.stage_time) {
          const match = mic.stage_time.match(/(\d+)/);
          totalStageTime += match ? parseInt(match[1], 10) : 5; // default 5 min
        } else {
          totalStageTime += 5; // default
        }

        // Month
        const createdAt = new Date(tracked.created_at);
        const monthKey = createdAt.toLocaleString('default', { month: 'short' });
        monthCount[monthKey] = (monthCount[monthKey] || 0) + 1;

        // First date
        if (!firstDate || createdAt < firstDate) {
          firstDate = createdAt;
        }
      });

      // Find top venue
      const topVenueEntry = Object.entries(venueCount).sort((a, b) => b[1] - a[1])[0];
      const topVenue = topVenueEntry ? { name: topVenueEntry[0], count: topVenueEntry[1] } : null;

      // Find favorite day
      const favoriteDayEntry = Object.entries(dayCount).sort((a, b) => b[1] - a[1])[0];
      const favoriteDay = favoriteDayEntry ? favoriteDayEntry[0] : null;

      // Build monthly breakdown
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const monthlyBreakdown = months.map(month => ({
        month,
        count: monthCount[month] || 0
      }));

      // Build days breakdown
      const daysBreakdown = DAYS_ORDER.map(day => ({
        day,
        count: dayCount[day] || 0
      }));

      return {
        totalMics: trackedMics?.length || 0,
        uniqueVenues: venues.size,
        uniqueBoroughs: Array.from(boroughs),
        uniqueNeighborhoods: Array.from(neighborhoods),
        favoriteDay,
        topVenue,
        estimatedStageTime: totalStageTime,
        likedMicsCount: likedMics?.length || 0,
        firstMicDate: firstDate ? firstDate.toISOString() : null,
        monthlyBreakdown,
        daysBreakdown
      };
    },
    enabled: !!userId,
    staleTime: 5 * 60 * 1000,
  });
};
