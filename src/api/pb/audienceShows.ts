import { pb } from '@/integrations/pocketbase/client';
import type { AudienceShow, AudienceShowFilters, ShowRsvp } from '../audienceShows';

export type { AudienceShow, AudienceShowFilters, ShowRsvp };

async function getApprovedSourceFilter(): Promise<string> {
  const sources = await pb.collection('venue_sources').getFullList({
    filter: 'permission_status = "approved" && is_active = true',
    fields: 'source_key',
  });
  const keys = sources.map(s => s.source_key);
  if (keys.length > 0) {
    const keyFilter = keys.map(k => `source = "${k}"`).join(' || ');
    return `(source = "" || source = null || ${keyFilter})`;
  }
  return '(source = "" || source = null)';
}

export async function fetchAudienceShows(filters?: AudienceShowFilters): Promise<AudienceShow[]> {
  const today = new Date().toISOString().split('T')[0];
  const sourceFilter = await getApprovedSourceFilter();

  const parts: string[] = [
    'verified = true',
    'status = "active"',
    'is_active = true',
    'is_recurring = false',
    `show_date >= "${today}"`,
    sourceFilter,
  ];

  if (filters?.borough && filters.borough !== 'all') {
    parts.push(`borough = "${filters.borough}"`);
  }
  if (filters?.showType && filters.showType !== 'all') {
    parts.push(`show_type = "${filters.showType}"`);
  }
  if (filters?.dateFrom) {
    parts.push(`show_date >= "${filters.dateFrom}"`);
  }
  if (filters?.dateTo) {
    parts.push(`show_date <= "${filters.dateTo}"`);
  }
  if (filters?.search) {
    const s = filters.search.replace(/"/g, '\\"');
    parts.push(`(title ~ "${s}" || venue_name ~ "${s}" || lineup ~ "${s}")`);
  }

  const data = await pb.collection('audience_shows').getFullList({
    filter: parts.join(' && '),
    sort: '+show_date,+show_time',
  });

  return data as unknown as AudienceShow[];
}

export async function fetchAudienceShowById(id: string): Promise<AudienceShow | null> {
  try {
    const data = await pb.collection('audience_shows').getOne(id);
    return data as unknown as AudienceShow;
  } catch {
    return null;
  }
}

export async function fetchFeaturedShows(): Promise<AudienceShow[]> {
  const today = new Date().toISOString().split('T')[0];
  const sourceFilter = await getApprovedSourceFilter();

  const data = await pb.collection('audience_shows').getList(1, 5, {
    filter: `verified = true && status = "active" && is_featured = true && show_date >= "${today}" && ${sourceFilter}`,
    sort: '+show_date',
  });

  return data.items as unknown as AudienceShow[];
}

export async function submitAudienceShow(show: Omit<AudienceShow, 'id' | 'created_at' | 'updated_at' | 'verified' | 'status' | 'price_cents' | 'is_paid' | 'allows_rsvp' | 'external_ticket_url' | 'rsvp_count'>) {
  return pb.collection('audience_shows').create({ ...show, verified: false, status: 'active' });
}

export async function rsvpForShow(showId: string, partySize: number = 1): Promise<ShowRsvp> {
  const user = pb.authStore.record;
  if (!user) throw new Error('Must be logged in to RSVP');

  const data = await pb.collection('show_rsvps').create({
    show_id: showId,
    user_id: user.id,
    party_size: partySize,
    status: 'confirmed',
  });
  return data as unknown as ShowRsvp;
}

export async function cancelRsvp(rsvpId: string): Promise<void> {
  await pb.collection('show_rsvps').delete(rsvpId);
}

export async function fetchUserRsvpForShow(showId: string): Promise<ShowRsvp | null> {
  const user = pb.authStore.record;
  if (!user) return null;

  try {
    const results = await pb.collection('show_rsvps').getFullList({
      filter: `show_id = "${showId}" && user_id = "${user.id}" && status = "confirmed"`,
    });
    return results[0] as unknown as ShowRsvp ?? null;
  } catch {
    return null;
  }
}

export async function fetchUserRsvps(): Promise<ShowRsvp[]> {
  const user = pb.authStore.record;
  if (!user) return [];

  const data = await pb.collection('show_rsvps').getFullList({
    filter: `user_id = "${user.id}" && status = "confirmed"`,
    sort: '-created',
  });
  return data as unknown as ShowRsvp[];
}
