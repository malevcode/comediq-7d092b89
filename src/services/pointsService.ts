/**
 * Comediq Points Service
 * 
 * Awards points for user actions. Uses Supabase for authenticated users
 * and localStorage as a buffer for logged-out users (synced on login).
 * 
 * Point values:
 * - Account creation: 100 (handled by DB trigger)
 * - Mic signup: 1
 * - Mic verification: 2 (handled by DB trigger)
 * - Claiming a mic: 7
 * - Updating a listing: 3 (max once per week)
 */

import { supabase } from '@/integrations/supabase/client';

const PENDING_POINTS_KEY = 'comediq-pending-points';
const LAST_UPDATE_KEY = 'comediq-last-listing-update';

export type PointAction =
  | 'mic_signup'
  | 'mic_claim'
  | 'listing_update'
  | 'mic_verification';

const POINT_VALUES: Record<PointAction, number> = {
  mic_signup: 1,
  mic_claim: 7,
  listing_update: 3,
  mic_verification: 2,
};

interface PendingPoint {
  action: PointAction;
  amount: number;
  reason: string;
  metadata?: Record<string, any>;
  timestamp: number;
}

// ── localStorage helpers ──

function getPendingPoints(): PendingPoint[] {
  try {
    return JSON.parse(localStorage.getItem(PENDING_POINTS_KEY) || '[]');
  } catch {
    return [];
  }
}

function savePendingPoints(points: PendingPoint[]) {
  localStorage.setItem(PENDING_POINTS_KEY, JSON.stringify(points));
}

function clearPendingPoints() {
  localStorage.removeItem(PENDING_POINTS_KEY);
}

// ── Rate limiting for listing updates ──

function canAwardListingUpdate(): boolean {
  const last = localStorage.getItem(LAST_UPDATE_KEY);
  if (!last) return true;
  const weekMs = 7 * 24 * 60 * 60 * 1000;
  return Date.now() - parseInt(last, 10) > weekMs;
}

function markListingUpdate() {
  localStorage.setItem(LAST_UPDATE_KEY, String(Date.now()));
}

// ── Core award function ──

export async function awardPoints(
  action: PointAction,
  reason: string,
  metadata?: Record<string, any>
): Promise<{ awarded: boolean; amount: number }> {
  const amount = POINT_VALUES[action];

  // Rate limit listing updates to once per week
  if (action === 'listing_update') {
    if (!canAwardListingUpdate()) {
      return { awarded: false, amount: 0 };
    }
    markListingUpdate();
  }

  // Check auth
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    // Buffer in localStorage for later sync
    const pending = getPendingPoints();
    pending.push({ action, amount, reason, metadata, timestamp: Date.now() });
    savePendingPoints(pending);
    return { awarded: true, amount };
  }

  // Award directly via Supabase
  try {
    await supabase.from('points_ledger').insert({
      user_id: user.id,
      amount,
      action_type: action,
      reason,
      metadata: metadata || {},
    });

    await supabase
      .from('profiles')
      .update({ points_balance: undefined as any }) // we'll use rpc below
      .eq('user_id', user.id);

    // Increment balance using a raw update
    const { data: profile } = await supabase
      .from('profiles')
      .select('points_balance')
      .eq('user_id', user.id)
      .single();

    if (profile) {
      await supabase
        .from('profiles')
        .update({ points_balance: (profile.points_balance || 0) + amount })
        .eq('user_id', user.id);
    }

    return { awarded: true, amount };
  } catch (err) {
    console.error('Failed to award points:', err);
    return { awarded: false, amount: 0 };
  }
}

// ── Sync pending localStorage points on login ──

export async function syncPendingPoints(userId: string): Promise<number> {
  const pending = getPendingPoints();
  if (pending.length === 0) return 0;

  let totalSynced = 0;

  for (const p of pending) {
    try {
      await supabase.from('points_ledger').insert({
        user_id: userId,
        amount: p.amount,
        action_type: p.action,
        reason: p.reason,
        metadata: p.metadata || {},
      });
      totalSynced += p.amount;
    } catch (err) {
      console.error('Failed to sync pending point:', err);
    }
  }

  if (totalSynced > 0) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('points_balance')
      .eq('user_id', userId)
      .single();

    if (profile) {
      await supabase
        .from('profiles')
        .update({ points_balance: (profile.points_balance || 0) + totalSynced })
        .eq('user_id', userId);
    }
  }

  clearPendingPoints();
  return totalSynced;
}

// ── Fetch points balance ──

export async function getPointsBalance(userId: string): Promise<number> {
  const { data } = await supabase
    .from('profiles')
    .select('points_balance')
    .eq('user_id', userId)
    .single();

  return data?.points_balance || 0;
}

// ── Fetch recent points history ──

export async function getPointsHistory(userId: string, limit = 20) {
  const { data } = await supabase
    .from('points_ledger')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit);

  return data || [];
}
