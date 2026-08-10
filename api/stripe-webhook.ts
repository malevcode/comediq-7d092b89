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

async function findUserIdByEmail(email?: string | null) {
  if (!email) return null;

  const normalizedEmail = email.trim().toLowerCase();
  for (let page = 1; page <= 10; page += 1) {
    const { data, error } = await supabase.auth.admin.listUsers({
      page,
      perPage: 1000,
    });

    if (error) throw error;

    const match = data.users.find((user) => user.email?.toLowerCase() === normalizedEmail);
    if (match) return match.id;
    if (data.users.length < 1000) break;
  }

  return null;
}

async function getCustomer(customerId?: string | null) {
  if (!customerId) return null;
  const customer = await stripe.customers.retrieve(customerId);
  return customer.deleted ? null : customer;
}

async function resolveUserId(customerId?: string | null, fallbackEmail?: string | null) {
  const customer = await getCustomer(customerId);
  if (customer?.metadata?.supabase_user_id) return customer.metadata.supabase_user_id;
  return findUserIdByEmail(customer?.email ?? fallbackEmail);
}

async function getSubscriptionUserId(subscriptionId?: string | null) {
  if (!subscriptionId) return null;
  const subscription = await stripe.subscriptions.retrieve(subscriptionId);
  return subscription.metadata?.supabase_user_id ?? null;
}

async function updateCustomerUserMetadata(customerId: string | null, userId: string | null) {
  if (!customerId || !userId) return;

  const customer = await getCustomer(customerId);
  if (!customer || customer.metadata?.supabase_user_id === userId) return;

  await stripe.customers.update(customerId, {
    metadata: {
      ...customer.metadata,
      supabase_user_id: userId,
    },
  });
}

async function activateFullPass(userId: string, customerId: string | null, priceId: string, subscriptionId?: string | null) {
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
        ...(customerId ? { stripe_customer_id: customerId } : {}),
        ...(subscriptionId ? { stripe_subscription_id: subscriptionId } : {}),
      },
      { onConflict: 'user_id' },
    );
}

async function handleSubscriptionDeleted(sub: Stripe.Subscription) {
  const customerId = typeof sub.customer === 'string' ? sub.customer : null;
  const userId = sub.metadata?.supabase_user_id ?? await resolveUserId(customerId);
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
  const customerId = typeof sub.customer === 'string' ? sub.customer : null;
  if (!priceId) return;

  const userId = sub.metadata?.supabase_user_id ?? await resolveUserId(customerId);
  if (!userId) {
    console.warn(`No Supabase user found for subscription ${sub.id}`);
    return;
  }

  if (sub.cancel_at_period_end) {
    await handleSubscriptionDeleted(sub);
    return;
  }

  if (sub.status === 'active' || sub.status === 'trialing') {
    await updateCustomerUserMetadata(customerId, userId);
    await activateFullPass(userId, customerId, priceId, sub.id);
    return;
  }

  if (['canceled', 'unpaid', 'incomplete_expired'].includes(sub.status)) {
    await handleSubscriptionDeleted(sub);
  }
}

async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  const customerId = typeof session.customer === 'string' ? session.customer : null;
  const subscriptionId = typeof session.subscription === 'string' ? session.subscription : null;
  const email = session.customer_details?.email ?? session.customer_email;
  const userId = session.client_reference_id ?? await getSubscriptionUserId(subscriptionId) ?? await resolveUserId(customerId, email);

  if (!userId) {
    console.warn(`No Supabase user found for checkout session ${session.id}`);
    return;
  }

  const sub = subscriptionId ? await stripe.subscriptions.retrieve(subscriptionId) : null;
  const priceId = sub?.items.data[0]?.price?.id;

  if (!priceId) {
    console.warn(`No price found for checkout session ${session.id}`);
    return;
  }

  await updateCustomerUserMetadata(customerId, userId);
  await activateFullPass(userId, customerId, priceId, subscriptionId);
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
      case 'checkout.session.completed': {
        await handleCheckoutCompleted(event.data.object as Stripe.Checkout.Session);
        break;
      }
      case 'invoice.paid': {
        const invoice = event.data.object as Stripe.Invoice;
        const subscriptionId = typeof invoice.subscription === 'string' ? invoice.subscription : null;
        const sub = subscriptionId ? await stripe.subscriptions.retrieve(subscriptionId) : null;
        const priceId = sub?.items?.data?.[0]?.price?.id;
        const customerId = typeof invoice.customer === 'string' ? invoice.customer : null;
        const userId = await getSubscriptionUserId(subscriptionId) ?? await resolveUserId(customerId, invoice.customer_email);
        if (userId && priceId) {
          await updateCustomerUserMetadata(customerId, userId);
          await activateFullPass(userId, customerId, priceId, subscriptionId);
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
