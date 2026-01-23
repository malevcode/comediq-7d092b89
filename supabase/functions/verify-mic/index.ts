import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Hash IP for privacy-preserving rate limiting
async function hashIP(ip: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(ip + "comediq-salt-2026");
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { mic_unique_identifier } = await req.json();

    if (!mic_unique_identifier) {
      return new Response(
        JSON.stringify({ error: 'mic_unique_identifier is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get client IP for rate limiting
    const clientIP = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() 
      || req.headers.get('x-real-ip') 
      || 'unknown';
    const ipHash = await hashIP(clientIP);

    // Create Supabase client with service role for admin operations
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Check for existing verification from same IP for this mic today
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const { data: existingVerification } = await supabase
      .from('mic_verifications')
      .select('id, verified_at')
      .eq('mic_unique_identifier', mic_unique_identifier)
      .eq('ip_hash', ipHash)
      .gte('verified_at', today.toISOString())
      .limit(1)
      .single();

    if (existingVerification) {
      return new Response(
        JSON.stringify({ 
          success: true, 
          alreadyVerified: true,
          verifiedAt: existingVerification.verified_at,
          message: 'Already verified today!' 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get user ID if authenticated
    const authHeader = req.headers.get('Authorization');
    let userId = null;
    if (authHeader) {
      const anonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
      const userClient = createClient(supabaseUrl, anonKey, {
        global: { headers: { Authorization: authHeader } }
      });
      const { data: { user } } = await userClient.auth.getUser();
      userId = user?.id || null;
    }

    // Insert new verification
    const { data: newVerification, error: insertError } = await supabase
      .from('mic_verifications')
      .insert({
        mic_unique_identifier,
        user_id: userId,
        ip_hash: ipHash,
        verified_at: new Date().toISOString()
      })
      .select('verified_at')
      .single();

    if (insertError) {
      console.error('Insert error:', insertError);
      return new Response(
        JSON.stringify({ error: 'Failed to record verification', details: insertError.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get total verification count for this mic
    const { count } = await supabase
      .from('mic_verifications')
      .select('*', { count: 'exact', head: true })
      .eq('mic_unique_identifier', mic_unique_identifier);

    return new Response(
      JSON.stringify({ 
        success: true, 
        alreadyVerified: false,
        verifiedAt: newVerification.verified_at,
        totalVerifications: count || 1,
        message: 'Thanks for verifying!' 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
