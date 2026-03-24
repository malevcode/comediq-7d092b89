import { useAuth } from '@/contexts/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Flame } from 'lucide-react';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export function PerformanceHeatmap() {
  const { user } = useAuth();

  const { data: checkins = [] } = useQuery({
    queryKey: ['checkins', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const oneYearAgo = new Date();
      oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);

      const { data, error } = await supabase
        .from('user_mic_checkins')
        .select('checked_in_at')
        .eq('user_id', user.id)
        .gte('checked_in_at', oneYearAgo.toISOString())
        .order('checked_in_at', { ascending: true });

      if (error) throw error;
      return data || [];
    },
    enabled: !!user,
  });

  if (!user) return null;

  // Build date -> count map
  const dateCounts: Record<string, number> = {};
  checkins.forEach((c: any) => {
    const date = new Date(c.checked_in_at).toISOString().split('T')[0];
    dateCounts[date] = (dateCounts[date] || 0) + 1;
  });

  // Generate last 365 days grid
  const today = new Date();
  const days: { date: string; count: number; dayOfWeek: number }[] = [];
  for (let i = 364; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().split('T')[0];
    days.push({ date: dateStr, count: dateCounts[dateStr] || 0, dayOfWeek: d.getDay() });
  }

  // Group into weeks
  const weeks: typeof days[] = [];
  let currentWeek: typeof days = [];
  days.forEach((day, i) => {
    if (i === 0 && day.dayOfWeek !== 0) {
      // Pad first week
      for (let j = 0; j < day.dayOfWeek; j++) {
        currentWeek.push({ date: '', count: 0, dayOfWeek: j });
      }
    }
    currentWeek.push(day);
    if (day.dayOfWeek === 6 || i === days.length - 1) {
      weeks.push(currentWeek);
      currentWeek = [];
    }
  });

  const getColor = (count: number) => {
    if (count === 0) return 'bg-muted';
    if (count === 1) return 'bg-primary/30';
    if (count === 2) return 'bg-primary/50';
    if (count === 3) return 'bg-primary/70';
    return 'bg-primary';
  };

  const totalCheckins = Object.values(dateCounts).reduce((a, b) => a + b, 0);

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center gap-2">
          <Flame className="h-4 w-4 text-primary" />
          Performance Heat Map
          <span className="text-xs font-normal text-muted-foreground ml-auto">
            {totalCheckins} sets this year
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <div className="flex gap-[2px] min-w-[700px]">
            {/* Day labels */}
            <div className="flex flex-col gap-[2px] mr-1">
              {DAYS.map((d, i) => (
                <div key={i} className="h-[10px] text-[8px] text-muted-foreground leading-[10px] w-6">
                  {i % 2 === 1 ? d : ''}
                </div>
              ))}
            </div>
            {weeks.map((week, wi) => (
              <div key={wi} className="flex flex-col gap-[2px]">
                {week.map((day, di) => (
                  <div
                    key={di}
                    className={`h-[10px] w-[10px] rounded-[2px] ${day.date ? getColor(day.count) : 'bg-transparent'}`}
                    title={day.date ? `${day.date}: ${day.count} set${day.count !== 1 ? 's' : ''}` : ''}
                  />
                ))}
              </div>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-1 mt-2 text-[10px] text-muted-foreground justify-end">
          <span>Less</span>
          <div className="h-[10px] w-[10px] rounded-[2px] bg-muted" />
          <div className="h-[10px] w-[10px] rounded-[2px] bg-primary/30" />
          <div className="h-[10px] w-[10px] rounded-[2px] bg-primary/50" />
          <div className="h-[10px] w-[10px] rounded-[2px] bg-primary/70" />
          <div className="h-[10px] w-[10px] rounded-[2px] bg-primary" />
          <span>More</span>
        </div>
      </CardContent>
    </Card>
  );
}
