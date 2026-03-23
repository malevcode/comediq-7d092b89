import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, serviceRoleKey)

    // Get top 5 liked active mics
    const { data: likeCounts, error: likeError } = await supabase
      .from('mic_like_counts')
      .select('mic_unique_identifier, likes')
      .order('likes', { ascending: false })
      .limit(10)

    if (likeError) throw likeError

    if (!likeCounts || likeCounts.length === 0) {
      return new Response(JSON.stringify({ message: 'No liked mics found', refreshed: 0 }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Fetch mic details for top liked
    const micIds = likeCounts.map(lc => lc.mic_unique_identifier)
    const { data: mics, error: micsError } = await supabase
      .from('open_mics_historical')
      .select('unique_identifier, open_mic, venue_name, borough, neighborhood, day, start_time, cost')
      .in('unique_identifier', micIds)
      .eq('active', true)

    if (micsError) throw micsError

    // Merge and rank (top 5 active)
    const ranked = (mics || [])
      .map(mic => {
        const likeEntry = likeCounts.find(lc => lc.mic_unique_identifier === mic.unique_identifier)
        return { ...mic, likes: likeEntry?.likes || 0 }
      })
      .sort((a, b) => b.likes - a.likes)
      .slice(0, 5)

    const weekStart = new Date()
    weekStart.setDate(weekStart.getDate() - weekStart.getDay())
    const weekStartStr = weekStart.toISOString().split('T')[0]

    // Clear old data and insert new snapshot
    await supabase.from('weekly_top_mics').delete().neq('id', '00000000-0000-0000-0000-000000000000')

    const rows = ranked.map((mic, idx) => ({
      mic_unique_identifier: mic.unique_identifier,
      mic_name: mic.open_mic,
      venue_name: mic.venue_name,
      borough: mic.borough,
      neighborhood: mic.neighborhood,
      day: mic.day,
      start_time: mic.start_time,
      cost: mic.cost,
      like_count: mic.likes,
      rank: idx + 1,
      week_start: weekStartStr,
    }))

    const { error: insertError } = await supabase.from('weekly_top_mics').insert(rows)
    if (insertError) throw insertError

    return new Response(JSON.stringify({ message: 'Weekly top mics refreshed', refreshed: rows.length }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
