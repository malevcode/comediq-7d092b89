import { useQuery } from '@tanstack/react-query';
import { fetchActiveBannerAds, fetchAllBannerAds, recordAdClick as pbRecordAdClick } from '@/api/pb/bannerAds';
import type { BannerAd } from '@/api/pb/bannerAds';

export type { BannerAd };

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
    queryFn: fetchActiveBannerAds,
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
    queryFn: fetchAllBannerAds,
  });
}

export function useAdClickCounts() {
  return useQuery({
    queryKey: ['ad-click-counts'],
    queryFn: async () => [] as { ad_id: string; click_count: number }[],
  });
}

export async function recordAdClick(adId: string, userId?: string, placement?: string) {
  await pbRecordAdClick(adId, userId, placement);
}

export function useSponsorAd() {
  const today = new Date().toISOString().split('T')[0];

  return useQuery({
    queryKey: ['sponsor-ad', today],
    queryFn: async () => {
      const ads = await fetchActiveBannerAds();
      return ads.find(a => a.position === 'sponsor') ?? null;
    },
    staleTime: 5 * 60 * 1000,
  });
}
