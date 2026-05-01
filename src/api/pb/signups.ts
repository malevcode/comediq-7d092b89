import { pb } from '@/integrations/pocketbase/client';

// In PocketBase there is no RPC — getOrCreateSystemHost is implemented in app code.
// A "system host" is just the first mic_hosts record for the mic.
// If none exists, we create one using the current user as host.
async function getOrCreateSystemHost(micId: string): Promise<string> {
  const existing = await pb.collection('mic_hosts').getFullList({
    filter: `mic_id = "${micId}"`,
    fields: 'id',
  });
  if (existing[0]) return existing[0].id;

  const user = pb.authStore.record;
  if (!user) throw new Error('Must be authenticated');

  const host = await pb.collection('mic_hosts').create({
    user_id: user.id,
    mic_id: micId,
    is_verified: false,
  });
  return host.id;
}

export async function getOrCreateNextEvent(micId: string, micDay: string, micStartTime?: string) {
  const user = pb.authStore.record;
  if (!user) throw new Error('Must be authenticated');

  const today = new Date().toISOString().split('T')[0];

  const existing = await pb.collection('mic_signup_events').getFullList({
    filter: `mic_id = "${micId}" && is_active = true && event_date >= "${today}"`,
    sort: '+event_date',
  });
  if (existing[0]) return existing[0];

  const hostId = await getOrCreateSystemHost(micId);

  const daysOfWeek = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
  const target = daysOfWeek.indexOf(micDay);
  const now = new Date();
  let daysUntil = target === -1 ? 7 : (target - now.getDay() + 7) % 7 || 7;
  const nextDate = new Date(now);
  nextDate.setDate(now.getDate() + daysUntil);
  const eventDate = nextDate.toISOString().split('T')[0];

  return pb.collection('mic_signup_events').create({
    mic_id: micId,
    host_id: hostId,
    event_date: eventDate,
    event_time: micStartTime || null,
    total_spots: 15,
    spots_remaining: 15,
    signup_mode: 'first_come',
    is_active: true,
  });
}

export async function claimHostStatus(micId: string) {
  const user = pb.authStore.record;
  if (!user) throw new Error('Must be authenticated');

  return pb.collection('mic_hosts').create({
    user_id: user.id,
    mic_id: micId,
    is_verified: false,
  });
}

export async function checkHostStatus(userId: string) {
  const hosts = await pb.collection('mic_hosts').getFullList({
    filter: `user_id = "${userId}"`,
  });

  // Batch-fetch mic info
  const micIds = [...new Set(hosts.map(h => h.mic_id as string).filter(Boolean))];
  const mics = micIds.length > 0
    ? await pb.collection('open_mics_historical').getFullList({
        filter: micIds.map(id => `unique_identifier = "${id}"`).join(' || '),
        fields: 'unique_identifier,open_mic,venue_name',
      })
    : [];

  const micMap = Object.fromEntries(mics.map(m => [m.unique_identifier, m]));
  return hosts.map(h => ({
    ...h,
    open_mics_historical: micMap[h.mic_id as string] ?? null,
  }));
}

export async function createSignupEvent(eventData: {
  mic_id: string;
  host_id: string;
  event_date: string;
  event_time?: string;
  total_spots: number;
  signup_mode: 'first_come' | 'lottery' | 'bucket';
  signup_opens_at?: string;
  signup_closes_at?: string;
  notes?: string;
}) {
  return pb.collection('mic_signup_events').create(eventData);
}

export async function fetchSignupEvents(micId: string) {
  const events = await pb.collection('mic_signup_events').getFullList({
    filter: `mic_id = "${micId}" && is_active = true`,
    sort: '+event_date',
  });

  // Expand host → profile username
  const hostIds = [...new Set(events.map(e => e.host_id as string).filter(Boolean))];
  const hosts = hostIds.length > 0
    ? await pb.collection('mic_hosts').getFullList({
        filter: hostIds.map(id => `id = "${id}"`).join(' || '),
      })
    : [];

  const userIds = [...new Set(hosts.map(h => h.user_id as string).filter(Boolean))];
  const profiles = userIds.length > 0
    ? await pb.collection('profiles').getFullList({
        filter: userIds.map(id => `supabase_user_id = "${id}" || user = "${id}"`).join(' || '),
        fields: 'supabase_user_id,user,username',
      })
    : [];

  const profileMap = Object.fromEntries(
    profiles.map(p => [p.supabase_user_id || p.user, p])
  );
  const hostMap = Object.fromEntries(
    hosts.map(h => [h.id, { ...h, profiles: profileMap[h.user_id as string] ?? null }])
  );

  return events.map(e => ({ ...e, mic_hosts: hostMap[e.host_id as string] ?? null }));
}

export async function signUpForEvent(eventId: string, notes?: string) {
  const user = pb.authStore.record;
  if (!user) throw new Error('Must be authenticated');

  return pb.collection('mic_signups').create({
    event_id: eventId,
    user_id: user.id,
    notes: notes || null,
    status: 'confirmed',
  });
}

export async function guestSignUpForEvent(eventId: string, guestInfo: {
  name: string;
  email: string;
  phone?: string;
  notes?: string;
}) {
  return pb.collection('mic_signups').create({
    event_id: eventId,
    guest_name: guestInfo.name,
    guest_email: guestInfo.email,
    guest_phone: guestInfo.phone || null,
    notes: guestInfo.notes || null,
    status: 'confirmed',
  });
}

export async function fetchEventSignups(eventId: string) {
  const signups = await pb.collection('mic_signups').getFullList({
    filter: `event_id = "${eventId}"`,
    sort: '+created',
  });

  const userIds = [...new Set(signups.map(s => s.user_id as string).filter(Boolean))];
  const profiles = userIds.length > 0
    ? await pb.collection('profiles').getFullList({
        filter: userIds.map(id => `supabase_user_id = "${id}" || user = "${id}"`).join(' || '),
        fields: 'supabase_user_id,user,username',
      })
    : [];

  const profileMap = Object.fromEntries(
    profiles.map(p => [p.supabase_user_id || p.user, { username: p.username }])
  );
  return signups.map(s => ({ ...s, profiles: profileMap[s.user_id as string] ?? null }));
}

export async function cancelSignup(signupId: string) {
  await pb.collection('mic_signups').update(signupId, { status: 'cancelled' });
}

export async function fetchUserSignups(userId: string) {
  const signups = await pb.collection('mic_signups').getFullList({
    filter: `user_id = "${userId}"`,
    sort: '-created',
  });

  const eventIds = [...new Set(signups.map(s => s.event_id as string).filter(Boolean))];
  const events = eventIds.length > 0
    ? await pb.collection('mic_signup_events').getFullList({
        filter: eventIds.map(id => `id = "${id}"`).join(' || '),
      })
    : [];

  const micIds = [...new Set(events.map(e => e.mic_id as string).filter(Boolean))];
  const mics = micIds.length > 0
    ? await pb.collection('open_mics_historical').getFullList({
        filter: micIds.map(id => `unique_identifier = "${id}"`).join(' || '),
        fields: 'unique_identifier,open_mic,venue_name,borough,day,start_time',
      })
    : [];

  const micMap = Object.fromEntries(mics.map(m => [m.unique_identifier, m]));
  const eventMap = Object.fromEntries(
    events.map(e => [e.id, { ...e, open_mics_historical: micMap[e.mic_id as string] ?? null }])
  );

  return signups.map(s => ({ ...s, mic_signup_events: eventMap[s.event_id as string] ?? null }));
}
