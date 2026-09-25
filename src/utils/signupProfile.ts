import { supabase } from "@/integrations/supabase/client";

/**
 * What the signup form collects before the account exists.
 *
 * The answers are gathered in one screen, but they cannot be written until the
 * emailed code is verified and there is a user id to hang them on. So they are
 * held here in between.
 */
export interface PendingSignupProfile {
  name: string;
  instagram: string;
  yearsPerforming: number;
  weeklyMicSpendUsd: number;
}

const STORAGE_KEY = "comediq-pending-signup-profile";

/** Survives a reload of the verify step, which is the same tab, same session. */
export function stashPendingSignupProfile(profile: PendingSignupProfile) {
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(profile));
  } catch {
    /* private mode: the in-memory copy still covers the normal path */
  }
}

export function readPendingSignupProfile(): PendingSignupProfile | null {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as PendingSignupProfile) : null;
  } catch {
    return null;
  }
}

export function clearPendingSignupProfile() {
  try {
    sessionStorage.removeItem(STORAGE_KEY);
  } catch {
    /* nothing to clear */
  }
}

/** "@Adam_Malev " and "instagram.com/adam_malev" both become "adam_malev". */
export function normalizeInstagramHandle(raw: string): string {
  return raw
    .trim()
    .replace(/^https?:\/\/(www\.)?instagram\.com\//i, "")
    .replace(/^@/, "")
    .replace(/\/+$/, "")
    .split(/[?#]/)[0]
    .toLowerCase();
}

/**
 * Writes the signup answers once the account exists.
 *
 * Nothing here is allowed to block the person from getting into the app, so a
 * failure is reported back rather than thrown. They are already signed in by
 * the time this runs, and every field is editable on the profile page.
 */
export async function saveSignupProfile(
  userId: string,
  profile: PendingSignupProfile,
): Promise<{ ok: boolean; message?: string }> {
  const name = profile.name.trim();
  const handle = normalizeInstagramHandle(profile.instagram);

  // Upsert, not update. AuthContext creates the profile row in its own effect,
  // which may not have run yet this soon after verification. An update against
  // a row that does not exist matches nothing and reports no error, so the
  // answers would vanish, and the social link below would then fail its foreign
  // key into profiles.
  const { error: profileError } = await supabase
    .from("profiles")
    .upsert(
      {
        user_id: userId,
        ...(name ? { stage_name: name } : {}),
        is_comedian: true,
        years_performing: profile.yearsPerforming,
        weekly_mic_spend_usd: profile.weeklyMicSpendUsd,
      },
      { onConflict: "user_id" },
    );

  if (profileError) {
    return { ok: false, message: profileError.message };
  }

  if (!handle) return { ok: true };

  // Instagram lives with the other socials, not as a column of its own.
  const { error: socialError } = await supabase
    .from("comedian_social_links")
    .upsert(
      {
        user_id: userId,
        platform: "instagram",
        handle,
        url: `https://instagram.com/${handle}`,
        is_primary: true,
      },
      { onConflict: "user_id,platform" },
    );

  if (socialError) {
    return { ok: false, message: socialError.message };
  }

  return { ok: true };
}
