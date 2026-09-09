import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface ComedyHistoryEntry {
  id: string;
  kind: 'mic' | 'show';
  title: string;
  venue: string | null;
  date: string;
  scheduleType: string | null;
  stageTimeMinutes: number | null;
}

export interface ComedyHistory {
  upcoming: ComedyHistoryEntry[];
  completed: ComedyHistoryEntry[];
  totalPerformances: number;
  uniqueVenues: number;
  estimatedStageTime: number;
  firstDate: string | null;
}

/** Default stage time when a set has no recorded length, matching useWrapped. */
const DEFAULT_STAGE_MINUTES = 5;

const emptyHistory: ComedyHistory = {
  upcoming: [],
  completed: [],
  totalPerformances: 0,
  uniqueVenues: 0,
  estimatedStageTime: 0,
  firstDate: null,
};

/**
 * All-time comedy history for the My Comedy tab. Deliberately not year-scoped,
 * unlike useWrapped which powers the year-in-review page.
 */
export const useMyComedy = (userId?: string) => {
  return useQuery({
    queryKey: ['myComedy', userId],
    enabled: !!userId,
    queryFn: async (): Promise<ComedyHistory> => {
      if (!userId) return emptyHistory;

      const [micsResult, showsResult] = await Promise.all([
        supabase
          .from('profile_open_mics')
          .select('id, created_at, open_mic_id, schedule_type, custom_stage_time, notes')
          .eq('profile_id', userId),
        supabase
          .from('profile_custom_shows')
          .select('id, created_at, title, venue, borough, date, schedule_type, stage_time_minutes')
          .eq('profile_id', userId),
      ]);

      if (micsResult.error) throw micsResult.error;
      if (showsResult.error) throw showsResult.error;

      const trackedMics = micsResult.data || [];
      const customShows = showsResult.data || [];

      // Resolve mic names in one round trip rather than per row.
      const micIds = trackedMics.map(m => m.open_mic_id).filter(Boolean) as string[];
      let micDetails: Record<string, { open_mic: string | null; venue_name: string | null }> = {};

      if (micIds.length > 0) {
        const { data: micRows } = await supabase
          .from('open_mics_historical')
          .select('unique_identifier, open_mic, venue_name')
          .in('unique_identifier', micIds);

        micDetails = Object.fromEntries(
          (micRows || []).map(row => [
            row.unique_identifier,
            { open_mic: row.open_mic, venue_name: row.venue_name },
          ])
        );
      }

      const entries: ComedyHistoryEntry[] = [
        ...trackedMics.map((mic): ComedyHistoryEntry => {
          const detail = mic.open_mic_id ? micDetails[mic.open_mic_id] : undefined;
          return {
            id: mic.id,
            kind: 'mic',
            title: detail?.open_mic || 'Open mic',
            venue: detail?.venue_name ?? null,
            date: mic.created_at,
            scheduleType: mic.schedule_type,
            stageTimeMinutes: mic.custom_stage_time ?? null,
          };
        }),
        ...customShows.map((show): ComedyHistoryEntry => ({
          id: show.id,
          kind: 'show',
          title: show.title || 'Show',
          venue: show.venue ?? null,
          date: show.date || show.created_at,
          scheduleType: show.schedule_type,
          stageTimeMinutes: show.stage_time_minutes ?? null,
        })),
      ];

      const byDateDesc = (a: ComedyHistoryEntry, b: ComedyHistoryEntry) =>
        new Date(b.date).getTime() - new Date(a.date).getTime();

      const upcoming = entries.filter(e => e.scheduleType === 'upcoming').sort(byDateDesc);
      const completed = entries.filter(e => e.scheduleType !== 'upcoming' && e.scheduleType !== 'cancelled').sort(byDateDesc);

      const venues = new Set(completed.map(e => e.venue).filter(Boolean) as string[]);
      const estimatedStageTime = completed.reduce(
        (total, entry) => total + (entry.stageTimeMinutes ?? DEFAULT_STAGE_MINUTES),
        0
      );
      const oldest = [...completed].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())[0];

      return {
        upcoming,
        completed,
        totalPerformances: completed.length,
        uniqueVenues: venues.size,
        estimatedStageTime,
        firstDate: oldest?.date ?? null,
      };
    },
  });
};
