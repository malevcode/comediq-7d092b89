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

const PLAN_CREDITS: Record<string, { plan: string; credits: number }> = {
  [process.env.STRIPE_PRICE_STANDARD ?? 'price_standard']: { plan: 'standard', credits: 5 },
  [process.env.STRIPE_PRICE_PREMIUM ?? 'price_premium']: { plan: 'premium', credits: 15 },
};

async function addCredits(customerId: string, priceId: string, invoiceId: string) {
  const customer = (await stripe.customers.retrieve(customerId)) as Stripe.Customer;
  const userId = customer.metadata?.supabase_user_id;
  if (!userId) {
    console.error(`No supabase_user_id on customer ${customerId}`);
    return;
  }

  const config = PLAN_CREDITS[priceId];
  if (!config) {
    console.warn(`Unknown price ${priceId}`);
    return;
  }

  const { data: existing } = await supabase
    .from('credit_transactions')
    .select('id')
    .eq('reference_id', invoiceId)
    .single();

  if (existing) return;

  await supabase.rpc('admin_add_credits', {
    p_user_id: userId,
    p_delta: config.credits,
    p_reason: 'subscription_renewal',
    p_reference: invoiceId,
    p_plan: config.plan,
  });
}

async function handleSubscriptionDeleted(sub: Stripe.Subscription) {
  const customer = (await stripe.customers.retrieve(sub.customer as string)) as Stripe.Customer;
  const userId = customer.metadata?.supabase_user_id;
  if (!userId) return;

  await supabase
    .from('profiles')
    .update({ subscription_plan: 'free' })
    .eq('user_id', userId);
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
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET ?? '');
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
          await addCredits(invoice.customer as string, priceId, invoice.id);
        }
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
