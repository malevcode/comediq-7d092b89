import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar, Clock } from 'lucide-react';
import { DayTimeStats } from './hooks/useMicAnalytics';

interface DayTimeHeatmapCardProps {
  dayTimeStats: DayTimeStats[];
}

export const DayTimeHeatmapCard = ({ dayTimeStats }: DayTimeHeatmapCardProps) => {
  const timeSlots = [
    { key: 'morning', label: 'Morning', color: 'bg-blue-100 text-blue-800', icon: '🌅' },
    { key: 'afternoon', label: 'Afternoon', color: 'bg-yellow-100 text-yellow-800', icon: '☀️' },
    { key: 'evening', label: 'Evening', color: 'bg-orange-100 text-orange-800', icon: '🌆' },
    { key: 'lateNight', label: 'Late Night', color: 'bg-purple-100 text-purple-800', icon: '🌙' },
  ];

  const getIntensityColor = (count: number, maxCount: number) => {
    if (count === 0) return 'bg-gray-100';
    if (count <= maxCount * 0.25) return 'bg-blue-200';
    if (count <= maxCount * 0.5) return 'bg-blue-300';
    if (count <= maxCount * 0.75) return 'bg-blue-400';
    return 'bg-blue-500 text-white';
  };

  const maxCount = Math.max(...dayTimeStats.map(day => 
    Math.max(day.timeSlots.morning, day.timeSlots.afternoon, day.timeSlots.evening, day.timeSlots.lateNight)
  ));

  const getDayAbbreviation = (day: string) => {
    return day.substring(0, 3);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="w-5 h-5 text-blue-600" />
          Day/Time Heatmap
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Time Slot Legend */}
          <div className="flex flex-wrap gap-2">
            {timeSlots.map((slot) => (
              <Badge key={slot.key} className={`${slot.color} flex items-center gap-1`}>
                <span>{slot.icon}</span>
                {slot.label}
              </Badge>
            ))}
          </div>

          {/* Heatmap Grid */}
          <div className="space-y-2">
            {/* Header Row */}
            <div className="grid grid-cols-5 gap-1 text-xs font-medium">
              <div className="text-center text-gray-600">Day</div>
              {timeSlots.map((slot) => (
                <div key={slot.key} className="text-center text-gray-600">
                  {slot.icon}
                </div>
              ))}
            </div>

            {/* Data Rows */}
            {dayTimeStats.map((day) => (
              <div key={day.day} className="grid grid-cols-5 gap-1">
                <div className="text-sm font-medium text-gray-700 flex items-center justify-center">
                  {getDayAbbreviation(day.day)}
                </div>
                {timeSlots.map((slot) => {
                  const count = day.timeSlots[slot.key as keyof typeof day.timeSlots];
                  return (
                    <div
                      key={slot.key}
                      className={`
                        ${getIntensityColor(count, maxCount)}
                        rounded p-2 text-center text-xs font-medium transition-all duration-200
                        ${count > 0 ? 'cursor-pointer hover:scale-105' : ''}
                      `}
                      title={`${day.day} ${slot.label}: ${count} mics`}
                    >
                      {count > 0 ? count : '-'}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>

          {/* Summary Stats */}
          <div className="grid grid-cols-2 gap-4 pt-4 border-t">
            <div className="text-center">
              <div className="text-lg font-bold text-blue-600">
                {dayTimeStats.reduce((sum, day) => sum + day.total, 0)}
              </div>
              <div className="text-sm text-gray-600">Total Mics</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-green-600">
                {Math.max(...dayTimeStats.map(day => day.total))}
              </div>
              <div className="text-sm text-gray-600">Busiest Day</div>
            </div>
          </div>

          {/* Insights */}
          <div className="text-sm text-gray-600 space-y-1">
            {(() => {
              const busiestDay = dayTimeStats.reduce((max, day) => 
                day.total > max.total ? day : max
              );
              const busiestTimeSlot = timeSlots.reduce((max, slot) => {
                const total = dayTimeStats.reduce((sum, day) => 
                  sum + day.timeSlots[slot.key as keyof typeof day.timeSlots], 0
                );
                return total > (max as any).total ? { ...slot, total } : max;
              }, { ...timeSlots[0], total: 0 } as any);

              return (
                <>
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-blue-500" />
                    <span>
                      {busiestDay.day} is the busiest day ({busiestDay.total} mics)
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span>{(busiestTimeSlot as any).icon}</span>
                    <span>
                      {(busiestTimeSlot as any).label} is the most popular time ({(busiestTimeSlot as any).total} mics)
                    </span>
                  </div>
                </>
              );
            })()}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}; 