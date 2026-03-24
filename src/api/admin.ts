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
  // Let the database generate unique_identifier via gen_random_uuid() default

  // Convert form data to database format
  const insertData = {
    // unique_identifier omitted — DB generates UUID automatically
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
  const { data: insertedData, error: historicalError } = await supabase
    .from('open_mics_historical')
    .insert([insertData])
    .select('unique_identifier')
    .single();

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

  return { unique_identifier: insertedData?.unique_identifier };
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
