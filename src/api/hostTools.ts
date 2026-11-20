import { supabase } from '@/integrations/supabase/client';

export type ClaimResult = { claimed: number; approved: number; pending: number };

/** Claim several mics at once. A mic nobody has verified yet is approved right away; others wait for an admin. */
export async function claimMicHosts(micIds: string[]): Promise<ClaimResult> {
  const { data, error } = await (supabase as any).rpc('claim_mic_hosts', { p_mic_ids: micIds });
  if (error) throw error;
  return data as ClaimResult;
}

export type MicFieldChanges = Partial<{
  day: string;
  start_time: string;
  latest_end_time: string;
  cost: string;
  stage_time: string;
  hosts_organizers: string;
  sign_up_instructions: string;
  location: string;
  venue_name: string;
  borough: string;
  neighborhood: string;
  other_rules: string;
}>;

/** Change the same fields on one or many of your mics. The database checks you host each one and logs the old values. */
export async function hostUpdateMics(micIds: string[], fields: MicFieldChanges): Promise<number> {
  const { data, error } = await (supabase as any).rpc('host_update_mics', { p_mic_ids: micIds, p_fields: fields });
  if (error) throw error;
  return data as number;
}
