import { supabase } from "@/integrations/supabase/client";

/**
 * The answers asked once, on the first signed-in load, whichever way they
 * signed in. Google and the emailed code both land here.
 */
export interface SignupAnswers {
  name: string;
  isComedian: boolean;
  /** Comedian only. An audience member is never asked for these. */
  instagram?: string;
  yearsPerforming?: number;
  weeklyMicSpendUsd?: number;
  affiliateInterested?: boolean;
  /** Audience only. */
  showsSeenPerYear?: number;
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
  profile: SignupAnswers,
): Promise<{ ok: boolean; message?: string }> {
  const name = profile.name.trim();

  // Each path writes only what it asked. The other side's columns stay NULL,
  // which reads as "never asked" rather than a zero someone actually gave.
  const answers = profile.isComedian
    ? {
        is_comedian: true,
        years_performing: profile.yearsPerforming ?? 0,
        weekly_mic_spend_usd: profile.weeklyMicSpendUsd ?? 0,
        affiliate_interested: profile.affiliateInterested ?? false,
      }
    : {
        is_comedian: false,
        shows_seen_per_year: profile.showsSeenPerYear ?? 0,
      };

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
        ...answers,
      },
      { onConflict: "user_id" },
    );

  if (profileError) {
    return { ok: false, message: profileError.message };
  }

  // Instagram is only asked of comedians, because reaching them is the point.
  if (!profile.isComedian) return { ok: true };

  const handle = normalizeInstagramHandle(profile.instagram ?? "");
  if (!handle) return { ok: true };

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
