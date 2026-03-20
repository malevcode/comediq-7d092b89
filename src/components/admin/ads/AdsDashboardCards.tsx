import { useAllBannerAds, useAdClickCounts } from '@/hooks/useBannerAds';
import { Card, CardContent } from '@/components/ui/card';
import { DollarSign, BarChart3, MousePointerClick, TrendingUp } from 'lucide-react';

export function AdsDashboardCards() {
  const { data: ads } = useAllBannerAds();
  const { data: clicks } = useAdClickCounts();

  const today = new Date().toISOString().split('T')[0];
  const activeAds = (ads ?? []).filter(a => {
    if (!a.is_active) return false;
    if (a.start_date && a.start_date > today) return false;
    if (a.end_date && a.end_date < today) return false;
    return true;
  });

  const totalRevenue = (ads ?? []).reduce((s, a) => s + (Number(a.amount_paid) || 0), 0);
  const totalClicks = (clicks ?? []).reduce((s, c) => s + (c.click_count ?? 0), 0);
  const totalAds = (ads ?? []).length;
  const ctr = totalAds > 0 ? ((totalClicks / Math.max(totalAds, 1)) * 100).toFixed(1) : '0';

  const cards = [
    { label: 'Total Revenue', value: `$${totalRevenue.toFixed(2)}`, icon: DollarSign, color: 'text-green-600' },
    { label: 'Active Ads', value: activeAds.length, icon: BarChart3, color: 'text-blue-600' },
    { label: 'Total Clicks', value: totalClicks, icon: MousePointerClick, color: 'text-orange-600' },
    { label: 'Clicks / Ad', value: ctr, icon: TrendingUp, color: 'text-purple-600' },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
      {cards.map(c => (
        <Card key={c.label}>
          <CardContent className="p-3 flex items-center gap-3">
            <c.icon className={`w-5 h-5 ${c.color} flex-shrink-0`} />
            <div>
              <div className="text-lg font-bold">{c.value}</div>
              <div className="text-[11px] text-muted-foreground">{c.label}</div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
