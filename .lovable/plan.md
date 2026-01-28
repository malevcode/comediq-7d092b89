

# Fix: Deploy Edge Function `get-mapbox-token`

## Problem
The `get-mapbox-token` edge function is failing to deploy with an internal server error. This is likely caused by:

1. **Outdated syntax** - Using old `serve()` import from `https://deno.land/std@0.168.0/http/server.ts` instead of the modern `Deno.serve()` API
2. **Extra configuration files** - The function has `deno.json` and `.npmrc` files that other working functions don't have, which can cause lockfile/compatibility issues
3. **Missing config entry** - The `verify-mic` function is missing from `config.toml` (but works - should add for consistency)

## Solution

### Changes to Make

**1. Update `supabase/functions/get-mapbox-token/index.ts`**
- Replace `serve()` import with `Deno.serve()` (matches working `verify-mic` function)
- Use `null` response for OPTIONS (not `'ok'` string)
- Simplify the code structure

**2. Delete extra files in the function folder**
- Remove `supabase/functions/get-mapbox-token/deno.json`
- Remove `supabase/functions/get-mapbox-token/.npmrc`

**3. Update `supabase/config.toml`**
- Add missing `verify-mic` function entry for consistency

### Updated Code for `index.ts`

```typescript
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get the Mapbox token from environment
    const token = Deno.env.get('MAPBOX_TOKEN') || Deno.env.get('VITE_MAPBOX_TOKEN');
    
    if (!token) {
      return new Response(
        JSON.stringify({ 
          error: 'Mapbox token not found',
          message: 'Please set MAPBOX_TOKEN in Supabase Edge Function secrets'
        }),
        { 
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    return new Response(
      JSON.stringify({ token }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to retrieve token' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
```

### Files Summary

| File | Action |
|------|--------|
| `supabase/functions/get-mapbox-token/index.ts` | Rewrite with `Deno.serve()` |
| `supabase/functions/get-mapbox-token/deno.json` | Delete |
| `supabase/functions/get-mapbox-token/.npmrc` | Delete |
| `supabase/config.toml` | Add `verify-mic` entry |

### Why This Should Work
The `verify-mic` function uses the exact same pattern (`Deno.serve()`) and deploys successfully. The old `serve()` import from `deno.land/std` is deprecated and can cause deployment issues with the edge runtime.

