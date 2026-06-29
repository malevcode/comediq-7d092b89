import Stripe from 'npm:stripe@17.7.0'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2?target=deno'

const stripeSecretKey = Deno.env.get('STRIPE_SECRET_KEY') ?? ''
const webhookSecret = Deno.env.get('SNAPSHOT_STRIPE_WEBHOOK_SECRET') ?? ''
const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''

const stripe = new Stripe(stripeSecretKey, {
  apiVersion: '2024-06-20',
})

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
})

const fullPassPriceId = Deno.env.get('STRIPE_PRICE_PAID') ?? ''
const fullPassPlan = Deno.env.get('STRIPE_FULL_PASS_PLAN') ?? 'premium'

const isConfigured = () =>
  Boolean(stripeSecretKey && webhookSecret && supabaseUrl && serviceRoleKey && fullPassPriceId)

async function getPriceIdFromSubscription(subscriptionId: string) {
  const subscription = await stripe.subscriptions.retrieve(subscriptionId)
  return subscription.items.data[0]?.price?.id ?? null
}

async function getPriceIdFromCheckoutSession(session: Stripe.Checkout.Session) {
  if (typeof session.subscription === 'string') {
    return getPriceIdFromSubscription(session.subscription)
  }

  const lineItems = await stripe.checkout.sessions.listLineItems(session.id, {
    limit: 1,
    expand: ['data.price'],
  })

  return lineItems.data[0]?.price?.id ?? null
}

async function getCustomer(customerId: string | null | undefined) {
  if (!customerId) return null
  const customer = await stripe.customers.retrieve(customerId)
  return customer.deleted ? null : customer
}

async function findUserIdByEmail(email: string | null | undefined) {
  if (!email) return null

  const normalizedEmail = email.trim().toLowerCase()
  for (let page = 1; page <= 10; page += 1) {
    const { data, error } = await supabase.auth.admin.listUsers({
      page,
      perPage: 1000,
    })

    if (error) throw error

    const match = data.users.find((user) => user.email?.toLowerCase() === normalizedEmail)
    if (match) return match.id
    if (data.users.length < 1000) break
  }

  return null
}

async function resolveUserId(customerId?: string | null, fallbackEmail?: string | null) {
  const customer = await getCustomer(customerId)
  const metadataUserId = customer?.metadata?.supabase_user_id
  if (metadataUserId) return metadataUserId

  return findUserIdByEmail(customer?.email ?? fallbackEmail)
}

async function getSubscriptionUserId(subscriptionId: string | null) {
  if (!subscriptionId) return null
  const subscription = await stripe.subscriptions.retrieve(subscriptionId)
  return subscription.metadata?.supabase_user_id ?? null
}

async function updateCustomerUserMetadata(customerId: string | null, userId: string | null) {
  if (!customerId || !userId) return

  const customer = await getCustomer(customerId)
  if (!customer || customer.metadata?.supabase_user_id === userId) return

  await stripe.customers.update(customerId, {
    metadata: {
      ...customer.metadata,
      supabase_user_id: userId,
    },
  })
}

async function activateFullPass(userId: string, customerId: string | null, subscriptionId?: string | null) {
  const { error } = await supabase
    .from('profiles')
    .upsert(
      {
        user_id: userId,
        subscription_plan: fullPassPlan,
        ...(customerId ? { stripe_customer_id: customerId } : {}),
        ...(subscriptionId ? { stripe_subscription_id: subscriptionId } : {}),
      },
      { onConflict: 'user_id' },
    )

  if (error) throw error
}

async function deactivateFullPass(customerId: string | null | undefined, subscriptionId?: string | null) {
  const userId = await getSubscriptionUserId(subscriptionId ?? null) ?? await resolveUserId(customerId)
  if (!userId) {
    console.warn(`No Supabase user found for cancelled Stripe customer ${customerId}`)
    return
  }

  const { error } = await supabase
    .from('profiles')
    .update({
      subscription_plan: 'free',
      stripe_subscription_id: null,
    })
    .eq('user_id', userId)

  if (error) throw error
}

async function handleSubscriptionUpdated(subscription: Stripe.Subscription) {
  const priceId = subscription.items.data[0]?.price?.id ?? null
  if (priceId !== fullPassPriceId) {
    console.warn(`Ignoring subscription ${subscription.id} for unknown price ${priceId}`)
    return
  }

  const customerId = typeof subscription.customer === 'string' ? subscription.customer : null
  const userId = subscription.metadata?.supabase_user_id ?? await resolveUserId(customerId)
  if (!userId) {
    console.warn(`No Supabase user found for subscription ${subscription.id}`)
    return
  }

  if (subscription.cancel_at_period_end) {
    await deactivateFullPass(customerId, subscription.id)
    return
  }

  if (subscription.status === 'active' || subscription.status === 'trialing') {
    await updateCustomerUserMetadata(customerId, userId)
    await activateFullPass(userId, customerId, subscription.id)
    return
  }

  if (['canceled', 'unpaid', 'incomplete_expired'].includes(subscription.status)) {
    await deactivateFullPass(customerId, subscription.id)
  }
}

async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  const priceId = await getPriceIdFromCheckoutSession(session)
  if (priceId !== fullPassPriceId) {
    console.warn(`Ignoring checkout session ${session.id} for unknown price ${priceId}`)
    return
  }

  if (session.payment_status !== 'paid' && session.mode !== 'subscription') {
    console.warn(`Ignoring unpaid checkout session ${session.id}`)
    return
  }

  const customerId = typeof session.customer === 'string' ? session.customer : null
  const email = session.customer_details?.email ?? session.customer_email
  const subscriptionId = typeof session.subscription === 'string' ? session.subscription : null
  const userId = session.client_reference_id ?? await getSubscriptionUserId(subscriptionId) ?? await resolveUserId(customerId, email)
  if (!userId) {
    console.warn(`No Supabase user found for checkout session ${session.id}`)
    return
  }

  await updateCustomerUserMetadata(customerId, userId)
  await activateFullPass(userId, customerId, subscriptionId)
}

async function handleInvoicePaid(invoice: Stripe.Invoice) {
  const subscriptionId = typeof invoice.subscription === 'string' ? invoice.subscription : null
  const priceId = subscriptionId ? await getPriceIdFromSubscription(subscriptionId) : null
  if (priceId !== fullPassPriceId) {
    console.warn(`Ignoring invoice ${invoice.id} for unknown price ${priceId}`)
    return
  }

  const customerId = typeof invoice.customer === 'string' ? invoice.customer : null
  const userId = await getSubscriptionUserId(subscriptionId) ?? await resolveUserId(customerId, invoice.customer_email)
  if (!userId) {
    console.warn(`No Supabase user found for invoice ${invoice.id}`)
    return
  }

  await updateCustomerUserMetadata(customerId, userId)
  await activateFullPass(userId, customerId, subscriptionId)
}

Deno.serve(async (req) => {
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 })
  }

  if (!isConfigured()) {
    console.error('Stripe webhook is missing required environment variables')
    return new Response('Webhook not configured', { status: 500 })
  }

  const sig = req.headers.get('stripe-signature') ?? ''
  const body = await req.text()

  let event: Stripe.Event
  try {
    event = await stripe.webhooks.constructEventAsync(body, sig, webhookSecret)
  } catch (err) {
    console.error('Webhook signature failed:', err)
    return new Response('Bad signature', { status: 400 })
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed':
        await handleCheckoutCompleted(event.data.object as Stripe.Checkout.Session)
        break
      case 'invoice.paid':
        await handleInvoicePaid(event.data.object as Stripe.Invoice)
        break
      case 'customer.subscription.created':
      case 'customer.subscription.updated':
        await handleSubscriptionUpdated(event.data.object as Stripe.Subscription)
        break
      case 'customer.subscription.deleted':
        {
          const subscription = event.data.object as Stripe.Subscription
          await deactivateFullPass(subscription.customer as string, subscription.id)
        }
        break
      default:
        break
    }
  } catch (err) {
    console.error('Handler error:', err)
    return new Response('Internal error', { status: 500 })
  }

  return new Response('ok', { status: 200 })
})
