

## Plan: Fix Points System with RPC Transaction + Styled Toast + Sidebar Pulse

### Current State Analysis

**Database Infrastructure (Already Exists):**
- `profiles.points_balance` column exists (integer, default 0)
- `points_ledger` table exists with columns: `id`, `user_id` (FK to profiles.user_id), `amount`, `action_type`, `metadata`, `created_at`
- Triggers exist on `mic_verifications`: `on_verification_award_points` calls `handle_verification_points()`
- The trigger approach is causing the "internal error" - likely a race condition or constraint issue

**What's Missing:**
1. A single-transaction RPC to replace trigger-based points awarding
2. `reason` column in `points_ledger` (per user request for full schema migration)
3. Styled toast (Cream bg, Royal Blue text) centered at bottom
4. Points display + pulse animation in Hamburger sidebar

---

### Implementation Plan

#### 1. Database Migration
Create RPC `verify_mic_with_points(mic_identifier uuid, ip_hash_param text, status_param text)`:
- Check for duplicate verification (same IP + mic + today) → return early if exists
- Insert into `mic_verifications`
- Increment `profiles.points_balance` by 2 for authenticated users
- Insert into `points_ledger` with `reason` column
- All in one transaction (SECURITY DEFINER)
- Drop the existing `on_verification_award_points` trigger (prevents double-awarding)

Add `reason` column to `points_ledger` (nullable text, for readability alongside `action_type`).

#### 2. Update Edge Function (`verify-mic`)
Simplify to:
- Compute `ip_hash` from client IP
- Get `user_id` from auth header (if present)
- Call `supabase.rpc('verify_mic_with_points', { ... })` instead of direct inserts
- Return result to client

#### 3. Styled Toast Notification
Update `useMicVerification.ts`:
- On successful verification, call `toast()` with custom `className`:
  - Background: Cream (`bg-[#f5f0e6]`)
  - Text: Royal Blue (`text-[#1a5fb4]`)
  - Position: Bottom center (via viewport class override or inline styles)
- Message: "+2 Comediq Points!"

#### 4. Hamburger Sidebar Points Display + Pulse
Modify `HamburgerMenu.tsx`:
- Add points display in header area (Star icon + points count)
- Query `profiles.points_balance` when menu opens (or use a context/hook)
- Add CSS animation class `animate-pulse` when `justVerified` is true
- Pass verification state via a new context or custom event

---

### Technical Details

**New RPC signature:**
```sql
CREATE OR REPLACE FUNCTION verify_mic_with_points(
  mic_identifier uuid,
  ip_hash_param text,
  status_param text DEFAULT 'verified'
) RETURNS jsonb
```

**Points ledger migration:**
```sql
ALTER TABLE points_ledger ADD COLUMN reason text;
```

**Drop trigger (to prevent double points):**
```sql
DROP TRIGGER IF EXISTS on_verification_award_points ON mic_verifications;
```

**Files to modify:**
- Migration SQL (new RPC + column + drop trigger)
- `supabase/functions/verify-mic/index.ts` - call RPC instead of direct insert
- `src/hooks/useMicVerification.ts` - styled toast + emit verification event
- `src/components/HamburgerMenu.tsx` - display points + pulse animation
- `src/contexts/AuthContext.tsx` or new `PointsContext` - share points state across components

