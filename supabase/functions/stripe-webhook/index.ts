import Stripe from 'https://esm.sh/stripe@14?target=deno'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2?target=deno'

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') ?? '', {
  apiVersion: '2024-06-20',
  httpClient: Stripe.createFetchHttpClient(),
})

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
)

// Credits granted per plan per billing cycle
const PLAN_CREDITS: Record<string, { plan: string; credits: number }> = {
  [Deno.env.get('STRIPE_PRICE_STANDARD') ?? 'price_standard']: { plan: 'standard', credits: 5 },
  [Deno.env.get('STRIPE_PRICE_PREMIUM') ?? 'price_premium']:   { plan: 'premium',  credits: 15 },
}

async function addCredits(customerId: string, priceId: string, invoiceId: string) {
  // Resolve Supabase user from Stripe customer metadata
  const customer = await stripe.customers.retrieve(customerId) as Stripe.Customer
  const userId = customer.metadata?.supabase_user_id
  if (!userId) {
    console.error(`No supabase_user_id on customer ${customerId}`)
    return
  }

  const config = PLAN_CREDITS[priceId]
  if (!config) {
    console.warn(`Unknown price ${priceId} — no credits granted`)
    return
  }

  // Idempotent: skip if this invoice already credited
  const { data: existing } = await supabase
    .from('credit_transactions')
    .select('id')
    .eq('reference_id', invoiceId)
    .single()

  if (existing) {
    console.log(`Invoice ${invoiceId} already processed`)
    return
  }

  // Add credits and update plan
  await supabase
    .from('profiles')
    .update({
      credits_balance: supabase.rpc('coalesce_add', { current: 'credits_balance', add: config.credits }),
      subscription_plan: config.plan,
    })
    .eq('user_id', userId)

  // Simpler: use raw SQL via rpc for atomic increment
  await supabase.rpc('admin_add_credits', {
    p_user_id: userId,
    p_delta: config.credits,
    p_reason: 'subscription_renewal',
    p_reference: invoiceId,
    p_plan: config.plan,
  })
}

async function handleSubscriptionDeleted(sub: Stripe.Subscription) {
  const customer = await stripe.customers.retrieve(sub.customer as string) as Stripe.Customer
  const userId = customer.metadata?.supabase_user_id
  if (!userId) return

  await supabase
    .from('profiles')
    .update({ subscription_plan: 'free' })
    .eq('user_id', userId)
}

Deno.serve(async (req) => {
  const sig = req.headers.get('stripe-signature') ?? ''
  const body = await req.text()

  let event: Stripe.Event
  try {
    event = await stripe.webhooks.constructEventAsync(
      body,
      sig,
      Deno.env.get('STRIPE_WEBHOOK_SECRET') ?? '',
    )
  } catch (err) {
    console.error('Webhook signature failed:', err)
    return new Response('Bad signature', { status: 400 })
  }

  try {
    switch (event.type) {
      case 'invoice.paid': {
        const invoice = event.data.object as Stripe.Invoice
        const sub = invoice.subscription
          ? await stripe.subscriptions.retrieve(invoice.subscription as string)
          : null
        const priceId = sub?.items?.data?.[0]?.price?.id
        if (invoice.customer && priceId) {
          await addCredits(invoice.customer as string, priceId, invoice.id)
        }
        break
      }
      case 'customer.subscription.deleted': {
        await handleSubscriptionDeleted(event.data.object as Stripe.Subscription)
        break
      }
    }
  } catch (err) {
    console.error('Handler error:', err)
    return new Response('Internal error', { status: 500 })
  }

  return new Response('ok', { status: 200 })
})
