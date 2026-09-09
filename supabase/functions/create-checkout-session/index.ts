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

const withTicketSuccess = (path: string) => {
  const separator = path.includes('?') ? '&' : '?'
  return `${siteUrl}${path}${separator}ticket=success`
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

const withSubscriptionSuccessUrl = (url: string) => {
  const parsedUrl = new URL(url)
  parsedUrl.searchParams.set('subscription', 'success')
  return parsedUrl.toString()
}

const withTicketSuccessUrl = (url: string) => {
  const parsedUrl = new URL(url)
  parsedUrl.searchParams.set('ticket', 'success')
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

    const body = await req.json().catch(() => ({ returnPath: '/' }))
    const { mode, showId, quantity, returnPath, returnUrl } = body as {
      mode?: string
      showId?: string
      quantity?: number
      returnPath?: string
      returnUrl?: string
    }
    const safeReturnPath = getSafeReturnPath(returnPath)
    const safeReturnUrl = getSafeReturnUrl(returnUrl)
    const isTicketCheckout = mode === 'ticket'

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

      if (customer.metadata?.supabase_user_id !== user.id) {
        await stripe.customers.update(customerId, {
          metadata: {
            ...customer.metadata,
            supabase_user_id: user.id,
          },
        })
      }

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

    if (isTicketCheckout) {
      if (!showId || typeof showId !== 'string') {
        return json({ error: 'showId is required for ticket checkout' }, 400)
      }

      // Price is always read server-side. Never trust an amount from the client.
      const { data: show, error: showError } = await admin
        .from('audience_shows')
        .select('id, title, venue_name, price_cents, is_paid, show_date, status')
        .eq('id', showId)
        .maybeSingle()

      if (showError) throw showError
      if (!show) return json({ error: 'Show not found' }, 404)
      if (!show.is_paid || !show.price_cents || show.price_cents <= 0) {
        return json({ error: 'This show does not sell tickets through Comediq' }, 400)
      }

      const showDay = String(show.show_date).slice(0, 10)
      const today = new Date().toISOString().slice(0, 10)
      if (showDay < today) return json({ error: 'This show has already happened' }, 400)

      const safeQuantity = Math.min(10, Math.max(1, Math.floor(Number(quantity) || 1)))
      const totalCents = show.price_cents * safeQuantity

      const ticketSession = await stripe.checkout.sessions.create({
        mode: 'payment',
        customer: customerId,
        client_reference_id: user.id,
        line_items: [
          {
            price_data: {
              currency: 'usd',
              unit_amount: show.price_cents,
              product_data: {
                name: show.title,
                description: `${show.venue_name} · ${showDay}`,
              },
            },
            quantity: safeQuantity,
          },
        ],
        payment_intent_data: {
          metadata: {
            supabase_user_id: user.id,
            show_id: show.id,
            quantity: String(safeQuantity),
          },
        },
        metadata: {
          supabase_user_id: user.id,
          show_id: show.id,
          quantity: String(safeQuantity),
        },
        success_url: safeReturnUrl
          ? withTicketSuccessUrl(safeReturnUrl)
          : withTicketSuccess(safeReturnPath),
        cancel_url: safeReturnUrl ?? `${siteUrl}${safeReturnPath}`,
      })

      // Recorded as pending; the Stripe webhook flips it to paid.
      const { error: purchaseError } = await admin.from('ticket_purchases').insert({
        user_id: user.id,
        show_id: show.id,
        quantity: safeQuantity,
        total_cents: totalCents,
        status: 'pending',
        stripe_checkout_id: ticketSession.id,
        email: user.email,
      })

      if (purchaseError) {
        console.error('Failed to record pending ticket purchase', purchaseError)
      }

      console.log('Created ticket checkout session', { userId: user.id, showId: show.id, sessionId: ticketSession.id })
      return json({ url: ticketSession.url })
    }

    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      customer: customerId,
      client_reference_id: user.id,
      allow_promotion_codes: true,
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
