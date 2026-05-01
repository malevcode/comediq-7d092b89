import { useQuery } from '@tanstack/react-query';
import { pb } from '@/integrations/pocketbase/client';

export interface WrappedStats {
  totalMics: number;
  totalShows: number;
  totalPerformances: number;
  uniqueVenues: number;
  uniqueBoroughs: string[];
  uniqueNeighborhoods: string[];
  favoriteDay: string | null;
  topVenue: { name: string; count: number } | null;
  estimatedStageTime: number;
  likedMicsCount: number;
  firstMicDate: string | null;
  monthlyBreakdown: { month: string; count: number }[];
  daysBreakdown: { day: string; count: number }[];
}

const DAYS_ORDER = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const DEFAULT_STAGE_TIME = 5;

export const useWrapped = (userId?: string, year: number = 2025) => {
  return useQuery({
    queryKey: ['wrapped', userId, year],
    queryFn: async (): Promise<WrappedStats> => {
      if (!userId) throw new Error('User ID required');

      const startOfYear = `${year}-01-01 00:00:00`;
      const endOfYear = `${year}-12-31 23:59:59`;

      const [trackedMics, customShows, likedMics] = await Promise.all([
        pb.collection('profile_open_mics').getFullList({
          filter: `(profile_id = "${userId}" || profile_id = "${userId}") && created >= "${startOfYear}" && created <= "${endOfYear}"`,
          fields: 'id,created,notes,open_mic_id,schedule_type,custom_stage_time',
        }),
        pb.collection('profile_custom_shows').getFullList({
          filter: `profile_id = "${userId}" && (schedule_type = "completed" || schedule_type = "upcoming") && created >= "${startOfYear}" && created <= "${endOfYear}"`,
          fields: 'id,created,title,venue,borough,schedule_type,stage_time_minutes',
        }),
        pb.collection('user_mic_ratings').getFullList({
          filter: `user_id = "${userId}" && rating = "like" && created >= "${startOfYear}" && created <= "${endOfYear}"`,
          fields: 'id',
        }),
      ]);

      const micIds = [...new Set(trackedMics.map(m => m.open_mic_id as string).filter(Boolean))];
      const micDetails = micIds.length > 0
        ? await pb.collection('open_mics_historical').getFullList({
            filter: micIds.map(id => `unique_identifier = "${id}"`).join(' || '),
            fields: 'unique_identifier,open_mic,venue_name,borough,neighborhood,day,stage_time',
          })
        : [];

      const micDetailsMap = new Map(micDetails.map(m => [m.unique_identifier, m]));

      const venues = new Set<string>();
      const boroughs = new Set<string>();
      const neighborhoods = new Set<string>();
      const venueCount: Record<string, number> = {};
      const dayCount: Record<string, number> = {};
      const monthCount: Record<string, number> = {};
      let totalStageTime = 0;
      let firstDate: Date | null = null;

      trackedMics.forEach(tracked => {
        const mic = micDetailsMap.get(tracked.open_mic_id as string);
        if (!mic) return;

        if (mic.venue_name) {
          venues.add(mic.venue_name);
          venueCount[mic.venue_name] = (venueCount[mic.venue_name] || 0) + 1;
        }
        if (mic.borough) boroughs.add(mic.borough);
        if (mic.neighborhood) neighborhoods.add(mic.neighborhood);
        if (mic.day) dayCount[mic.day] = (dayCount[mic.day] || 0) + 1;

        if (tracked.custom_stage_time) {
          totalStageTime += tracked.custom_stage_time;
        } else if (mic.stage_time) {
          const match = (mic.stage_time as string).match(/(\d+)/);
          totalStageTime += match ? parseInt(match[1], 10) : DEFAULT_STAGE_TIME;
        } else {
          totalStageTime += DEFAULT_STAGE_TIME;
        }

        const createdAt = new Date(tracked.created);
        const monthKey = createdAt.toLocaleString('default', { month: 'short' });
        monthCount[monthKey] = (monthCount[monthKey] || 0) + 1;
        if (!firstDate || createdAt < firstDate) firstDate = createdAt;
      });

      customShows.forEach(show => {
        if (show.venue) {
          venues.add(show.venue);
          venueCount[show.venue] = (venueCount[show.venue] || 0) + 1;
        }
        if (show.borough) boroughs.add(show.borough);
        totalStageTime += (show.stage_time_minutes as number) || DEFAULT_STAGE_TIME;

        const createdAt = new Date(show.created);
        const monthKey = createdAt.toLocaleString('default', { month: 'short' });
        monthCount[monthKey] = (monthCount[monthKey] || 0) + 1;
        if (!firstDate || createdAt < firstDate) firstDate = createdAt;
      });

      const topVenueEntry = Object.entries(venueCount).sort((a, b) => b[1] - a[1])[0];
      const topVenue = topVenueEntry ? { name: topVenueEntry[0], count: topVenueEntry[1] } : null;
      const favoriteDayEntry = Object.entries(dayCount).sort((a, b) => b[1] - a[1])[0];

      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

      return {
        totalMics: trackedMics.length,
        totalShows: customShows.length,
        totalPerformances: trackedMics.length + customShows.length,
        uniqueVenues: venues.size,
        uniqueBoroughs: Array.from(boroughs),
        uniqueNeighborhoods: Array.from(neighborhoods),
        favoriteDay: favoriteDayEntry ? favoriteDayEntry[0] : null,
        topVenue,
        estimatedStageTime: totalStageTime,
        likedMicsCount: likedMics.length,
        firstMicDate: firstDate ? (firstDate as Date).toISOString() : null,
        monthlyBreakdown: months.map(month => ({ month, count: monthCount[month] || 0 })),
        daysBreakdown: DAYS_ORDER.map(day => ({ day, count: dayCount[day] || 0 })),
      };
    },
    enabled: !!userId,
    staleTime: 5 * 60 * 1000,
  });
};
