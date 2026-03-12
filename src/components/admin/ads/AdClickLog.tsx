import { useState, useMemo } from 'react';
import { useAdClickDetails, useAllBannerAds, type AdClickDetail } from '@/hooks/useBannerAds';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Loader2, MousePointerClick, User } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

export function AdClickLog() {
  const { data: clicks, isLoading } = useAdClickDetails();
  const { data: ads } = useAllBannerAds();
  const [filterAdId, setFilterAdId] = useState<string>('all');

  const adMap = useMemo(() =>
    Object.fromEntries((ads ?? []).map(a => [a.id, a.label])),
    [ads]
  );

  const filtered = useMemo(() => {
    const list = (clicks ?? []).map(c => ({ ...c, ad_label: adMap[c.ad_id] ?? 'Unknown Ad' }));
    if (filterAdId === 'all') return list;
    return list.filter(c => c.ad_id === filterAdId);
  }, [clicks, filterAdId, adMap]);

  if (isLoading) return <div className="flex justify-center py-10"><Loader2 className="animate-spin w-8 h-8 text-orange-400" /></div>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-sm font-semibold flex items-center gap-2">
          <MousePointerClick className="w-4 h-4" /> Click Log ({filtered.length})
        </h3>
        <Select value={filterAdId} onValueChange={setFilterAdId}>
          <SelectTrigger className="w-48 h-8 text-xs">
            <SelectValue placeholder="Filter by ad" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Ads</SelectItem>
            {(ads ?? []).map(a => (
              <SelectItem key={a.id} value={a.id}>{a.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-1.5 max-h-[600px] overflow-y-auto">
        {filtered.length === 0 && (
          <div className="text-center text-muted-foreground py-8">No clicks recorded yet</div>
        )}
        {filtered.map(click => (
          <div key={click.id} className="flex items-center gap-3 p-2.5 rounded-lg border bg-card hover:bg-muted/50 transition-colors">
            <Avatar className="w-7 h-7">
              {click.headshot_url && <AvatarImage src={click.headshot_url} />}
              <AvatarFallback className="text-[10px]">
                {click.username ? click.username[0].toUpperCase() : <User className="w-3 h-3" />}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-sm font-medium">
                  {click.username || 'Anonymous'}
                </span>
                <span className="text-xs text-muted-foreground">clicked</span>
                <Badge variant="outline" className="text-[10px]">{click.ad_label}</Badge>
              </div>
            </div>
            <span className="text-[11px] text-muted-foreground flex-shrink-0">
              {click.clicked_at ? formatDistanceToNow(new Date(click.clicked_at), { addSuffix: true }) : '—'}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
