// Midnight MOTD resolver — runs daily via pg_cron at 00:05 ET
// Resolves today's MOTD using the resolve_motd_for(date) Postgres function
// and writes a non-locked entry into mic_of_the_day if no admin lock exists.

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
    const SERVICE_ROLE = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    // Compute "today" in America/New_York
    const today = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'America/New_York',
      year: 'numeric', month: '2-digit', day: '2-digit',
    }).format(new Date());

    const headers = {
      apikey: SERVICE_ROLE,
      Authorization: `Bearer ${SERVICE_ROLE}`,
      'Content-Type': 'application/json',
    };

    // 1. Resolve winner via RPC
    const rpcRes = await fetch(`${SUPABASE_URL}/rest/v1/rpc/resolve_motd_for`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ target_date: today }),
    });
    const winner = await rpcRes.json();

    if (!winner) {
      return new Response(JSON.stringify({ ok: true, date: today, message: 'No winner found' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // 2. Check existing entry for today
    const existingRes = await fetch(
      `${SUPABASE_URL}/rest/v1/mic_of_the_day?claim_date=eq.${today}&select=id,is_admin_locked,mic_unique_identifier`,
      { headers }
    );
    const existing = await existingRes.json();
    const lockedRow = existing.find((r: any) => r.is_admin_locked);

    // 3. If admin-locked, leave it alone
    if (lockedRow) {
      return new Response(JSON.stringify({ ok: true, date: today, action: 'skipped-locked', mic: lockedRow.mic_unique_identifier }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // 4. Otherwise, replace today's row with the resolver winner
    if (existing.length > 0) {
      await fetch(`${SUPABASE_URL}/rest/v1/mic_of_the_day?claim_date=eq.${today}`, {
        method: 'DELETE',
        headers,
      });
    }

    const insertRes = await fetch(`${SUPABASE_URL}/rest/v1/mic_of_the_day`, {
      method: 'POST',
      headers: { ...headers, Prefer: 'return=representation' },
      body: JSON.stringify({
        mic_unique_identifier: winner,
        claimed_by: '00000000-0000-0000-0000-000000000000', // system user placeholder
        claim_date: today,
        is_admin_locked: false,
      }),
    });
    const inserted = await insertRes.json();

    return new Response(JSON.stringify({ ok: true, date: today, action: 'resolved', mic: winner, inserted }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    return new Response(JSON.stringify({ ok: false, error: (err as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
