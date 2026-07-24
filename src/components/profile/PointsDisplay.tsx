import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Star, TrendingUp, Zap } from 'lucide-react';
import { usePointsBalance, usePointsHistory } from '@/hooks/usePoints';

const ACTION_LABELS: Record<string, string> = {
  account_creation: 'Welcome Bonus',
  mic_signup: 'Mic Signup',
  mic_verification: 'Verified a Mic',
  mic_claim: 'Claimed a Mic',
  listing_update: 'Updated Listing',
  no_show: 'No-Show Penalty',
};

export default function PointsDisplay() {
  const { data: balance = 0 } = usePointsBalance();
  const { data: history = [] } = usePointsHistory(10);

  return (
    <Card className="border-0 bg-[#07111f]/2 text-white shadow-[0_18px_60px_rgba(4,20,55,0.18)] backdrop-blur-xl transition-all duration-300 hover:-translate-y-0.5 hover:scale-[1.03] hover:bg-[#07111f]/5">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Star className="h-5 w-5 text-yellow-500 fill-yellow-500" />
          Comediq Points
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between p-4 rounded-lg bg-white/10">
          <div>
            <p className="text-3xl font-bold text-white">{balance}</p>
            <p className="text-xs text-white/60">Total Points</p>
          </div>
          <Zap className="h-8 w-8 text-yellow-500" />
        </div>

        {history.length > 0 && (
          <div>
            <p className="text-sm font-medium text-white/60 mb-2 flex items-center gap-1">
              <TrendingUp className="h-3.5 w-3.5" />
              Recent Activity
            </p>
            <div className="space-y-1.5">
              {history.map((entry: any) => (
                <div key={entry.id} className="flex items-center justify-between text-sm py-1.5 border-b border-white/10 last:border-0">
                  <span className="text-white/64">
                    {ACTION_LABELS[entry.action_type] || entry.action_type}
                  </span>
                  <Badge
                    variant={entry.amount > 0 ? 'default' : 'destructive'}
                    className="text-xs font-mono"
                  >
                    {entry.amount > 0 ? '+' : ''}{entry.amount}
                  </Badge>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
