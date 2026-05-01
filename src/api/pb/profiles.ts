import { pb } from '@/integrations/pocketbase/client';
import type { UserProfile, SocialLink, ComedianProfile } from '../profiles';

export type { UserProfile, SocialLink, ComedianProfile };

async function getProfileByUserId(userId: string) {
  const results = await pb.collection('profiles').getFullList({
    filter: `supabase_user_id = "${userId}" || user = "${userId}"`,
  });
  return results[0] ?? null;
}

export async function fetchUserProfile(userId: string): Promise<UserProfile | null> {
  const record = await getProfileByUserId(userId);
  if (!record) return null;
  return { ...record, user_id: userId } as UserProfile;
}

export async function updateUserProfile(userId: string, updates: Partial<UserProfile>) {
  const record = await getProfileByUserId(userId);
  if (!record) throw new Error('Profile not found');
  const updated = await pb.collection('profiles').update(record.id, updates);
  return { ...updated, user_id: userId };
}

export async function fetchUserVisits(userId: string) {
  const data = await pb.collection('user_visits').getFullList({
    filter: `user_id = "${userId}"`,
    sort: '-visit_date',
    fields: 'visit_date',
  });
  return data.map(r => ({ visit_date: r.visit_date }));
}

export async function recordUserVisit(userId: string) {
  const today = new Date().toISOString().split('T')[0];
  const existing = await pb.collection('user_visits').getFullList({
    filter: `user_id = "${userId}" && visit_date = "${today}"`,
    fields: 'id',
  });
  if (existing.length === 0) {
    await pb.collection('user_visits').create({ user_id: userId, visit_date: today });
  }
}

export async function fetchComedianProfile(userId: string): Promise<ComedianProfile | null> {
  const [record, links] = await Promise.all([
    getProfileByUserId(userId),
    pb.collection('comedian_social_links').getFullList({
      filter: `user_id = "${userId}"`,
    }),
  ]);
  if (!record) return null;
  return {
    ...record,
    user_id: userId,
    social_links: links as unknown as SocialLink[],
  } as ComedianProfile;
}

export async function uploadHeadshot(userId: string, file: File): Promise<string> {
  const record = await getProfileByUserId(userId);
  if (!record) throw new Error('Profile not found');
  // PocketBase file upload via FormData
  const formData = new FormData();
  formData.append('headshot_url', file);
  const updated = await pb.collection('profiles').update(record.id, formData);
  return pb.files.getURL(updated, updated.headshot_url as string);
}

export async function addSocialLink(userId: string, platform: string, handle: string, url: string, isPrimary = false) {
  const existing = await pb.collection('comedian_social_links').getFullList({
    filter: `user_id = "${userId}" && platform = "${platform}"`,
    fields: 'id',
  });
  if (existing[0]) {
    return pb.collection('comedian_social_links').update(existing[0].id, { handle, url, is_primary: isPrimary });
  }
  return pb.collection('comedian_social_links').create({ user_id: userId, platform, handle, url, is_primary: isPrimary });
}

export async function removeSocialLink(userId: string, platform: string) {
  const records = await pb.collection('comedian_social_links').getFullList({
    filter: `user_id = "${userId}" && platform = "${platform}"`,
    fields: 'id',
  });
  for (const r of records) {
    await pb.collection('comedian_social_links').delete(r.id);
  }
}

export async function fetchComediansByIds(userIds: string[]): Promise<ComedianProfile[]> {
  if (userIds.length === 0) return [];
  const idFilter = userIds.map(id => `supabase_user_id = "${id}" || user = "${id}"`).join(' || ');
  const [profiles, links] = await Promise.all([
    pb.collection('profiles').getFullList({ filter: idFilter }),
    pb.collection('comedian_social_links').getFullList({
      filter: userIds.map(id => `user_id = "${id}"`).join(' || '),
    }),
  ]);
  return profiles.map(p => ({
    ...p,
    user_id: p.supabase_user_id || p.user,
    social_links: links.filter(l => l.user_id === (p.supabase_user_id || p.user)),
  })) as unknown as ComedianProfile[];
}
