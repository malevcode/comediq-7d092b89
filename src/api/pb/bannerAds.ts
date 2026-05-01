import { pb } from '@/integrations/pocketbase/client';
import type { BannerAd } from '@/hooks/useBannerAds';

export type { BannerAd };

export async function fetchActiveBannerAds(): Promise<BannerAd[]> {
  const today = new Date().toISOString().split('T')[0];
  const data = await pb.collection('banner_ads').getFullList({
    filter: `is_active = true && (start_date = "" || start_date = null || start_date <= "${today}") && (end_date = "" || end_date = null || end_date >= "${today}")`,
    sort: '+sort_order',
  });
  return data as unknown as BannerAd[];
}

export async function fetchAllBannerAds(): Promise<BannerAd[]> {
  const data = await pb.collection('banner_ads').getFullList({
    sort: '+position,+sort_order',
  });
  return data as unknown as BannerAd[];
}

export async function recordAdClick(adId: string, userId?: string, placement?: string) {
  await pb.collection('ad_clicks').create({
    ad_id: adId,
    user_id: userId || null,
    placement: placement || 'banner',
    clicked_at: new Date().toISOString(),
  });
}
