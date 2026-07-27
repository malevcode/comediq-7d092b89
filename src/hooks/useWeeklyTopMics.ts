import { useQuery } from '@tanstack/react-query';

export interface WeeklyTopMic {
  id: string;
  mic_unique_identifier: string;
  mic_name: string;
  venue_name: string | null;
  borough: string | null;
  neighborhood: string | null;
  day: string | null;
  start_time: string | null;
  cost: string | null;
  like_count: number;
  rank: number;
  week_start: string;
  to?: string;
}

const CACHE_KEY = 'comediq_weekly_top_v1';

const WEEK_START = '2026-07-06';

// Manually curated top mics list.
export const MANUAL_TOP_MICS: WeeklyTopMic[] = [
  {
    id: 'manual-knockouts',
    mic_unique_identifier: '5b43d5b5-e4d0-4038-b02b-38ea43d7434c',
    mic_name: 'Knockouts Comedy',
    venue_name: 'The Stand',
    borough: 'Manhattan',
    neighborhood: 'Union Square',
    day: 'Thursday',
    start_time: '5:00 PM',
    cost: '$5(drink ticket inc.)',
    like_count: 1,
    rank: 1,
    week_start: WEEK_START,
  },
  {
    id: 'manual-not-booked',
    mic_unique_identifier: '3cbcd790-258f-4a30-bc05-c932a0520d3f',
    mic_name: 'Not Booked Mic',
    venue_name: 'Comic Strip Live',
    borough: 'Manhattan',
    neighborhood: 'UES',
    day: 'Friday',
    start_time: '6:00 PM',
    cost: '$7 (free drink)',
    like_count: 1,
    rank: 2,
    week_start: WEEK_START,
  },
  {
    id: 'manual-comedymicsgmail',
    mic_unique_identifier: '6602936a-9abf-4ade-9cba-41b7ff8a4824',
    mic_name: 'ComedyMicsGmail TheStand',
    venue_name: 'The Stand',
    borough: 'Manhattan',
    neighborhood: 'Union Square',
    day: 'Wednesday',
    start_time: '5:00 PM',
    cost: '$5 & u get a drink ticket',
    like_count: 1,
    rank: 3,
    week_start: WEEK_START,
  },
  {
    id: 'manual-brainstorm',
    mic_unique_identifier: '75877c29-43b9-4c68-b98c-17e0f81c3def',
    mic_name: 'Brainstorm Mic',
    venue_name: "Judy Z's",
    borough: 'Manhattan',
    neighborhood: 'West Village',
    day: 'Wednesday',
    start_time: '6:00 PM',
    cost: 'Free; purchase recommended.',
    like_count: 0,
    rank: 4,
    week_start: WEEK_START,
  },
];

function saveCache(data: WeeklyTopMic[]) {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify({ data }));
  } catch {
    // ignore storage errors
  }
}

// Supabase calls are disabled — serve the manually curated list from localStorage.
export function useWeeklyTopMics() {
  return useQuery({
    queryKey: ['weekly-top-mics'],
    queryFn: async () => {
      saveCache(MANUAL_TOP_MICS);
      return MANUAL_TOP_MICS;
    },
    placeholderData: MANUAL_TOP_MICS,
    staleTime: Infinity,
    gcTime: Infinity,
    refetchOnWindowFocus: false,
  });
}
