import { pb } from '@/integrations/pocketbase/client';
import type { UserShow, CustomShow } from '../shows';

export type { UserShow, CustomShow };

export async function fetchUserShows(userId: string): Promise<UserShow[]> {
  const data = await pb.collection('profile_open_mics').getFullList({
    filter: `profile_id = "${userId}"`,
  });
  return data as unknown as UserShow[];
}

export async function fetchCustomShows(userId: string): Promise<CustomShow[]> {
  const data = await pb.collection('profile_custom_shows').getFullList({
    filter: `profile_id = "${userId}"`,
  });
  return data as unknown as CustomShow[];
}

export async function addCustomShow(show: Omit<CustomShow, 'id' | 'created_at' | 'last_modified'>) {
  return pb.collection('profile_custom_shows').create(show);
}

export async function updateCustomShow(showId: string, updates: Partial<CustomShow>) {
  return pb.collection('profile_custom_shows').update(showId, {
    ...updates,
    last_modified: new Date().toISOString(),
  });
}

export async function deleteCustomShow(showId: string) {
  await pb.collection('profile_custom_shows').delete(showId);
}

export async function fetchCompletedShows(userId: string) {
  const profileMics = await pb.collection('profile_open_mics').getFullList({
    filter: `profile_id = "${userId}" && schedule_type = "completed"`,
  });

  // Fetch stage_time for each mic (PocketBase doesn't support joins — batch fetch)
  const micIds = [...new Set(profileMics.map(r => r.open_mic_id as string).filter(Boolean))];
  if (micIds.length === 0) return profileMics;

  const mics = await pb.collection('open_mics_historical').getFullList({
    filter: micIds.map(id => `unique_identifier = "${id}"`).join(' || '),
    fields: 'unique_identifier,stage_time',
  });

  const micMap = Object.fromEntries(mics.map(m => [m.unique_identifier, m]));
  return profileMics.map(r => ({
    ...r,
    open_mics_historical: micMap[r.open_mic_id as string] ?? null,
  }));
}
