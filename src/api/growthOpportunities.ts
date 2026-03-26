import { supabase } from "@/integrations/supabase/client";

export type GrowthOpportunityType = 'barking' | 'festival' | 'school_ad';
export type GrowthOpportunityStatus = 'submitted' | 'in_review' | 'approved' | 'rejected';

export interface GrowthOpportunity {
  id: string;
  type: GrowthOpportunityType;
  title: string;
  description: string | null;
  venue_name: string | null;
  borough: string | null;
  date: string | null;
  time: string | null;
  compensation: string | null;
  contact_info: string | null;
  external_url: string | null;
  image_url: string | null;
  is_featured: boolean;
  is_active: boolean;
  status: GrowthOpportunityStatus;
  submitted_by: string | null;
  contact_id: string | null;
  created_at: string;
  updated_at: string;
}

export async function fetchGrowthOpportunities(type?: GrowthOpportunityType) {
  let query = supabase
    .from('growth_opportunities')
    .select('*')
    .eq('is_active', true)
    .order('is_featured', { ascending: false })
    .order('created_at', { ascending: false });

  if (type) {
    query = query.eq('type', type);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data as GrowthOpportunity[];
}

export async function fetchAllGrowthOpportunities() {
  const { data, error } = await supabase
    .from('growth_opportunities')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data as GrowthOpportunity[];
}

export async function fetchMySubmissions(userId: string) {
  const { data, error } = await supabase
    .from('growth_opportunities')
    .select('*')
    .eq('submitted_by', userId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data as GrowthOpportunity[];
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
  const { data, error } = await supabase
    .from('growth_opportunities')
    .insert({ ...opportunity, status: 'submitted' })
    .select()
    .single();

  if (error) throw error;
  return data as GrowthOpportunity;
}

export async function updateGrowthOpportunity(id: string, updates: Partial<GrowthOpportunity>) {
  const { data, error } = await supabase
    .from('growth_opportunities')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data as GrowthOpportunity;
}

export async function deleteGrowthOpportunity(id: string) {
  const { error } = await supabase
    .from('growth_opportunities')
    .delete()
    .eq('id', id);

  if (error) throw error;
}
