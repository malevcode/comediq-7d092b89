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

const fallbackTopAds = [
  { label: "6/28 Comediq Book Me Mic at High Line Comedy Club", href: "/open-mics", external: false },
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

// Banner ads disabled to eliminate Supabase egress until billing cycle resets (July 5)
export function useBannerAds() {
  return {
    topAds: fallbackTopAds,
    bottomAds: fallbackBottomAds,
    isLoading: false,
    error: null,
    isUsingFallback: true,
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

// Ad click recording disabled to eliminate Supabase egress until billing cycle resets (July 5)
export async function recordAdClick(_adId: string, _userId?: string, _placement?: string) {}

// Sponsor ad disabled to eliminate Supabase egress until billing cycle resets (July 5)
export function useSponsorAd() {
  return useQuery({
    queryKey: ['sponsor-ad', 'disabled'],
    queryFn: async () => null as BannerAd | null,
    staleTime: Infinity,
  });
}
