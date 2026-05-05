import { supabase } from "@/integrations/supabase/client";

export interface BookingOpportunitySignupInput {
  opportunityId: string;
  opportunityTitle: string;
  userId?: string | null;
  signupMode: "account" | "manual";
  name?: string;
  phone?: string;
  yearsDoingStandup?: string;
  performsFivePlusWeekly?: boolean | null;
  bestCredit?: string;
  youtubeUrl?: string;
}

export async function submitBookingOpportunitySignup(input: BookingOpportunitySignupInput) {
  const payload = {
    opportunity_id: input.opportunityId,
    opportunity_title: input.opportunityTitle,
    user_id: input.userId ?? null,
    signup_mode: input.signupMode,
    name: input.name || null,
    phone: input.phone || null,
    years_doing_standup: input.yearsDoingStandup || null,
    performs_five_plus_weekly: input.performsFivePlusWeekly,
    best_credit: input.bestCredit || null,
    youtube_url: input.youtubeUrl || null,
    status: "submitted",
  };

  const { error } = await (supabase as any)
    .from("booking_opportunity_signups")
    .insert(payload);

  if (error) throw error;
}
