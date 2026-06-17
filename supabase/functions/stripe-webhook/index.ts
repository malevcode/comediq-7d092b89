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

const SUBSCRIBER_PRICE_ID = Deno.env.get('STRIPE_PRICE_SUBSCRIBER') ?? ''

async function resolveUserId(customerId: string): Promise<string | null> {
  const customer = await stripe.customers.retrieve(customerId) as Stripe.Customer
  return customer.metadata?.supabase_user_id ?? null
}

async function activateSubscription(customerId: string, subscriptionId: string) {
  const userId = await resolveUserId(customerId)
  if (!userId) {
    console.error(`No supabase_user_id on customer ${customerId}`)
    return
  }

  await supabase
    .from('profiles')
    .update({
      subscription_plan: 'subscriber',
      stripe_customer_id: customerId,
      stripe_subscription_id: subscriptionId,
    })
    .eq('user_id', userId)
}

async function deactivateSubscription(sub: Stripe.Subscription) {
  const userId = await resolveUserId(sub.customer as string)
  if (!userId) return

  await supabase
    .from('profiles')
    .update({
      subscription_plan: 'free',
      stripe_subscription_id: null,
    })
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
        if (priceId === SUBSCRIBER_PRICE_ID && invoice.customer && sub) {
          await activateSubscription(invoice.customer as string, sub.id)
        }
        break
      }
      case 'customer.subscription.deleted': {
        await deactivateSubscription(event.data.object as Stripe.Subscription)
        break
      }
    }
  } catch (err) {
    console.error('Handler error:', err)
    return new Response('Internal error', { status: 500 })
  }

  return new Response('ok', { status: 200 })
})
