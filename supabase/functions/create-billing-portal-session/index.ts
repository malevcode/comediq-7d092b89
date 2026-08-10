import Stripe from 'npm:stripe@17.7.0'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2?target=deno'

const stripeSecretKey = Deno.env.get('STRIPE_SECRET_KEY') ?? ''
const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
const anonKey = Deno.env.get('SUPABASE_ANON_KEY') ?? ''
const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
const siteUrl = Deno.env.get('SITE_URL') ?? 'https://comediq.us'

const stripe = new Stripe(stripeSecretKey, {
  apiVersion: '2024-06-20',
})

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const json = (body: Record<string, unknown>, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: {
      ...corsHeaders,
      'Content-Type': 'application/json',
    },
  })

async function getAuthedUser(req: Request) {
  const authHeader = req.headers.get('Authorization') ?? ''
  if (!authHeader) return null

  const supabase = createClient(supabaseUrl, anonKey, {
    global: {
      headers: { Authorization: authHeader },
    },
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })

  const { data, error } = await supabase.auth.getUser()
  if (error) throw error
  return data.user
}

const getSafeReturnUrl = (value: unknown) => {
  if (typeof value !== 'string') return null

  try {
    const url = new URL(value)
    if (url.protocol === 'comediq:' || url.protocol === 'https:') {
      return url.toString()
    }

    if (
      url.protocol === 'http:' &&
      (url.hostname === 'localhost' || url.hostname === '127.0.0.1')
    ) {
      return url.toString()
    }
  } catch {
    return null
  }

  return null
}

const getRequestOriginReturnUrl = (req: Request, path: string) => {
  const origin = req.headers.get('origin')
  const safeOrigin = getSafeReturnUrl(origin)
  if (safeOrigin) return new URL(path, safeOrigin).toString()

  const referer = req.headers.get('referer')
  if (!referer) return null

  try {
    const refererUrl = new URL(referer)
    const refererOrigin = getSafeReturnUrl(refererUrl.origin)
    return refererOrigin ? new URL(path, refererOrigin).toString() : null
  } catch {
    return null
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  if (req.method !== 'POST') {
    return json({ error: 'Method not allowed' }, 405)
  }

  if (!stripeSecretKey || !supabaseUrl || !anonKey || !serviceRoleKey) {
    console.error('Billing portal function is missing required environment variables')
    return json({ error: 'Billing portal is not configured' }, 500)
  }

  try {
    const user = await getAuthedUser(req)
    if (!user) return json({ error: 'Not authenticated' }, 401)

    const admin = createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })

    const { data: profile, error: profileError } = await admin
      .from('profiles')
      .select('stripe_customer_id, subscription_plan')
      .eq('user_id', user.id)
      .maybeSingle()

    if (profileError) throw profileError
    if (!profile || profile.subscription_plan === 'free') {
      return json({ error: 'No active Full Pass subscription found' }, 403)
    }

    let customerId = profile.stripe_customer_id as string | null

    if (!customerId && user.email) {
      const customers = await stripe.customers.list({
        email: user.email,
        limit: 1,
      })
      customerId = customers.data[0]?.id ?? null

      if (customerId) {
        await admin
          .from('profiles')
          .update({ stripe_customer_id: customerId })
          .eq('user_id', user.id)
      }
    }

    if (!customerId) {
      return json({ error: 'No Stripe customer found for this account' }, 404)
    }

    const { returnPath, returnUrl } = await req.json().catch(() => ({ returnPath: '/profile' }))
    const safeReturnPath = typeof returnPath === 'string' && returnPath.startsWith('/')
      ? returnPath
      : '/profile'
    const safeReturnUrl = getSafeReturnUrl(returnUrl)
    const inferredReturnUrl = getRequestOriginReturnUrl(req, safeReturnPath)

    const session = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: safeReturnUrl ?? inferredReturnUrl ?? `${siteUrl}${safeReturnPath}`,
    })

    return json({ url: session.url })
  } catch (err) {
    console.error('Billing portal error:', err)
    if (err instanceof Error && /configuration|portal/i.test(err.message)) {
      return json({ error: 'Stripe Billing Portal is not configured yet' }, 500)
    }

    if (err instanceof Error) {
      return json({ error: err.message }, 500)
    }

    return json({ error: 'Could not create billing portal session' }, 500)
  }
})
