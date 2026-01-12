/**
 * Audience Shows API
 * Handles all audience-facing show operations
 */

import { supabase } from '@/integrations/supabase/client';

export interface AudienceShow {
  id: string;
  title: string;
  venue_name: string;
  venue_address: string | null;
  borough: string | null;
  show_date: string;
  show_time: string;
  doors_time: string | null;
  description: string | null;
  lineup: string | null;
  ticket_url: string | null;
  ticket_price: string | null;
  show_type: string | null;
  host_name: string | null;
  instagram_handle: string | null;
  image_url: string | null;
  expected_audience: number | null;
  age_restriction: string | null;
  is_featured: boolean;
  status: string;
  verified: boolean;
  created_at: string;
  updated_at: string;
}

export interface AudienceShowFilters {
  borough?: string;
  showType?: string;
  dateFrom?: string;
  dateTo?: string;
  search?: string;
}

/**
 * Fetches all verified active audience shows
 */
export async function fetchAudienceShows(filters?: AudienceShowFilters): Promise<AudienceShow[]> {
  let query = supabase
    .from('audience_shows')
    .select('*')
    .eq('verified', true)
    .eq('status', 'active')
    .gte('show_date', new Date().toISOString().split('T')[0])
    .order('show_date', { ascending: true })
    .order('show_time', { ascending: true });

  if (filters?.borough && filters.borough !== 'all') {
    query = query.eq('borough', filters.borough);
  }

  if (filters?.showType && filters.showType !== 'all') {
    query = query.eq('show_type', filters.showType);
  }

  if (filters?.dateFrom) {
    query = query.gte('show_date', filters.dateFrom);
  }

  if (filters?.dateTo) {
    query = query.lte('show_date', filters.dateTo);
  }

  if (filters?.search) {
    query = query.or(`title.ilike.%${filters.search}%,venue_name.ilike.%${filters.search}%,lineup.ilike.%${filters.search}%`);
  }

  const { data, error } = await query;

  if (error) {
    throw error;
  }

  return (data || []) as AudienceShow[];
}

/**
 * Fetches a single show by ID
 */
export async function fetchAudienceShowById(id: string): Promise<AudienceShow | null> {
  const { data, error } = await supabase
    .from('audience_shows')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return null;
    }
    throw error;
  }

  return data as AudienceShow;
}

/**
 * Fetches featured shows
 */
export async function fetchFeaturedShows(): Promise<AudienceShow[]> {
  const { data, error } = await supabase
    .from('audience_shows')
    .select('*')
    .eq('verified', true)
    .eq('status', 'active')
    .eq('is_featured', true)
    .gte('show_date', new Date().toISOString().split('T')[0])
    .order('show_date', { ascending: true })
    .limit(5);

  if (error) {
    throw error;
  }

  return (data || []) as AudienceShow[];
}

/**
 * Submits a new show (requires authentication)
 */
export async function submitAudienceShow(show: Omit<AudienceShow, 'id' | 'created_at' | 'updated_at' | 'verified' | 'status'>) {
  const { data, error } = await supabase
    .from('audience_shows')
    .insert({
      ...show,
      verified: false,
      status: 'active'
    })
    .select()
    .single();

  if (error) {
    throw error;
  }

  return data;
}
