import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useUserWorkHistory, useUserWorkStats } from '@/hooks/useWorkHistory';
import { Briefcase, MapPin, Star, Calendar, TrendingUp } from 'lucide-react';
import { format } from 'date-fns';

interface WorkHistorySectionProps {
  userId: string;
}

const WorkHistorySection = ({ userId }: WorkHistorySectionProps) => {
  const { data: workHistory = [], isLoading: historyLoading } = useUserWorkHistory(userId);
  const { data: stats, isLoading: statsLoading } = useUserWorkStats(userId);

  if (historyLoading || statsLoading) {
    return (
      <div className="space-y-6">
        <Card className="border-0 bg-[#07111f]/2 text-white shadow-[0_18px_60px_rgba(4,20,55,0.18)] backdrop-blur-xl transition-all duration-300 hover:-translate-y-0.5 hover:scale-[1.03] hover:bg-[#07111f]/5">
          <CardContent className="p-8 text-center">
            <p className="text-white/60">Loading work history...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!stats || stats.total_gigs === 0) {
    return (
      <Card className="border-0 bg-[#07111f]/2 text-white shadow-[0_18px_60px_rgba(4,20,55,0.18)] backdrop-blur-xl transition-all duration-300 hover:-translate-y-0.5 hover:scale-[1.03] hover:bg-[#07111f]/5">
        <CardContent className="p-8 text-center">
          <Briefcase className="h-12 w-12 text-white/42 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-white mb-2">No work history yet</h3>
          <p className="text-white/60">
            Complete gigs to build your verified work experience
          </p>
        </CardContent>
      </Card>
    );
  }

  const topRoles = Object.entries(stats.role_breakdown)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5);

  return (
    <div className="space-y-6">
      {/* Stats Overview */}
      <Card className="border-0 bg-[#07111f]/2 text-white shadow-[0_18px_60px_rgba(4,20,55,0.18)] backdrop-blur-xl transition-all duration-300 hover:-translate-y-0.5 hover:scale-[1.03] hover:bg-[#07111f]/5">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Career Stats
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-white/8 rounded-lg">
              <p className="text-3xl font-bold text-[#8ec5ff]">{stats.total_gigs}</p>
              <p className="text-sm text-white/60">Total Gigs</p>
            </div>
            <div className="text-center p-4 bg-white/8 rounded-lg">
              <p className="text-3xl font-bold text-[#8ec5ff]">{stats.performer_gigs}</p>
              <p className="text-sm text-white/60">Performer</p>
            </div>
            <div className="text-center p-4 bg-white/8 rounded-lg">
              <p className="text-3xl font-bold text-[#8ec5ff]">{stats.crew_gigs}</p>
              <p className="text-sm text-white/60">Crew</p>
            </div>
            {stats.average_rating && (
              <div className="text-center p-4 bg-white/8 rounded-lg">
                <p className="text-3xl font-bold text-yellow-600 flex items-center justify-center gap-1">
                  {stats.average_rating.toFixed(1)} <Star className="h-5 w-5 fill-current" />
                </p>
                <p className="text-sm text-white/60">Avg Rating</p>
              </div>
            )}
          </div>

          {/* Top Roles */}
          <div className="mt-6">
            <h4 className="font-semibold mb-3">Role Experience</h4>
            <div className="space-y-2">
              {topRoles.map(([role, count]) => (
                <div key={role} className="flex items-center justify-between">
                  <span className="text-sm capitalize">{role.replace(/_/g, ' ')}</span>
                  <Badge variant="secondary">{count} show{count !== 1 ? 's' : ''}</Badge>
                </div>
              ))}
            </div>
          </div>

          {/* Venues */}
          {stats.venues_worked.length > 0 && (
            <div className="mt-6">
              <h4 className="font-semibold mb-3 flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                Venues Worked ({stats.venues_worked.length})
              </h4>
              <div className="flex flex-wrap gap-2">
                {stats.venues_worked.slice(0, 8).map((venue) => (
                  <Badge key={venue} variant="outline" className="text-xs">
                    {venue}
                  </Badge>
                ))}
                {stats.venues_worked.length > 8 && (
                  <Badge variant="outline" className="text-xs">
                    +{stats.venues_worked.length - 8} more
                  </Badge>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recent Work History */}
      <Card className="border-0 bg-[#07111f]/2 text-white shadow-[0_18px_60px_rgba(4,20,55,0.18)] backdrop-blur-xl transition-all duration-300 hover:-translate-y-0.5 hover:scale-[1.03] hover:bg-[#07111f]/5">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Recent Work
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {workHistory.slice(0, 10).map((work) => (
              <div
                key={work.id}
                className="flex items-start gap-4 p-4 rounded-lg bg-white/8 hover:bg-white/12 transition-colors"
              >
                <div className="flex-shrink-0 w-16 text-center">
                  <p className="text-xs text-white/58">
                    {format(new Date(work.show_date), 'MMM')}
                  </p>
                  <p className="text-2xl font-bold text-white">
                    {format(new Date(work.show_date), 'd')}
                  </p>
                  <p className="text-xs text-white/58">
                    {format(new Date(work.show_date), 'yyyy')}
                  </p>
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <h4 className="font-semibold text-white line-clamp-1">
                      {work.show_title}
                    </h4>
                    <Badge 
                      variant={work.role_category === 'performer' ? 'default' : 'secondary'}
                      className="flex-shrink-0"
                    >
                      {work.role_type.replace(/_/g, ' ')}
                    </Badge>
                  </div>
                  
                  <p className="text-sm text-white/60 flex items-center gap-2 mb-2">
                    <MapPin className="h-3 w-3" />
                    {work.venue_name}
                    {work.borough && `, ${work.borough}`}
                  </p>

                  {work.producer_rating && (
                    <div className="flex items-center gap-1 text-sm">
                      <Star className="h-4 w-4 text-yellow-500 fill-current" />
                      <span className="font-medium">{work.producer_rating}</span>
                      <span className="text-white/58">/5</span>
                    </div>
                  )}

                  {work.producer_notes && (
                    <p className="text-sm text-white/60 italic mt-2 line-clamp-2">
                      "{work.producer_notes}"
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>

          {workHistory.length > 10 && (
            <p className="text-center text-sm text-white/58 mt-4">
              Showing 10 of {workHistory.length} gigs
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default WorkHistorySection;
