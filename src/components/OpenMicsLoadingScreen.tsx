import { useWeeklyTopMics } from '@/hooks/useWeeklyTopMics';
import { SponsorCard } from '@/components/SponsorCard';
import { MicOfTheDayCard } from '@/components/MicOfTheDayCard';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ThumbsUp, MapPin, Clock, Calendar } from 'lucide-react';
import { Link } from 'react-router-dom';
import { slugify } from '@/utils/slugify';

export default function OpenMicsLoadingScreen() {
  const { data: topMics = [] } = useWeeklyTopMics();

  return (
    <div className="min-h-screen bg-gradient-to-br from-cyan-50 via-white to-orange-50 flex flex-col items-center justify-center px-4 py-12">
      {/* Spinner */}
      <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary mx-auto mb-4" />
      <p className="text-muted-foreground mb-8">Loading open mics...</p>

      {topMics.length > 0 && (
        <div className="w-full max-w-md space-y-4">
          <h2 className="text-lg font-bold text-foreground text-center">
            🔥 Top Liked Mics This Week
          </h2>
          <div className="space-y-2">
            {topMics.map((mic) => (
              <Link
                key={mic.id}
                to={`/mics/${slugify(mic.venue_name || '')}-${slugify(mic.neighborhood || '')}`}
                className="block"
              >
                <Card className="border-border bg-card hover:shadow-md transition-shadow cursor-pointer">
                  <CardContent className="p-3 flex items-center gap-3">
                    <div className="flex items-center justify-center h-8 w-8 rounded-full bg-primary/10 text-primary font-bold text-sm shrink-0">
                      #{mic.rank}
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="font-semibold text-sm text-foreground truncate">
                        {mic.mic_name}
                      </h3>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground mt-0.5">
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
                    <Badge variant="secondary" className="shrink-0 text-xs gap-1">
                      <ThumbsUp className="h-3 w-3" />
                      {mic.like_count}
                    </Badge>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Sponsor + Mic of the Day */}
      <div className="w-full max-w-md mt-6 grid grid-cols-2 gap-2">
        <SponsorCard placement="loading_screen" />
        <MicOfTheDayCard />
      </div>
    </div>
  );
}
