/**
 * Open Mics API
 * Handles all open mic related backend operations
 */

import { supabase } from '@/integrations/supabase/client';

const OPEN_MIC_DISPLAY_COLUMNS = [
  'open_mic',
  'day',
  'start_time',
  'latest_end_time',
  'venue_name',
  'borough',
  'neighborhood',
  'location',
  'venue_type',
  'cost',
  'stage_time',
  'sign_up_instructions',
  'hosts_organizers',
  'changes_updates',
  'last_verified',
  'other_rules',
  'unique_identifier',
  'active',
  'signup_enabled',
].join(',');

type OpenMicDisplayRow = {
  open_mic: string | null;
  day: string | null;
  start_time: string | null;
  latest_end_time: string | null;
  venue_name: string | null;
  borough: string | null;
  neighborhood: string | null;
  location: string | null;
  venue_type: string | null;
  cost: string | null;
  stage_time: string | null;
  sign_up_instructions: string | null;
  hosts_organizers: string | null;
  changes_updates: string | null;
  last_verified: string | null;
  other_rules: string | null;
  unique_identifier: string | null;
  active: boolean | null;
  signup_enabled: boolean | null;
};

type OpenMicDbUpdates = Partial<{
  open_mic: string;
  day: string;
  start_time: string;
  latest_end_time: string;
  venue_name: string;
  borough: string;
  neighborhood: string;
  location: string;
  venue_type: string;
  cost: string;
  stage_time: string;
  sign_up_instructions: string;
  hosts_organizers: string;
  changes_updates: string;
  last_verified: string;
  other_rules: string;
  active: boolean;
  signup_enabled: boolean;
}>;

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
  'signup_enabled': boolean;
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

  let query = supabase
    .from(tableName)
<<<<<<< HEAD
    .select('unique_identifier,open_mic,day,start_time,latest_end_time,venue_name,borough,neighborhood,location,venue_type,cost,stage_time,sign_up_instructions,hosts_organizers,changes_updates,last_verified,other_rules,active,signup_enabled');
=======
    .select(OPEN_MIC_DISPLAY_COLUMNS);

  if (activeOnly) {
    query = query.eq('active', true);
  }

  const { data, error } = await query;
>>>>>>> b5b5cbd (Add Mapbox open mic map updates)

  if (error) {
    throw error;
  }

  if (!data) {
    return [];
  }

  // Map to display format
  return (data as OpenMicDisplayRow[]).map((mic) => ({
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
    'signup_enabled': mic.signup_enabled ?? false,
  } as OpenMicDisplay));
}

/**
 * Fetches all mics including inactive ones
 */
export async function fetchAllMics() {
  const { data, error } = await supabase
    .from('open_mics_historical')
    .select('unique_identifier,open_mic,day,start_time,latest_end_time,venue_name,borough,neighborhood,location,venue_type,cost,stage_time,sign_up_instructions,hosts_organizers,changes_updates,last_verified,other_rules,active,signup_enabled');

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
  const dbUpdates: OpenMicDbUpdates = {};
  
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
  if (updates['signup_enabled'] !== undefined) dbUpdates.signup_enabled = updates['signup_enabled'];

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
