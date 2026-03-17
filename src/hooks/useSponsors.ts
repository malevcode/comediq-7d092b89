import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface Sponsor {
  id: string;
  label: string;
  href: string;
  icon_url: string | null;
  description: string | null;
  cta_text: string | null;
  is_active: boolean;
}

export function useSponsors() {
  const today = new Date().toISOString().split('T')[0];

  return useQuery({
    queryKey: ['sponsors', today],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('banner_ads')
        .select('id, label, href, icon_url, description, cta_text, is_active')
        .eq('is_active', true)
        .eq('position', 'sponsor')
        .or(`start_date.is.null,start_date.lte.${today}`)
        .or(`end_date.is.null,end_date.gte.${today}`)
        .order('sort_order');
      if (error) throw error;
      return (data ?? []) as Sponsor[];
    },
    staleTime: 5 * 60 * 1000,
  });
}

export async function recordSponsorClick(adId: string, placement: 'header' | 'sponsors_section', userId?: string) {
  await supabase.from('ad_clicks').insert({
    ad_id: adId,
    user_id: userId || null,
    placement,
  });
}
