import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { BarChart3, Users, DollarSign, Activity } from 'lucide-react';
import { VerificationStatusCard } from './VerificationStatusCard';
import { BoroughDistributionCard } from './BoroughDistributionCard';
import { DayTimeHeatmapCard } from './DayTimeHeatmapCard';
import { useMicAnalytics } from './hooks/useMicAnalytics';

interface MicAnalyticsDashboardProps {
  mics: any[];
}

export const MicAnalyticsDashboard = ({ mics }: MicAnalyticsDashboardProps) => {
  const analytics = useMicAnalytics(mics);

  return (
    <div className="space-y-6">
      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Mics</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.totalMics}</div>
            <p className="text-xs text-muted-foreground">
              All mics in database
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Mics</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{analytics.totalActiveMics}</div>
            <p className="text-xs text-muted-foreground">
              {analytics.activePercentage.toFixed(1)}% of total
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Free Mics</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{analytics.freeMics}</div>
            <p className="text-xs text-muted-foreground">
              {analytics.freePercentage.toFixed(1)}% of total
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Unverified</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{analytics.verificationStats.unverified}</div>
            <p className="text-xs text-muted-foreground">
              {analytics.verificationStats.unverifiedPercentage.toFixed(1)}% need verification
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Analytics Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <VerificationStatusCard stats={analytics.verificationStats} />
        <BoroughDistributionCard boroughStats={analytics.boroughStats} />
      </div>

      {/* Day/Time Heatmap - Full Width */}
      <div className="grid grid-cols-1 gap-6">
        <DayTimeHeatmapCard dayTimeStats={analytics.dayTimeStats} />
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="w-5 h-5 text-blue-600" />
            Quick Actions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {analytics.verificationStats.unverified > 0 && (
              <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
                ⚠️ {analytics.verificationStats.unverified} mics need verification
              </Badge>
            )}
            {analytics.verificationStats.verifiedTediously > 0 && (
              <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
                ⏰ {analytics.verificationStats.verifiedTediously} tediously verified (may need re-verification)
              </Badge>
            )}
            {analytics.totalInactiveMics > 0 && (
              <Badge variant="outline" className="bg-gray-50 text-gray-700 border-gray-200">
                🚫 {analytics.totalInactiveMics} inactive mics
              </Badge>
            )}
            {analytics.boroughStats.find(stat => stat.borough === 'Unknown') && (
              <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200">
                🗺️ {analytics.boroughStats.find(stat => stat.borough === 'Unknown')?.count} mics with unknown borough
              </Badge>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}; 