import { useAllBannerAds, useAdClickCounts, type BannerAd } from '@/hooks/useBannerAds';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ExternalLink, MousePointerClick, Loader2 } from 'lucide-react';

export function ActiveAdsList() {
  const { data: ads, isLoading } = useAllBannerAds();
  const { data: clickCounts } = useAdClickCounts();
  const clickMap = Object.fromEntries((clickCounts ?? []).map(c => [c.ad_id, c.click_count]));

  const today = new Date().toISOString().split('T')[0];
  const activeAds = (ads ?? []).filter(a => {
    if (!a.is_active) return false;
    if (a.start_date && a.start_date > today) return false;
    if (a.end_date && a.end_date < today) return false;
    return true;
  });

  if (isLoading) return <div className="flex justify-center py-10"><Loader2 className="animate-spin w-8 h-8 text-orange-400" /></div>;

  return (
    <div className="space-y-2">
      {activeAds.map(ad => (
        <Card key={ad.id} className="border-l-4 border-l-green-500">
          <CardContent className="p-3 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0 flex-1">
              {ad.icon_url && <img src={ad.icon_url} alt="" className="w-6 h-6 rounded-full object-cover flex-shrink-0" />}
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-semibold text-sm">{ad.label}</span>
                  <Badge variant={ad.position === 'top' ? 'default' : 'secondary'} className="text-[10px]">{ad.position}</Badge>
                  {ad.external && <ExternalLink className="w-3 h-3 text-muted-foreground" />}
                </div>
                <div className="text-xs text-muted-foreground truncate">{ad.href}</div>
                <div className="flex gap-3 text-xs text-muted-foreground mt-1 flex-wrap">
                  {ad.client_name && <span>Client: {ad.client_name}</span>}
                  {ad.amount_paid != null && <span>${Number(ad.amount_paid).toFixed(2)}</span>}
                  {ad.start_date && <span>From: {ad.start_date}</span>}
                  {ad.end_date && <span>To: {ad.end_date}</span>}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-1 text-xs text-muted-foreground flex-shrink-0">
              <MousePointerClick className="w-3.5 h-3.5" />
              {clickMap[ad.id] ?? 0}
            </div>
          </CardContent>
        </Card>
      ))}
      {activeAds.length === 0 && <div className="text-center text-muted-foreground py-8">No active ads</div>}
    </div>
  );
}
