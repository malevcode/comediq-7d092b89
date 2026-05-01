import { pb } from '@/integrations/pocketbase/client';
import type { GrowthOpportunity, GrowthOpportunityType } from '../growthOpportunities';

export type { GrowthOpportunity, GrowthOpportunityType };

export async function fetchGrowthOpportunities(type?: GrowthOpportunityType) {
  const parts = ['is_active = true'];
  if (type) parts.push(`type = "${type}"`);

  const data = await pb.collection('growth_opportunities').getFullList({
    filter: parts.join(' && '),
    sort: '-is_featured,-created',
  });
  return data as unknown as GrowthOpportunity[];
}

export async function fetchAllGrowthOpportunities() {
  const data = await pb.collection('growth_opportunities').getFullList({ sort: '-created' });
  return data as unknown as GrowthOpportunity[];
}

export async function fetchMySubmissions(userId: string) {
  const data = await pb.collection('growth_opportunities').getFullList({
    filter: `submitted_by = "${userId}"`,
    sort: '-created',
  });
  return data as unknown as GrowthOpportunity[];
}

export async function submitGrowthOpportunity(opportunity: {
  type: GrowthOpportunityType;
  title: string;
  description?: string;
  venue_name?: string;
  borough?: string;
  date?: string;
  time?: string;
  compensation?: string;
  contact_info?: string;
  external_url?: string;
  submitted_by: string;
}) {
  const data = await pb.collection('growth_opportunities').create({
    ...opportunity,
    status: 'approved',
    is_active: true,
  });
  return data as unknown as GrowthOpportunity;
}

export async function updateGrowthOpportunity(id: string, updates: Partial<GrowthOpportunity>) {
  const data = await pb.collection('growth_opportunities').update(id, updates);
  return data as unknown as GrowthOpportunity;
}

export async function deleteGrowthOpportunity(id: string) {
  await pb.collection('growth_opportunities').delete(id);
}
