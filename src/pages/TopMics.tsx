import { useWeeklyTopMics } from '@/hooks/useWeeklyTopMics';
import { SponsorCard } from '@/components/SponsorCard';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ThumbsUp, MapPin, Clock, Calendar, Flame } from 'lucide-react';
import { Link } from 'react-router-dom';
import { slugify } from '@/utils/slugify';
import PageHeader from '@/components/PageHeader';

export default function TopMics() {
  const { data: topMics = [], isLoading } = useWeeklyTopMics();

  return (
    <div className="pt-28 px-4 max-w-2xl mx-auto pb-24">
      <PageHeader
        title="🔥 Top Mics This Week"
        subtitle="The most liked open mics this week, updated every Monday."
      />

      <div className="mt-6 space-y-3">
        {isLoading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary" />
          </div>
        ) : topMics.length === 0 ? (
          <p className="text-center text-muted-foreground py-12">
            No rankings yet — check back after Monday!
          </p>
        ) : (
          topMics.map((mic) => (
            <Link
              key={mic.id}
              to={`/mics/${slugify(mic.venue_name || '')}-${slugify(mic.neighborhood || '')}`}
              className="block"
            >
              <Card className="border-border bg-card hover:shadow-md transition-shadow cursor-pointer">
                <CardContent className="p-4 flex items-center gap-4">
                  <div className="flex items-center justify-center h-10 w-10 rounded-full bg-primary/10 text-primary font-bold text-base shrink-0">
                    #{mic.rank}
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="font-semibold text-foreground truncate">
                      {mic.mic_name}
                    </h3>
                    <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground mt-1">
                      {mic.venue_name && (
                        <span className="flex items-center gap-1 truncate">
                          <MapPin className="h-3 w-3 shrink-0" />
                          {mic.venue_name}
                        </span>
                      )}
                      {mic.day && (
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3 shrink-0" />
                          {mic.day}
                        </span>
                      )}
                      {mic.start_time && (
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3 shrink-0" />
                          {mic.start_time}
                        </span>
                      )}
                    </div>
                  </div>
                  <Badge variant="secondary" className="shrink-0 gap-1">
                    <ThumbsUp className="h-3 w-3" />
                    {mic.like_count}
                  </Badge>
                </CardContent>
              </Card>
            </Link>
          ))
        )}
      </div>

      <div className="mt-6">
        <SponsorCard placement="loading_screen" />
      </div>
    </div>
  );
}
