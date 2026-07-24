import Stripe from 'npm:stripe@17.7.0'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2?target=deno'

const stripeSecretKey = Deno.env.get('STRIPE_SECRET_KEY') ?? ''
const fullPassPriceId = Deno.env.get('STRIPE_PRICE_PAID') ?? ''
const fullPassPlan = Deno.env.get('STRIPE_FULL_PASS_PLAN') ?? 'premium'
const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
const anonKey = Deno.env.get('SUPABASE_ANON_KEY') ?? ''
const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''

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

function hasFullPassPrice(subscription: Stripe.Subscription) {
  return subscription.items.data.some((item) => item.price.id === fullPassPriceId)
}

function isCurrentFullPass(subscription: Stripe.Subscription) {
  return (
    (subscription.status === 'active' || subscription.status === 'trialing') &&
    !subscription.cancel_at_period_end &&
    hasFullPassPrice(subscription)
  )
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  if (req.method !== 'POST') {
    return json({ error: 'Method not allowed' }, 405)
  }

  if (!stripeSecretKey || !fullPassPriceId || !supabaseUrl || !anonKey || !serviceRoleKey) {
    console.error('Subscription sync function is missing required environment variables')
    return json({ error: 'Subscription sync is not configured' }, 500)
  }

  try {
    const user = await getAuthedUser(req)
    if (!user?.email) return json({ error: 'Not authenticated' }, 401)

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

    let customerId = profile?.stripe_customer_id as string | null | undefined

    if (!customerId) {
      const customers = await stripe.customers.list({
        email: user.email,
        limit: 1,
      })
      customerId = customers.data[0]?.id ?? null
    }

    if (!customerId) {
      return json({ subscriptionPlan: 'free', error: 'No Stripe customer found' }, 404)
    }

    const subscriptions = await stripe.subscriptions.list({
      customer: customerId,
      status: 'all',
      limit: 20,
    })

    const activeFullPass = subscriptions.data.find(isCurrentFullPass)

    if (activeFullPass) {
      const { error } = await admin
        .from('profiles')
        .upsert(
          {
            user_id: user.id,
            subscription_plan: fullPassPlan,
            stripe_customer_id: customerId,
            stripe_subscription_id: activeFullPass.id,
          },
          { onConflict: 'user_id' },
        )

      if (error) throw error

      return json({
        subscriptionPlan: fullPassPlan,
        stripeCustomerId: customerId,
        stripeSubscriptionId: activeFullPass.id,
      })
    }

    const { error } = await admin
      .from('profiles')
      .upsert(
        {
          user_id: user.id,
          subscription_plan: 'free',
          stripe_customer_id: customerId,
          stripe_subscription_id: null,
        },
        { onConflict: 'user_id' },
      )

    if (error) throw error

    return json({
      subscriptionPlan: 'free',
      stripeCustomerId: customerId,
      stripeSubscriptionId: null,
    })
  } catch (err) {
    console.error('Subscription sync error:', err)
    return json({ error: err instanceof Error ? err.message : 'Could not sync subscription status' }, 500)
  }
})
