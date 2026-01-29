// Deployed: 2025-01-01 - Platform stats endpoint
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log('Fetching platform stats...');

    // Filter for NYC only (city = 'New York' or null, excluding other cities like LA)
    const nycFilter = { column: 'city', value: 'New York' };
    
    const [
      totalMicsResult,
      activeMicsResult,
      boroughStatsResult,
      dayStatsResult,
      freeMicsResult,
      totalUsersResult,
      totalVisitsResult,
      totalRatingsResult,
      savedMicsResult,
      neighborhoodsResult,
      venuesResult
    ] = await Promise.all([
      supabase.from('open_mics_historical').select('*', { count: 'exact', head: true }).or('city.eq.New York,city.is.null'),
      supabase.from('open_mics_historical').select('*', { count: 'exact', head: true }).eq('active', true).or('city.eq.New York,city.is.null'),
      supabase.from('open_mics_historical').select('borough').eq('active', true).or('city.eq.New York,city.is.null'),
      supabase.from('open_mics_historical').select('day').eq('active', true).or('city.eq.New York,city.is.null'),
      supabase.from('open_mics_historical').select('*', { count: 'exact', head: true }).eq('active', true).or('city.eq.New York,city.is.null').ilike('cost', '%free%'),
      supabase.from('profiles').select('*', { count: 'exact', head: true }),
      supabase.from('user_visits').select('*', { count: 'exact', head: true }),
      supabase.from('user_mic_ratings').select('*', { count: 'exact', head: true }),
      supabase.from('profile_open_mics').select('*', { count: 'exact', head: true }),
      supabase.from('open_mics_historical').select('neighborhood').eq('active', true).or('city.eq.New York,city.is.null'),
      supabase.from('open_mics_historical').select('venue_name').eq('active', true).or('city.eq.New York,city.is.null')
    ]);

    const boroughCounts: Record<string, number> = {};
    if (boroughStatsResult.data) {
      for (const mic of boroughStatsResult.data) {
        const borough = mic.borough || 'Unknown';
        boroughCounts[borough] = (boroughCounts[borough] || 0) + 1;
      }
    }

    const dayCounts: Record<string, number> = {};
    if (dayStatsResult.data) {
      for (const mic of dayStatsResult.data) {
        const day = mic.day || 'Unknown';
        dayCounts[day] = (dayCounts[day] || 0) + 1;
      }
    }

    const uniqueNeighborhoods = new Set(
      neighborhoodsResult.data?.map(m => m.neighborhood).filter(Boolean) || []
    );
    const uniqueVenues = new Set(
      venuesResult.data?.map(m => m.venue_name).filter(Boolean) || []
    );

    const stats = {
      totalMics: totalMicsResult.count || 0,
      activeMics: activeMicsResult.count || 0,
      inactiveMics: (totalMicsResult.count || 0) - (activeMicsResult.count || 0),
      freeMics: freeMicsResult.count || 0,
      freePercentage: activeMicsResult.count 
        ? Math.round(((freeMicsResult.count || 0) / activeMicsResult.count) * 100)
        : 0,
      totalUsers: totalUsersResult.count || 0,
      totalVisits: totalVisitsResult.count || 0,
      totalRatings: totalRatingsResult.count || 0,
      savedMics: savedMicsResult.count || 0,
      neighborhoods: uniqueNeighborhoods.size,
      venues: uniqueVenues.size,
      boroughStats: Object.entries(boroughCounts)
        .map(([borough, count]) => ({ borough, count }))
        .sort((a, b) => b.count - a.count),
      dayStats: Object.entries(dayCounts)
        .map(([day, count]) => ({ day, count }))
        .sort((a, b) => b.count - a.count),
    };

    console.log('Platform stats fetched successfully:', stats);

    return new Response(JSON.stringify(stats), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error: unknown) {
    console.error('Error fetching platform stats:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
