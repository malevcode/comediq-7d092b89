/**
 * Open Mics API
 * Handles all open mic related backend operations
 */

import { supabase } from '@/integrations/supabase/client';

// Using the display format that components expect (with spaces and title case)
export interface OpenMicDisplay {
  'Open Mic': string;
  'Day': string;
  'Start Time': string;
  'Latest End Time': string;
  'Venue Name': string;
  'Borough': string;
  'Neighborhood': string;
  'Location': string;
  'Venue type': string;
  'Cost': string;
  'Stage time': string;
  'Sign-Up Instructions': string;
  'Host(s) / Organizer': string;
  'Changes/updates': string;
  'Last verified': string;
  'Other Rules': string;
  'unique_identifier': string;
  'active': boolean;
}

export interface FetchOpenMicsOptions {
  tableName?: 'open_mics_historical';
  activeOnly?: boolean;
}

/**
 * Fetches open mics from the database
 */
export async function fetchOpenMics(options: FetchOpenMicsOptions = {}) {
  const { tableName = 'open_mics_historical', activeOnly = true } = options;

  const { data, error } = await supabase
    .from(tableName)
    .select('*');

  if (error) {
    throw error;
  }

  if (!data) {
    return [];
  }

  // Filter and transform data
  let mics = data.filter((mic: any) => !activeOnly || mic.active);

  // Map to display format
  return mics.map((mic: any) => ({
    'Open Mic': mic.open_mic || '',
    'Day': mic.day || '',
    'Start Time': mic.start_time || '',
    'Latest End Time': mic.latest_end_time || '',
    'Venue Name': mic.venue_name || '',
    'Borough': mic.borough || '',
    'Neighborhood': mic.neighborhood || '',
    'Location': mic.location || '',
    'Venue type': mic.venue_type || '',
    'Cost': mic.cost || '',
    'Stage time': mic.stage_time || '',
    'Sign-Up Instructions': mic.sign_up_instructions || '',
    'Host(s) / Organizer': mic.hosts_organizers || '',
    'Changes/updates': mic.changes_updates || '',
    'Last verified': mic.last_verified || '',
    'Other Rules': mic.other_rules || '',
    'unique_identifier': mic.unique_identifier || '',
    'active': mic.active ?? true,
  } as OpenMicDisplay));
}

/**
 * Fetches all mics including inactive ones
 */
export async function fetchAllMics() {
  const { data, error } = await supabase
    .from('open_mics_historical')
    .select('*');

  if (error) {
    throw error;
  }

  return data || [];
}

/**
 * Updates a mic in the database
 */
export async function updateMic(uniqueId: string, updates: Partial<OpenMicDisplay>) {
  // Convert display format to database format
  const dbUpdates: any = {};
  
  if (updates['Open Mic'] !== undefined) dbUpdates.open_mic = updates['Open Mic'];
  if (updates['Day'] !== undefined) dbUpdates.day = updates['Day'];
  if (updates['Start Time'] !== undefined) dbUpdates.start_time = updates['Start Time'];
  if (updates['Latest End Time'] !== undefined) dbUpdates.latest_end_time = updates['Latest End Time'];
  if (updates['Venue Name'] !== undefined) dbUpdates.venue_name = updates['Venue Name'];
  if (updates['Borough'] !== undefined) dbUpdates.borough = updates['Borough'];
  if (updates['Neighborhood'] !== undefined) dbUpdates.neighborhood = updates['Neighborhood'];
  if (updates['Location'] !== undefined) dbUpdates.location = updates['Location'];
  if (updates['Venue type'] !== undefined) dbUpdates.venue_type = updates['Venue type'];
  if (updates['Cost'] !== undefined) dbUpdates.cost = updates['Cost'];
  if (updates['Stage time'] !== undefined) dbUpdates.stage_time = updates['Stage time'];
  if (updates['Sign-Up Instructions'] !== undefined) dbUpdates.sign_up_instructions = updates['Sign-Up Instructions'];
  if (updates['Host(s) / Organizer'] !== undefined) dbUpdates.hosts_organizers = updates['Host(s) / Organizer'];
  if (updates['Changes/updates'] !== undefined) dbUpdates.changes_updates = updates['Changes/updates'];
  if (updates['Last verified'] !== undefined) dbUpdates.last_verified = updates['Last verified'];
  if (updates['Other Rules'] !== undefined) dbUpdates.other_rules = updates['Other Rules'];
  if (updates['active'] !== undefined) dbUpdates.active = updates['active'];

  const { data, error } = await supabase
    .from('open_mics_historical')
    .update(dbUpdates)
    .eq('unique_identifier', uniqueId)
    .select()
    .single();

  if (error) {
    throw error;
  }

  return data;
}
