import { pb } from '@/integrations/pocketbase/client';
import type { OpenMicDisplay, FetchOpenMicsOptions } from '../openMics';

export type { OpenMicDisplay, FetchOpenMicsOptions };

function toDisplay(mic: any): OpenMicDisplay {
  return {
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
  };
}

export async function fetchOpenMics(options: FetchOpenMicsOptions = {}): Promise<OpenMicDisplay[]> {
  const { activeOnly = true } = options;
  const filter = activeOnly ? 'active = true' : '';

  const data = await pb.collection('open_mics_historical').getFullList({
    filter,
    sort: '+day,+start_time',
  });

  return data.map(toDisplay);
}

export async function fetchAllMics() {
  return pb.collection('open_mics_historical').getFullList({ sort: '+day' });
}

export async function updateMic(uniqueId: string, updates: Partial<OpenMicDisplay>) {
  const dbUpdates: Record<string, any> = {};
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

  const records = await pb.collection('open_mics_historical').getFullList({
    filter: `unique_identifier = "${uniqueId}"`,
    fields: 'id',
  });
  if (!records[0]) throw new Error('Mic not found');
  return pb.collection('open_mics_historical').update(records[0].id, dbUpdates);
}
