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
 * Applies an edit suggestion to an existing mic in open_mics_historical,
 * then marks the request as reviewed/approved.
 * targetMicId is stored in host_phone on the request row.
 */
export async function applyMicEdit(requestId: string, targetMicId: string, formData: MicFormData) {
  const updateData: Record<string, any> = {};

  if (formData['Open Mic']) updateData.open_mic = formData['Open Mic'];
  if (formData['Day']) updateData.day = formData['Day'];
  if (formData['Start Time']) updateData.start_time = formData['Start Time'];
  if (formData['Latest End Time']) updateData.latest_end_time = formData['Latest End Time'];
  if (formData['Venue Name']) updateData.venue_name = formData['Venue Name'];
  if (formData['Borough']) updateData.borough = formData['Borough'];
  if (formData['Neighborhood'] !== undefined) updateData.neighborhood = formData['Neighborhood'] || null;
  if (formData['Location'] !== undefined) updateData.location = formData['Location'] || null;
  if (formData['Venue type'] !== undefined) updateData.venue_type = formData['Venue type'] || null;
  if (formData['Cost'] !== undefined) updateData.cost = formData['Cost'] || null;
  if (formData['Stage time'] !== undefined) updateData.stage_time = formData['Stage time'] || null;
  if (formData['Sign-Up Instructions'] !== undefined) updateData.sign_up_instructions = formData['Sign-Up Instructions'] || null;
  if (formData['Host(s) / Organizer'] !== undefined) updateData.hosts_organizers = formData['Host(s) / Organizer'] || null;
  if (formData['Changes/updates'] !== undefined) updateData.changes_updates = formData['Changes/updates'] || null;
  if (formData['Other Rules'] !== undefined) updateData.other_rules = formData['Other Rules'] || null;
  if (formData['Last verified']) updateData.last_verified = formData['Last verified'];
  if (formData['frequency']) updateData.frequency = formData['frequency'];
  if (formData['frequency_custom_text'] !== undefined) updateData.frequency_custom_text = formData['frequency_custom_text'] || null;
  if (formData['signup_method']) updateData.signup_method = formData['signup_method'];
  if (formData['signup_url'] !== undefined) updateData.signup_url = formData['signup_url'] || null;

  const { error: updateMicError } = await supabase
    .from('open_mics_historical')
    .update(updateData)
    .eq('unique_identifier', targetMicId);

  if (updateMicError) throw updateMicError;

  const { error: markReviewedError } = await supabase
    .from('open_mics_requests')
    .update({ reviewed: true, status: 'approved' })
    .eq('unique_identifier', requestId);

  if (markReviewedError) throw markReviewedError;
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
