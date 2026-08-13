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

const nowIso = new Date(0).toISOString();

const fallbackBottomAds: BannerAd[] = [
  {
    id: "fallback-add-a-mic",
    label: "Add A Mic",
    href: "/open-mics?addMic=true",
    external: false,
    position: "bottom",
    sort_order: 100,
    is_active: true,
    icon_url: null,
    client_name: null,
    amount_paid: null,
    payment_method: null,
    start_date: null,
    end_date: null,
    contact_id: null,
    description: null,
    cta_text: null,
    created_at: nowIso,
    updated_at: nowIso,
  },
  {
    id: "fallback-add-your-show",
    label: "Add Your Show",
    href: "https://forms.gle/6acD4UbmJyY45tzz9",
    external: true,
    position: "bottom",
    sort_order: 101,
    is_active: true,
    icon_url: null,
    client_name: null,
    amount_paid: null,
    payment_method: null,
    start_date: null,
    end_date: null,
    contact_id: null,
    description: null,
    cta_text: null,
    created_at: nowIso,
    updated_at: nowIso,
  },
  {
    id: "fallback-feedback",
    label: "Feedback",
    href: "https://docs.google.com/forms/d/e/1FAIpQLSeDk4FdZGDD1APBNCUzV1IhaylLiHSAnlmhUaUz503umv457A/viewform?usp=dialog",
    external: true,
    position: "bottom",
    sort_order: 102,
    is_active: true,
    icon_url: null,
    client_name: null,
    amount_paid: null,
    payment_method: null,
    start_date: null,
    end_date: null,
    contact_id: null,
    description: null,
    cta_text: null,
    created_at: nowIso,
    updated_at: nowIso,
  },
  {
    id: "fallback-advertise",
    label: "Advertise!",
    href: "https://docs.google.com/forms/d/e/1FAIpQLSe58Za3tfgyuUFNoVxQb_qAe3PPfVrnm4gciw_cklp-HPkKQg/viewform?usp=publish-editor",
    external: true,
    position: "bottom",
    sort_order: 103,
    is_active: true,
    icon_url: null,
    client_name: null,
    amount_paid: null,
    payment_method: null,
    start_date: null,
    end_date: null,
    contact_id: null,
    description: null,
    cta_text: null,
    created_at: nowIso,
    updated_at: nowIso,
  },
];

const mergeWithFallbackAds = (ads: BannerAd[], fallbackAds: BannerAd[]) => {
  const seen = new Set<string>();

  return [...ads, ...fallbackAds].filter((ad) => {
    const key = `${ad.label.trim().toLowerCase()}|${ad.href}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
};

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
  const bottomAds = mergeWithFallbackAds(
    ads.filter(a => a.position === 'bottom'),
    fallbackBottomAds,
  );

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
  if (adId.startsWith('fallback-')) return;

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
