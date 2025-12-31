import { cn } from '@/lib/utils';

interface BoroughBreakdownChartProps {
  boroughStats: { borough: string; count: number }[];
  animate?: boolean;
}

const boroughColors: Record<string, string> = {
  'Manhattan': 'bg-blue-400',
  'Brooklyn': 'bg-purple-400',
  'Queens': 'bg-green-400',
  'Bronx': 'bg-orange-400',
  'Staten Island': 'bg-pink-400',
  'Unknown': 'bg-gray-400',
};

const BoroughBreakdownChart = ({ boroughStats, animate = true }: BoroughBreakdownChartProps) => {
  const maxCount = Math.max(...boroughStats.map(b => b.count));
  
  // Filter to only NYC boroughs
  const nycBoroughs = boroughStats.filter(b => 
    ['Manhattan', 'Brooklyn', 'Queens', 'Bronx', 'Staten Island'].includes(b.borough)
  );

  return (
    <div className="w-full space-y-3">
      {nycBoroughs.map((stat, index) => {
        const percentage = (stat.count / maxCount) * 100;
        
        return (
          <div key={stat.borough} className="space-y-1">
            <div className="flex justify-between text-sm text-comediq-cream/90">
              <span className="font-medium">{stat.borough}</span>
              <span className="font-bold">{stat.count}</span>
            </div>
            <div className="h-6 bg-white/10 rounded-full overflow-hidden">
              <div
                className={cn(
                  'h-full rounded-full transition-all duration-1000 ease-out',
                  boroughColors[stat.borough] || boroughColors['Unknown']
                )}
                style={{
                  width: animate ? `${percentage}%` : '0%',
                  transitionDelay: animate ? `${index * 150}ms` : '0ms',
                }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default BoroughBreakdownChart;
