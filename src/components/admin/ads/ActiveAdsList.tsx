import { useState } from 'react';
import { useAllBannerAds, useAdClickCounts, useAdClickDetails, type BannerAd } from '@/hooks/useBannerAds';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ExternalLink, MousePointerClick, Loader2, ChevronDown, User } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

export function ActiveAdsList() {
  const { data: ads, isLoading } = useAllBannerAds();
  const { data: clickCounts } = useAdClickCounts();
  const { data: clickDetails } = useAdClickDetails();
  const clickMap = Object.fromEntries((clickCounts ?? []).map(c => [c.ad_id, c.click_count]));
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const today = new Date().toISOString().split('T')[0];
  const activeAds = (ads ?? []).filter(a => {
    if (!a.is_active) return false;
    if (a.start_date && a.start_date > today) return false;
    if (a.end_date && a.end_date < today) return false;
    return true;
  });

  const getAdClicks = (adId: string) => (clickDetails ?? []).filter(c => c.ad_id === adId);

  const getTopClickers = (adId: string) => {
    const adClicks = getAdClicks(adId);
    const counts: Record<string, { username: string; headshot_url: string | null; count: number }> = {};
    adClicks.forEach(c => {
      const key = c.user_id || 'anon';
      if (!counts[key]) counts[key] = { username: c.username || 'Anonymous', headshot_url: c.headshot_url, count: 0 };
      counts[key].count++;
    });
    return Object.values(counts).sort((a, b) => b.count - a.count).slice(0, 5);
  };

  if (isLoading) return <div className="flex justify-center py-10"><Loader2 className="animate-spin w-8 h-8 text-orange-400" /></div>;

  return (
    <div className="space-y-2">
      {activeAds.map(ad => {
        const adClicks = getAdClicks(ad.id);
        const topClickers = getTopClickers(ad.id);
        return (
          <Collapsible key={ad.id} open={expandedId === ad.id} onOpenChange={open => setExpandedId(open ? ad.id : null)}>
            <Card className="border-l-4 border-l-green-500">
              <CardContent className="p-3">
                <div className="flex items-center justify-between gap-3">
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
                  <CollapsibleTrigger className="flex items-center gap-1 text-xs text-muted-foreground flex-shrink-0 cursor-pointer hover:text-foreground transition-colors">
                    <MousePointerClick className="w-3.5 h-3.5" />
                    {clickMap[ad.id] ?? 0}
                    <ChevronDown className={`w-3.5 h-3.5 transition-transform ${expandedId === ad.id ? 'rotate-180' : ''}`} />
                  </CollapsibleTrigger>
                </div>

                <CollapsibleContent>
                  <div className="mt-3 pt-3 border-t space-y-3">
                    {topClickers.length > 0 && (
                      <div>
                        <h4 className="text-xs font-semibold text-muted-foreground mb-2">Top Clickers</h4>
                        <div className="flex flex-wrap gap-2">
                          {topClickers.map((tc, i) => (
                            <div key={i} className="flex items-center gap-1.5 bg-muted/50 rounded-full px-2 py-1">
                              <Avatar className="w-5 h-5">
                                {tc.headshot_url && <AvatarImage src={tc.headshot_url} />}
                                <AvatarFallback className="text-[8px]">{tc.username[0]?.toUpperCase() || <User className="w-2.5 h-2.5" />}</AvatarFallback>
                              </Avatar>
                              <span className="text-[11px]">{tc.username}</span>
                              <Badge variant="outline" className="text-[9px] h-4">{tc.count}</Badge>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    <div>
                      <h4 className="text-xs font-semibold text-muted-foreground mb-2">Recent Clicks</h4>
                      <div className="space-y-1 max-h-48 overflow-y-auto">
                        {adClicks.slice(0, 15).map(click => (
                          <div key={click.id} className="flex items-center justify-between text-xs py-1">
                            <span>{click.username || 'Anonymous'}</span>
                            <span className="text-muted-foreground">
                              {click.clicked_at ? formatDistanceToNow(new Date(click.clicked_at), { addSuffix: true }) : '—'}
                            </span>
                          </div>
                        ))}
                        {adClicks.length === 0 && <div className="text-xs text-muted-foreground">No clicks yet</div>}
                      </div>
                    </div>
                  </div>
                </CollapsibleContent>
              </CardContent>
            </Card>
          </Collapsible>
        );
      })}
      {activeAds.length === 0 && <div className="text-center text-muted-foreground py-8">No active ads</div>}
    </div>
  );
}