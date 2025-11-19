/**
 * Admin API
 * Handles all admin-related backend operations
 */

import { supabase } from '@/integrations/supabase/client';

export interface MicRequest {
  unique_identifier: string;
  show_title?: string;
  venue_name?: string;
  borough?: string;
  day?: string;
  time?: string;
  date?: string;
  created_at?: string;
  user_id?: string;
  reviewed?: boolean;
  review_status?: 'approved' | 'disapproved';
  [key: string]: any;
}

export interface MicFormData {
  'Open Mic': string;
  'Day': string;
  'Start Time': string;
  'Latest End Time'?: string;
  'Venue Name': string;
  'Borough': string;
  'Neighborhood'?: string;
  'Location'?: string;
  'Venue type'?: string;
  'Cost'?: string;
  'Stage time'?: string;
  'Sign-Up Instructions'?: string;
  'Host(s) / Organizer'?: string;
  'Changes/updates': string;
  'Last verified'?: string;
  'Other Rules'?: string;
  [key: string]: any;
}

/**
 * Fetches all mic requests
 */
export async function fetchMicRequests() {
  const { data, error } = await supabase
    .from('open_mics_requests')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    throw error;
  }

  return data as MicRequest[];
}

/**
 * Approves a mic request and adds it to the historical table
 */
export async function approveMicRequest(requestId: string, formData: MicFormData) {
  // Generate unique_identifier
  const day = formData['Day']?.trim() || '';
  const startTime = formData['Start Time']?.trim() || '';
  const changes = formData['Changes/updates']?.trim().replace(/\s+/g, '') || '';
  const venue = formData['Venue Name']?.trim() || '';
  const unique_identifier = `${day}_${startTime}_${changes}_${venue}`;

  // Convert form data to database format
  const insertData = {
    unique_identifier,
    active: true,
    open_mic: formData['Open Mic'] || '',
    day: formData['Day'] || '',
    start_time: formData['Start Time'] || '',
    latest_end_time: formData['Latest End Time'] || null,
    venue_name: formData['Venue Name'] || '',
    borough: formData['Borough'] || '',
    neighborhood: formData['Neighborhood'] || null,
    location: formData['Location'] || null,
    venue_type: formData['Venue type'] || null,
    cost: formData['Cost'] || null,
    stage_time: formData['Stage time'] || null,
    sign_up_instructions: formData['Sign-Up Instructions'] || null,
    hosts_organizers: formData['Host(s) / Organizer'] || null,
    changes_updates: formData['Changes/updates'] || '',
    last_verified: formData['Last verified'] || null,
    other_rules: formData['Other Rules'] || null,
  };

  // Insert into historical table
  const { error: historicalError } = await supabase
    .from('open_mics_historical')
    .upsert([insertData], { onConflict: 'unique_identifier' });

  if (historicalError) {
    throw historicalError;
  }

  // Mark request as approved
  const { error: updateError } = await supabase
    .from('open_mics_requests')
    .update({ reviewed: true, status: 'approved' })
    .eq('unique_identifier', requestId);

  if (updateError) {
    throw updateError;
  }

  return { unique_identifier };
}

/**
 * Disapproves a mic request
 */
export async function disapproveMicRequest(requestId: string) {
  const { error } = await supabase
    .from('open_mics_requests')
    .update({ reviewed: true, status: 'disapproved' })
    .eq('unique_identifier', requestId);

  if (error) {
    throw error;
  }
}
