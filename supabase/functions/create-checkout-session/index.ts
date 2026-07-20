import Stripe from 'npm:stripe@17.7.0'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2?target=deno'

const stripeSecretKey = Deno.env.get('STRIPE_SECRET_KEY') ?? ''
const fullPassPriceId = Deno.env.get('STRIPE_PRICE_PAID') ?? ''
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

const getErrorMessage = (error: unknown) => {
  if (error instanceof Error && error.message) return error.message
  if (error && typeof error === 'object') {
    if ('message' in error && typeof (error as { message?: unknown }).message === 'string') {
      return (error as { message: string }).message
    }

    if ('error' in error) {
      const nested = (error as { error?: unknown }).error
      if (nested instanceof Error && nested.message) return nested.message
      if (nested && typeof nested === 'object' && 'message' in nested && typeof (nested as { message?: unknown }).message === 'string') {
        return (nested as { message: string }).message
      }
      if (typeof nested === 'string') return nested
    }

    if ('details' in error && typeof (error as { details?: unknown }).details === 'string') {
      return (error as { details: string }).details
    }

    try {
      return JSON.stringify(error)
    } catch {
      return 'Could not create checkout session'
    }
  }

  return typeof error === 'string' && error ? error : 'Could not create checkout session'
}

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

const getSafeReturnPath = (value: unknown) =>
  typeof value === 'string' && value.startsWith('/') ? value : '/'

const withSubscriptionSuccess = (path: string) => {
  const separator = path.includes('?') ? '&' : '?'
  return `${siteUrl}${path}${separator}subscription=success`
}

const getSafeReturnUrl = (value: unknown) => {
  if (typeof value !== 'string') return null

  try {
    const url = new URL(value)
    if (url.protocol === 'comediq:' || url.protocol === 'https:') {
      return url.toString()
    }
  } catch {
    return null
  }

  return null
}

const withSubscriptionSuccessUrl = (url: string) => {
  const parsedUrl = new URL(url)
  parsedUrl.searchParams.set('subscription', 'success')
  return parsedUrl.toString()
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  if (req.method !== 'POST') {
    return json({ error: 'Method not allowed' }, 405)
  }

  if (!stripeSecretKey || !fullPassPriceId || !supabaseUrl || !anonKey || !serviceRoleKey) {
    console.error('Checkout session function is missing required environment variables')
    return json({ error: 'Checkout is not configured' }, 500)
  }

  try {
    const user = await getAuthedUser(req)
    if (!user?.email) return json({ error: 'Not authenticated' }, 401)
    console.log('Creating checkout session for user', user.id)

    const { returnPath, returnUrl } = await req.json().catch(() => ({ returnPath: '/' }))
    const safeReturnPath = getSafeReturnPath(returnPath)
    const safeReturnUrl = getSafeReturnUrl(returnUrl)

    const admin = createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })

    const { data: profile, error: profileError } = await admin
      .from('profiles')
      .select('stripe_customer_id')
      .eq('user_id', user.id)
      .maybeSingle()

    if (profileError) throw profileError
    console.log('Loaded checkout profile', { userId: user.id, hasCustomer: Boolean(profile?.stripe_customer_id) })

    let customerId = profile?.stripe_customer_id as string | null | undefined

    if (!customerId) {
      const existingCustomers = await stripe.customers.list({
        email: user.email,
        limit: 1,
      })

      const customer = existingCustomers.data[0] ?? await stripe.customers.create({
        email: user.email,
        metadata: {
          supabase_user_id: user.id,
        },
      })

      customerId = customer.id
      console.log('Resolved Stripe customer', { userId: user.id, customerId })

      await admin
        .from('profiles')
        .upsert(
          {
            user_id: user.id,
            stripe_customer_id: customerId,
          },
          { onConflict: 'user_id' },
        )
    }

    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      customer: customerId,
      client_reference_id: user.id,
      line_items: [
        {
          price: fullPassPriceId,
          quantity: 1,
        },
      ],
      subscription_data: {
        metadata: {
          supabase_user_id: user.id,
        },
      },
      success_url: safeReturnUrl ? withSubscriptionSuccessUrl(safeReturnUrl) : withSubscriptionSuccess(safeReturnPath),
      cancel_url: safeReturnUrl ?? `${siteUrl}${safeReturnPath}`,
    })
    console.log('Created checkout session', { userId: user.id, sessionId: session.id })

    return json({ url: session.url })
  } catch (err) {
    console.error('Checkout session error:', err)
    return json({ error: getErrorMessage(err) }, 500)
  }
})
