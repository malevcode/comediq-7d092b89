import { cn } from '@/lib/utils';

interface BusiestDaysChartProps {
  dayStats: { day: string; count: number }[];
  animate?: boolean;
}

const dayOrder = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

const BusiestDaysChart = ({ dayStats, animate = true }: BusiestDaysChartProps) => {
  // Sort by day order
  const sortedStats = [...dayStats]
    .filter(d => dayOrder.includes(d.day))
    .sort((a, b) => dayOrder.indexOf(a.day) - dayOrder.indexOf(b.day));
  
  const maxCount = Math.max(...sortedStats.map(d => d.count));
  const busiestDay = sortedStats.reduce((prev, curr) => 
    curr.count > prev.count ? curr : prev, sortedStats[0]
  );

  return (
    <div className="w-full">
      <div className="flex items-end justify-between gap-2 h-40">
        {sortedStats.map((stat, index) => {
          const percentage = (stat.count / maxCount) * 100;
          const isBusiest = stat.day === busiestDay?.day;
          
          return (
            <div key={stat.day} className="flex flex-col items-center flex-1">
              <span className={cn(
                "text-xs font-bold mb-1 text-comediq-cream",
                isBusiest && "text-yellow-300"
              )}>
                {stat.count}
              </span>
              <div className="w-full h-32 bg-white/10 rounded-t-lg overflow-hidden flex items-end">
                <div
                  className={cn(
                    'w-full rounded-t-lg transition-all duration-1000 ease-out',
                    isBusiest 
                      ? 'bg-gradient-to-t from-yellow-400 to-yellow-300' 
                      : 'bg-gradient-to-t from-comediq-blue-light/80 to-comediq-cream/60'
                  )}
                  style={{
                    height: animate ? `${percentage}%` : '0%',
                    transitionDelay: animate ? `${index * 100}ms` : '0ms',
                  }}
                />
              </div>
              <span className={cn(
                "text-xs mt-2 text-comediq-cream/80",
                isBusiest && "text-yellow-300 font-bold"
              )}>
                {stat.day.slice(0, 3)}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default BusiestDaysChart;
