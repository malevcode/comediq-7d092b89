import { pb } from '@/integrations/pocketbase/client';

export async function fetchAllActiveEvents() {
  const today = new Date().toISOString().split('T')[0];

  const events = await pb.collection('mic_signup_events').getFullList({
    filter: `is_active = true && event_date >= "${today}"`,
    sort: '+event_date',
  });

  // Batch-fetch related mic data (PocketBase has no join — manual expand)
  const micIds = [...new Set(events.map(e => e.mic_id as string).filter(Boolean))];
  const mics = micIds.length > 0
    ? await pb.collection('open_mics_historical').getFullList({
        filter: micIds.map(id => `unique_identifier = "${id}"`).join(' || '),
        fields: 'unique_identifier,open_mic,venue_name,borough,day,location,neighborhood',
      })
    : [];

  const micMap = Object.fromEntries(mics.map(m => [m.unique_identifier, m]));
  return events.map(e => ({
    ...e,
    open_mics_historical: micMap[e.mic_id as string] ?? null,
  }));
}

export async function createSlotEvent(params: {
  micId: string;
  hostId: string;
  eventDate: string;
  eventTime?: string;
  totalSpots: number;
  signupMode: 'first_come' | 'lottery' | 'bucket';
  notes?: string;
}) {
  return pb.collection('mic_signup_events').create({
    mic_id: params.micId,
    host_id: params.hostId,
    event_date: params.eventDate,
    event_time: params.eventTime || null,
    total_spots: params.totalSpots,
    spots_remaining: params.totalSpots,
    signup_mode: params.signupMode,
    notes: params.notes || null,
    is_active: true,
  });
}
