/**
 * Audience Shows API
 * Handles all audience-facing show operations
 */

import { supabase } from '@/integrations/supabase/client';
import { generateShowDates, weekdayName, type ShowRepeat } from '@/utils/showRecurrence';

export interface AudienceShow {
  id: string;
  title: string;
  venue_name: string;
  venue_address: string | null;
  borough: string | null;
  show_date: string;
  show_time: string | null;
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
  // Ticketing/RSVP fields
  price_cents: number | null;
  is_paid: boolean;
  allows_rsvp: boolean;
  external_ticket_url: string | null;
  rsvp_count: number;
  // Recurring show fields
  is_recurring: boolean;
  recurrence_pattern: string | null;
  recurrence_day: string | null;
  parent_show_id: string | null;
  is_active: boolean;
  // Source tracking - null means submitted directly through Comediq
  source: string | null;
  source_event_id: string | null;
  latitude: number | null;
  longitude: number | null;
  geocoded_at: string | null;
  geocoding_provider: string | null;
  geocoding_score: number | null;
  geocoding_match_address: string | null;
  // Show listing form (see 20261021120000_show_listing_fields.sql)
  laughpass_free_ticket?: boolean;
  laughpass_ticket_limit?: number | null;
  confirm_active_agreed?: boolean;
  last_confirmed_active_at?: string | null;
}

export interface ShowRsvp {
  id: string;
  show_id: string;
  user_id: string;
  party_size: number;
  status: string;
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
 * Fetches all verified active audience shows from affiliated/opted-in venues only.
 * Shows with source=null are Comediq-native (submitted directly).
 * Shows with a source must match a venue_sources entry with permission_status='approved'.
 */
export async function fetchAudienceShows(filters?: AudienceShowFilters): Promise<AudienceShow[]> {
  // Get source_keys for venues that have explicitly opted in
  const { data: approvedSources } = await supabase
    .from('venue_sources')
    .select('source_key')
    .eq('permission_status', 'approved')
    .eq('is_active', true);

  const approvedKeys = (approvedSources || []).map(s => s.source_key);

  // Only show Comediq-native shows (source IS NULL) plus any approved partner venues
  const sourceFilter = approvedKeys.length > 0
    ? `source.is.null,source.in.(${approvedKeys.join(',')})`
    : 'source.is.null';

  let query = supabase
    .from('audience_shows')
    .select('*')
    .eq('verified', true)
    .eq('status', 'active')
    .eq('is_active', true)
    .eq('is_recurring', false) // Only show instances, not templates
    .gte('show_date', new Date().toISOString().split('T')[0])
    .or(sourceFilter)
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
 * Fetches featured shows from affiliated venues only
 */
export async function fetchFeaturedShows(): Promise<AudienceShow[]> {
  const { data: approvedSources } = await supabase
    .from('venue_sources')
    .select('source_key')
    .eq('permission_status', 'approved')
    .eq('is_active', true);

  const approvedKeys = (approvedSources || []).map(s => s.source_key);
  const sourceFilter = approvedKeys.length > 0
    ? `source.is.null,source.in.(${approvedKeys.join(',')})`
    : 'source.is.null';

  const { data, error } = await supabase
    .from('audience_shows')
    .select('*')
    .eq('verified', true)
    .eq('status', 'active')
    .eq('is_featured', true)
    .gte('show_date', new Date().toISOString().split('T')[0])
    .or(sourceFilter)
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
export async function submitAudienceShow(show: Omit<AudienceShow, 'id' | 'created_at' | 'updated_at' | 'verified' | 'status' | 'price_cents' | 'is_paid' | 'allows_rsvp' | 'external_ticket_url' | 'capacity' | 'rsvp_count'>) {
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

/**
 * RSVP for a free show
 */
export async function rsvpForShow(showId: string, partySize: number = 1): Promise<ShowRsvp> {
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    throw new Error('Must be logged in to RSVP');
  }

  const { data, error } = await supabase
    .from('show_rsvps')
    .insert({
      show_id: showId,
      user_id: user.id,
      party_size: partySize,
      status: 'confirmed'
    })
    .select()
    .single();

  if (error) {
    throw error;
  }

  return data as ShowRsvp;
}

/**
 * Cancel an RSVP
 */
export async function cancelRsvp(rsvpId: string): Promise<void> {
  const { error } = await supabase
    .from('show_rsvps')
    .delete()
    .eq('id', rsvpId);

  if (error) {
    throw error;
  }
}

/**
 * Get user's RSVP for a specific show
 */
export async function fetchUserRsvpForShow(showId: string): Promise<ShowRsvp | null> {
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    return null;
  }

  const { data, error } = await supabase
    .from('show_rsvps')
    .select('*')
    .eq('show_id', showId)
    .eq('user_id', user.id)
    .eq('status', 'confirmed')
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data as ShowRsvp | null;
}

/**
 * Get all user's RSVPs
 */
export async function fetchUserRsvps(): Promise<ShowRsvp[]> {
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    return [];
  }

  const { data, error } = await supabase
    .from('show_rsvps')
    .select('*')
    .eq('user_id', user.id)
    .eq('status', 'confirmed')
    .order('created_at', { ascending: false });

  if (error) {
    throw error;
  }

  return (data || []) as ShowRsvp[];
}


export interface ShowListingInput {
  title: string;
  venue_name: string;
  venue_address: string | null;
  borough: string | null;
  show_date: string; // YYYY-MM-DD, the first (or only) date
  show_time: string; // HH:MM
  doors_time: string | null;
  ticket_price: string | null;
  ticket_url: string | null;
  instagram_handle: string | null;
  show_type: string | null;
  host_name: string | null;
  description: string | null;
  lineup: string | null;
  image_url: string | null;
  repeat: ShowRepeat;
  laughpass_free_ticket: boolean;
  laughpass_ticket_limit: number | null;
  confirm_active_agreed: boolean;
}

/**
 * Saves a show submitted through the listing form. A repeating show is stored
 * the way the rest of the site expects: one hidden template row plus one dated
 * row per upcoming show, each pointing back at the template.
 *
 * New rows start unverified, so they wait for review. We do not ask the database
 * to return the new row: an unverified row is not readable by its submitter, so
 * a RETURNING select would be refused. The template id is made here instead.
 */
export async function submitShowListing(userId: string, input: ShowListingInput): Promise<void> {
  const { repeat, show_date, ...fields } = input;

  const base = {
    ...fields,
    submitted_by: userId,
    status: 'active',
    is_active: true,
    is_featured: false,
    // Must stay null: the feed query and the RLS policy only admit
    // source IS NULL or an approved venue_sources key.
    source: null,
  };

  if (repeat === 'none') {
    const { error } = await supabase.from('audience_shows').insert({ ...base, show_date, is_recurring: false });
    if (error) throw error;
    return;
  }

  const templateId = crypto.randomUUID();
  const { error: templateError } = await supabase.from('audience_shows').insert({
    ...base,
    id: templateId,
    show_date,
    is_recurring: true,
    recurrence_pattern: repeat,
    recurrence_day: weekdayName(show_date),
  });
  if (templateError) throw templateError;

  const { error: instancesError } = await supabase.from('audience_shows').insert(
    generateShowDates(show_date, repeat).map((date) => ({
      ...base,
      show_date: date,
      is_recurring: false,
      parent_show_id: templateId,
    })),
  );
  if (instancesError) throw instancesError;
}
