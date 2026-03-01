import { useAnalyticsDashboard } from '@/hooks/useAnalyticsDashboard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Eye, Users, MousePointer, Zap, Clock, TrendingUp, Globe } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, AreaChart, Area } from 'recharts';
import { Skeleton } from '@/components/ui/skeleton';

export function SiteAnalyticsDashboard() {
  const { data, isLoading } = useAnalyticsDashboard();

  if (isLoading) {
    return (
      <div className="space-y-6 w-full">
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map(i => <Skeleton key={i} className="h-24" />)}
        </div>
        <Skeleton className="h-64" />
      </div>
    );
  }

  if (!data) return <p className="text-muted-foreground">No analytics data yet.</p>;

  return (
    <div className="space-y-6 w-full">
      <h2 className="text-xl font-bold text-foreground">Site Analytics</h2>

      {/* Overview Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <StatCard icon={<Eye className="h-5 w-5" />} label="Today Views" value={data.todayViews} sub={`${data.todayUnique} unique`} color="text-blue-500" />
        <StatCard icon={<TrendingUp className="h-5 w-5" />} label="This Week" value={data.weekViews} sub={`${data.weekUnique} unique`} color="text-green-500" />
        <StatCard icon={<Globe className="h-5 w-5" />} label="This Month" value={data.monthViews} sub={`${data.monthUnique} unique`} color="text-purple-500" />
      </div>

      {/* Daily Views Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Eye className="h-5 w-5 text-blue-500" />
            Daily Page Views (Last 30 Days)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data.dailyViews}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" tickFormatter={d => new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} />
                <YAxis />
                <Tooltip labelFormatter={d => new Date(d).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })} />
                <Area type="monotone" dataKey="views" stroke="hsl(var(--primary))" fill="hsl(var(--primary) / 0.2)" name="Views" />
                <Area type="monotone" dataKey="unique" stroke="hsl(220, 70%, 50%)" fill="hsl(220, 70%, 50%, 0.1)" name="Unique Visitors" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Top Pages & Top Clicks side by side */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Top Pages */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Globe className="h-5 w-5 text-green-500" />
              Top Pages
            </CardTitle>
          </CardHeader>
          <CardContent>
            {data.topPages.length === 0 ? (
              <p className="text-sm text-muted-foreground">No page view data yet.</p>
            ) : (
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data.topPages} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" />
                    <YAxis dataKey="page" type="category" width={120} tick={{ fontSize: 11 }} />
                    <Tooltip />
                    <Bar dataKey="views" fill="hsl(var(--primary))" name="Views" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Top Clicks */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <MousePointer className="h-5 w-5 text-orange-500" />
              Top Clicks
            </CardTitle>
          </CardHeader>
          <CardContent>
            {data.topClicks.length === 0 ? (
              <p className="text-sm text-muted-foreground">No click data yet. Click tracking will populate as users interact.</p>
            ) : (
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data.topClicks} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" />
                    <YAxis dataKey="name" type="category" width={120} tick={{ fontSize: 11 }} />
                    <Tooltip />
                    <Bar dataKey="count" fill="hsl(25, 95%, 53%)" name="Clicks" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Feature Usage & Hourly Activity */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Feature Usage */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Zap className="h-5 w-5 text-yellow-500" />
              Feature Usage
            </CardTitle>
          </CardHeader>
          <CardContent>
            {data.featureUsage.length === 0 ? (
              <p className="text-sm text-muted-foreground">No feature usage data yet.</p>
            ) : (
              <ul className="space-y-2">
                {data.featureUsage.map(f => (
                  <li key={f.name} className="flex justify-between items-center text-sm">
                    <span className="text-foreground font-medium truncate mr-2">{f.name}</span>
                    <span className="text-muted-foreground tabular-nums">{f.count}</span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        {/* Hourly Activity */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Clock className="h-5 w-5 text-indigo-500" />
              Activity by Hour
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.hourlyActivity}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="hour" tickFormatter={h => `${h}:00`} />
                  <YAxis />
                  <Tooltip labelFormatter={h => `${h}:00 - ${Number(h) + 1}:00`} />
                  <Bar dataKey="count" fill="hsl(var(--primary))" name="Events" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function StatCard({ icon, label, value, sub, color }: { icon: React.ReactNode; label: string; value: number; sub: string; color: string }) {
  return (
    <Card>
      <CardContent className="p-4 flex items-center gap-3">
        <div className={color}>{icon}</div>
        <div>
          <p className="text-2xl font-bold">{value.toLocaleString()}</p>
          <p className="text-xs text-muted-foreground">{label}</p>
          <p className="text-xs text-muted-foreground">{sub}</p>
        </div>
      </CardContent>
    </Card>
  );
}
