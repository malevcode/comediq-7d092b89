import { useWeeklyTopMics } from '@/hooks/useWeeklyTopMics';
import { SponsorCard } from '@/components/SponsorCard';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ThumbsUp, MapPin, Clock, Calendar } from 'lucide-react';
import { Link } from 'react-router-dom';
import { slugify } from '@/utils/slugify';
import PageHeader from '@/components/PageHeader';

export default function TopMics() {
  const { data: topMics = [], isLoading } = useWeeklyTopMics();

  return (
    <>
      <PageHeader />
      <div className="pt-28 px-4 max-w-2xl mx-auto pb-20">
        <div className="mb-3">
          <h1 className="text-lg font-bold text-foreground">🔥 Top Mics This Week</h1>
          <p className="text-xs text-muted-foreground mt-0.5">Most liked open mics, updated every Monday.</p>
        </div>

        <div className="space-y-2">
          {isLoading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
            </div>
          ) : topMics.length === 0 ? (
            <p className="text-center text-muted-foreground py-12">
              No rankings yet — check back after Monday!
            </p>
          ) : (
          topMics.map((mic) => {
            const to = mic.to || `/mics/${slugify(mic.venue_name || '')}-${slugify(mic.neighborhood || '')}`;
            return (
              <Link
                key={mic.id}
                to={to}
                className="block"
              >
                <Card className="border-border bg-card hover:shadow-md transition-shadow cursor-pointer">
                  <CardContent className="p-2.5 flex items-center gap-3">
                    <div className="flex items-center justify-center h-8 w-8 rounded-full bg-primary/10 text-primary font-bold text-sm shrink-0">
                      #{mic.rank}
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="font-semibold text-sm text-foreground truncate">
                        {mic.mic_name}
                      </h3>
                      <div className="flex flex-wrap items-center gap-2 text-[11px] text-muted-foreground mt-0.5">
                        {mic.venue_name && (
                          <span className="flex items-center gap-0.5 truncate">
                            <MapPin className="h-3 w-3 shrink-0" />
                            {mic.venue_name}
                          </span>
                        )}
                        {mic.day && (
                          <span className="flex items-center gap-0.5">
                            <Calendar className="h-3 w-3 shrink-0" />
                            {mic.day}
                          </span>
                        )}
                        {mic.start_time && (
                          <span className="flex items-center gap-0.5">
                            <Clock className="h-3 w-3 shrink-0" />
                            {mic.start_time}
                          </span>
                        )}
                      </div>
                    </div>
                    <Badge variant="secondary" className="shrink-0 gap-1 text-xs">
                      <ThumbsUp className="h-3 w-3" />
                      {mic.like_count}
                    </Badge>
                  </CardContent>
                </Card>
              </Link>
            )}
          ))}
        </div>

        <div className="mt-3">
          <SponsorCard placement="loading_screen" />
        </div>
      </div>
    </>
  );
}
