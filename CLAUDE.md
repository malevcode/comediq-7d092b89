# Comediq

React 18 + TypeScript + Vite app for open mic discovery and signup. Uses Supabase (PostgreSQL) for auth, database, and edge functions.

## Comedian Subscription (Mic Fee Waiver)

A $20/month Stripe subscription that waives the door fee at participating fee-based mics.

### How it works

1. **Stripe Payment Link** — Comedian clicks a Stripe-hosted checkout link (`VITE_STRIPE_SUBSCRIBER_LINK` env var) to subscribe.
2. **Webhook** — Supabase Edge Function at `supabase/functions/stripe-webhook/index.ts` listens for `invoice.paid` and `customer.subscription.deleted` events.
   - On payment: sets `profiles.subscription_plan = 'subscriber'` and stores `stripe_subscription_id`.
   - On cancellation: resets to `'free'` and clears `stripe_subscription_id`.
3. **Frontend** — `AuthContext` fetches `subscription_plan` from the profiles table and exposes `isSubscriber: boolean`.
4. **Door check** — Fee is collected cash/Venmo at the door. The host/door person checks the signup list (ManageSignups or RunOfShow) where a gold "Subscriber" badge appears next to the comedian's name. The comedian can also show their profile page which displays subscriber status.

### Key files

- `supabase/functions/stripe-webhook/index.ts` — Stripe webhook handler
- `src/contexts/AuthContext.tsx` — Auth + subscription state
- `src/components/SubscriberBadge.tsx` — Reusable subscriber badge
- `src/components/CreditBalance.tsx` — Subscription status display (profile page)
- `src/components/host/ManageSignups.tsx` — Host signup list with subscriber badges
- `src/components/host/RunOfShow.tsx` — Host lineup view with subscriber badges + CSV export
- `src/components/signup/SignupList.tsx` — Public signup list with subscriber badges

### Environment variables

Frontend (in `.env`):
- `VITE_STRIPE_SUBSCRIBER_LINK` — Stripe Payment Link URL for the subscription

Edge Function secrets (set via `supabase secrets set`):
- `STRIPE_SECRET_KEY` — Stripe secret key
- `STRIPE_WEBHOOK_SECRET` — Webhook signing secret
- `STRIPE_PRICE_SUBSCRIBER` — Stripe Price ID for the $20/mo subscription

### Database

The `profiles` table has:
- `subscription_plan` — `'free'` or `'subscriber'`
- `stripe_customer_id` — Stripe customer ID (set by webhook)
- `stripe_subscription_id` — Stripe subscription ID (set/cleared by webhook)

The old credit system (credits_balance, credit_transactions table, spend_credit/admin_add_credits RPCs) has been removed.

## Mic Signup System

Comedians sign up for open mic spots through the app. Hosts manage signups via the Host Dashboard.

- `mic_signup_events` — Individual signup events for a mic on a date
- `mic_signups` — Individual comedian registrations (authenticated or guest)
- Signup modes: first_come, lottery, bucket
- Points awarded for signups (gamification, separate from subscription)
