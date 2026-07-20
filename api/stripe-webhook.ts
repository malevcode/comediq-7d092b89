import type { VercelRequest, VercelResponse } from '@vercel/node';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY ?? '', {
  apiVersion: '2024-06-20' as any,
});

const supabase = createClient(
  process.env.SUPABASE_URL ?? process.env.VITE_SUPABASE_URL ?? '',
  process.env.SUPABASE_SERVICE_ROLE_KEY ?? '',
);

const FULL_PASS_PRICE_ID = process.env.STRIPE_PRICE_PAID ?? '';
const FULL_PASS_PLAN = 'premium';

async function activateFullPass(customerId: string, priceId: string, subscriptionId?: string | null) {
  const customer = (await stripe.customers.retrieve(customerId)) as Stripe.Customer;
  const userId = customer.metadata?.supabase_user_id;
  if (!userId) {
    console.error(`No supabase_user_id on customer ${customerId}`);
    return;
  }

  if (priceId !== FULL_PASS_PRICE_ID) {
    console.warn(`Unknown price ${priceId}`);
    return;
  }

  await supabase
    .from('profiles')
    .upsert(
      {
        user_id: userId,
        subscription_plan: FULL_PASS_PLAN,
        stripe_customer_id: customerId,
        ...(subscriptionId ? { stripe_subscription_id: subscriptionId } : {}),
      },
      { onConflict: 'user_id' },
    );
}

async function handleSubscriptionDeleted(sub: Stripe.Subscription) {
  const customer = (await stripe.customers.retrieve(sub.customer as string)) as Stripe.Customer;
  const userId = customer.metadata?.supabase_user_id;
  if (!userId) return;

  await supabase
    .from('profiles')
    .update({
      subscription_plan: 'free',
      stripe_subscription_id: null,
    })
    .eq('user_id', userId);
}

async function handleSubscriptionUpdated(sub: Stripe.Subscription) {
  const priceId = sub.items.data[0]?.price?.id;
  const customerId = sub.customer as string;
  if (!priceId) return;

  if (sub.status === 'active' || sub.status === 'trialing') {
    await activateFullPass(customerId, priceId, sub.id);
    return;
  }

  if (['canceled', 'unpaid', 'incomplete_expired'].includes(sub.status)) {
    await handleSubscriptionDeleted(sub);
  }
}

export const config = { api: { bodyParser: false } };

async function buffer(req: VercelRequest): Promise<Buffer> {
  const chunks: Buffer[] = [];
  for await (const chunk of req) chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk);
  return Buffer.concat(chunks);
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).end('Method not allowed');

  const sig = req.headers['stripe-signature'] as string;
  const body = await buffer(req);

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.SNAPSHOT_STRIPE_WEBHOOK_SECRET ?? '');
  } catch (err: any) {
    console.error('Webhook signature failed:', err.message);
    return res.status(400).json({ error: 'Bad signature' });
  }

  try {
    switch (event.type) {
      case 'invoice.paid': {
        const invoice = event.data.object as Stripe.Invoice;
        const sub = invoice.subscription
          ? await stripe.subscriptions.retrieve(invoice.subscription as string)
          : null;
        const priceId = sub?.items?.data?.[0]?.price?.id;
        if (invoice.customer && priceId) {
          await activateFullPass(invoice.customer as string, priceId, invoice.subscription as string | null);
        }
        break;
      }
      case 'customer.subscription.created':
      case 'customer.subscription.updated': {
        await handleSubscriptionUpdated(event.data.object as Stripe.Subscription);
        break;
      }
      case 'customer.subscription.deleted': {
        await handleSubscriptionDeleted(event.data.object as Stripe.Subscription);
        break;
      }
    }
  } catch (err) {
    console.error('Handler error:', err);
    return res.status(500).json({ error: 'Internal error' });
  }

  return res.status(200).json({ received: true });
}
