import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MapPin, TrendingUp } from 'lucide-react';
import { BoroughStats } from './hooks/useMicAnalytics';

interface BoroughDistributionCardProps {
  boroughStats: BoroughStats[];
}

export const BoroughDistributionCard = ({ boroughStats }: BoroughDistributionCardProps) => {
  const getBoroughColor = (borough: string) => {
    const colors = {
      'Manhattan': 'bg-cyan-500',
      'Brooklyn': 'bg-amber-600',
      'Queens': 'bg-purple-600',
      'Bronx': 'bg-orange-600',
      'Staten Island': 'bg-gray-500',
      'Unknown': 'bg-gray-400',
    };
    return colors[borough as keyof typeof colors] || 'bg-gray-400';
  };

  const getBoroughAbbreviation = (borough: string) => {
    const abbreviations = {
      'Manhattan': 'M',
      'Brooklyn': 'B',
      'Queens': 'Q',
      'Bronx': 'X',
      'Staten Island': 'S',
      'Unknown': '?',
    };
    return abbreviations[borough as keyof typeof abbreviations] || '?';
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MapPin className="w-5 h-5 text-blue-600" />
          Borough Distribution
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Borough Bars */}
          <div className="space-y-3">
            {boroughStats.map((stat) => (
              <div key={stat.borough} className="space-y-2">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <div className={`w-3 h-3 rounded-full ${getBoroughColor(stat.borough)}`} />
                    <span className="font-medium text-sm">{stat.borough}</span>
                    <Badge variant="outline" className="text-xs">
                      {getBoroughAbbreviation(stat.borough)}
                    </Badge>
                  </div>
                  <div className="text-sm text-gray-600">
                    {stat.count} mics ({stat.percentage.toFixed(1)}%)
                  </div>
                </div>
                
                {/* Progress Bar */}
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className={`${getBoroughColor(stat.borough)} h-2 rounded-full transition-all duration-300`}
                    style={{ width: `${stat.percentage}%` }}
                  />
                </div>
                
                {/* Active/Inactive Breakdown */}
                <div className="flex justify-between text-xs text-gray-500">
                  <span>Active: {stat.activeCount}</span>
                  <span>Inactive: {stat.inactiveCount}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Summary Stats */}
          <div className="grid grid-cols-2 gap-4 pt-4 border-t">
            <div className="text-center">
              <div className="text-lg font-bold text-green-600">
                {boroughStats.reduce((sum, stat) => sum + stat.activeCount, 0)}
              </div>
              <div className="text-sm text-gray-600">Total Active</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-gray-600">
                {boroughStats.reduce((sum, stat) => sum + stat.inactiveCount, 0)}
              </div>
              <div className="text-sm text-gray-600">Total Inactive</div>
            </div>
          </div>

          {/* Insights */}
          <div className="text-sm text-gray-600 space-y-1">
            {boroughStats.length > 0 && (
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-blue-500" />
                <span>
                  {boroughStats[0].borough} has the most mics ({boroughStats[0].count})
                </span>
              </div>
            )}
            {boroughStats.find(stat => stat.borough === 'Unknown') && (
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-red-500" />
                <span>
                  {boroughStats.find(stat => stat.borough === 'Unknown')?.count} mics have unknown borough
                </span>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}; 