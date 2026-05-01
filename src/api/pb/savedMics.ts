import { pb } from '@/integrations/pocketbase/client';

export interface SavedMic {
  id: string;
  user_id: string;
  mic_unique_identifier: string;
  created_at: string;
}

export async function fetchSavedMics(userId: string): Promise<SavedMic[]> {
  const data = await pb.collection('saved_mics').getFullList({
    filter: `user_id = "${userId}"`,
    sort: '-created',
  });
  return data as unknown as SavedMic[];
}

export async function saveMic(userId: string, micUniqueIdentifier: string): Promise<void> {
  await pb.collection('saved_mics').create({ user_id: userId, mic_unique_identifier: micUniqueIdentifier });
}

export async function unsaveMic(userId: string, micUniqueIdentifier: string): Promise<void> {
  const records = await pb.collection('saved_mics').getFullList({
    filter: `user_id = "${userId}" && mic_unique_identifier = "${micUniqueIdentifier}"`,
    fields: 'id',
  });
  for (const r of records) {
    await pb.collection('saved_mics').delete(r.id);
  }
}
