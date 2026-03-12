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
  created_at: string;
  updated_at: string;
}

const fallbackTopAds = [
  { label: "#MeThree", href: "https://metoomvmt.org/", external: true },
  { label: "Comediq Supports Safe Funny Spaces", href: "/", external: false },
  { label: "Advertise!", href: "https://docs.google.com/forms/d/e/1FAIpQLSe58Za3tfgyuUFNoVxQb_qAe3PPfVrnm4gciw_cklp-HPkKQg/viewform?usp=publish-editor", external: true },
];

const fallbackBottomAds = [
  { label: "Add A Mic", href: "/open-mics?addMic=true", external: false },
  { label: "Add Your Show", href: "https://forms.gle/6acD4UbmJyY45tzz9", external: true },
  { label: "Feedback", href: "https://docs.google.com/forms/d/e/1FAIpQLSeDk4FdZGDD1APBNCUzV1IhaylLiHSAnlmhUaUz503umv457A/viewform?usp=dialog", external: true },
  { label: "Advertise!", href: "https://docs.google.com/forms/d/e/1FAIpQLSe58Za3tfgyuUFNoVxQb_qAe3PPfVrnm4gciw_cklp-HPkKQg/viewform?usp=publish-editor", external: true },
];

export function useBannerAds() {
  const today = new Date().toISOString().split('T')[0];

  const { data: ads, isLoading, error } = useQuery({
    queryKey: ['banner-ads', today],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('banner_ads')
        .select('*')
        .eq('is_active', true)
        .or(`start_date.is.null,start_date.lte.${today}`)
        .or(`end_date.is.null,end_date.gte.${today}`)
        .order('sort_order');
      if (error) throw error;
      return data as BannerAd[];
    },
    staleTime: 5 * 60 * 1000,
  });

  const topAds = ads?.filter(a => a.position === 'top') ?? [];
  const bottomAds = ads?.filter(a => a.position === 'bottom') ?? [];

  return {
    topAds: topAds.length > 0 ? topAds : fallbackTopAds,
    bottomAds: bottomAds.length > 0 ? bottomAds : fallbackBottomAds,
    isLoading,
    error,
    isUsingFallback: !ads || ads.length === 0,
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

export interface AdClickDetail {
  id: string;
  ad_id: string;
  user_id: string | null;
  clicked_at: string | null;
  username: string | null;
  headshot_url: string | null;
  ad_label: string | null;
}

export function useAdClickDetails() {
  return useQuery({
    queryKey: ['ad-click-details'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('ad_clicks')
        .select('id, ad_id, user_id, clicked_at')
        .order('clicked_at', { ascending: false })
        .limit(500);
      if (error) throw error;

      // Get unique user_ids to fetch profiles
      const userIds = [...new Set((data ?? []).map(d => d.user_id).filter(Boolean))] as string[];
      let profileMap: Record<string, { username: string | null; headshot_url: string | null }> = {};
      if (userIds.length > 0) {
        const { data: profiles } = await supabase
          .from('profiles')
          .select('user_id, username, headshot_url')
          .in('user_id', userIds);
        profileMap = Object.fromEntries((profiles ?? []).map(p => [p.user_id, { username: p.username, headshot_url: p.headshot_url }]));
      }

      return (data ?? []).map(click => ({
        ...click,
        username: click.user_id ? profileMap[click.user_id]?.username ?? null : null,
        headshot_url: click.user_id ? profileMap[click.user_id]?.headshot_url ?? null : null,
        ad_label: null, // will be enriched in the component
      })) as AdClickDetail[];
    },
  });
}

export async function recordAdClick(adId: string, userId?: string) {
  await supabase.from('ad_clicks').insert({
    ad_id: adId,
    user_id: userId || null,
  });
}