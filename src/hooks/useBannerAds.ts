import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface BannerAd {
  id: string;
  label: string;
  href: string;
  external: boolean;
  position: string;
  sort_order: number;
  is_active: boolean;
  icon_url: string | null;
  client_name: string | null;
  amount_paid: number | null;
  payment_method: string | null;
  start_date: string | null;
  end_date: string | null;
  contact_id: string | null;
  description: string | null;
  cta_text: string | null;
  created_at: string;
  updated_at: string;
}

export function useBannerAds() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['banner-ads-active'],
    queryFn: async () => {
      const today = new Date().toISOString().split('T')[0];
      const { data, error } = await supabase
        .from('banner_ads')
        .select('*')
        .eq('is_active', true)
        .order('position')
        .order('sort_order');
      if (error) throw error;
      return (data ?? []).filter((a: BannerAd) => {
        if (a.start_date && a.start_date > today) return false;
        if (a.end_date && a.end_date < today) return false;
        return true;
      }) as BannerAd[];
    },
    staleTime: 5 * 60 * 1000,
  });

  const ads = data ?? [];
  const topAds = ads.filter(a => a.position === 'top');
  const bottomAds = ads.filter(a => a.position === 'bottom');

  return {
    topAds,
    bottomAds,
    isLoading,
    error,
  };
}

export function useAllBannerAds() {
  return useQuery({
    queryKey: ['banner-ads-all'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('banner_ads')
        .select('*')
        .order('position')
        .order('sort_order');
      if (error) throw error;
      return data as BannerAd[];
    },
  });
}

export function useAdClickCounts() {
  return useQuery({
    queryKey: ['ad-click-counts'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('ad_click_counts')
        .select('*');
      if (error) throw error;
      return data as { ad_id: string; click_count: number }[];
    },
  });
}

export async function recordAdClick(adId: string, userId?: string, placement?: string) {
  try {
    await supabase.from('ad_clicks').insert({
      ad_id: adId,
      user_id: userId ?? null,
      placement: placement ?? 'banner',
    });
  } catch (e) {
    // swallow: ad tracking must never break UX
  }
}

// Sponsor ad disabled to eliminate Supabase egress until billing cycle resets (July 5)
export function useSponsorAd() {
  return useQuery({
    queryKey: ['sponsor-ad', 'disabled'],
    queryFn: async () => null as BannerAd | null,
    staleTime: Infinity,
  });
}
