// Force redeploy: 2025-01-01-v2
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Get the Mapbox token from Vault
    const token = Deno.env.get('VITE_MAPBOX_TOKEN')
    
    if (!token) {
      return new Response(
        JSON.stringify({ 
          error: 'Mapbox token not found in environment variables',
          message: 'Please ensure VITE_MAPBOX_TOKEN is set in Supabase Vault'
        }),
        { 
          status: 404,
          headers: { 
            ...corsHeaders,
            "Content-Type": "application/json" 
          } 
        }
      )
    }

    // Return the token (it's safe to expose this as it's a public token)
    return new Response(
      JSON.stringify({ 
        token,
        message: 'Mapbox token retrieved successfully'
      }),
      { 
        headers: { 
          ...corsHeaders,
          "Content-Type": "application/json" 
        } 
      }
    )
  } catch (error) {
    console.error('Error retrieving Mapbox token:', error)
    
    return new Response(
      JSON.stringify({ 
        error: 'Failed to retrieve Mapbox token',
        message: error.message 
      }),
      { 
        status: 500,
        headers: { 
          ...corsHeaders,
          "Content-Type": "application/json" 
        } 
      }
    )
  }
})
