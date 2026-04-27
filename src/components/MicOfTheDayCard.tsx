import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Star, MapPin, Calendar, ArrowRight } from 'lucide-react';
import { useMicOfTheDay } from '@/hooks/useMicOfTheDay';
import { Link } from 'react-router-dom';
import { slugify } from '@/utils/slugify';

interface MicOfTheDayCardProps {
  className?: string;
  /**
   * Compact (default): single-line pill matching old SponsorCard size.
   * Premium: full-width highlighted card with venue, day, and Sign Up CTA.
   */
  variant?: 'compact' | 'premium';
  /**
   * If provided, clicking the card calls this handler with the mic's
   * uniqueIdentifier instead of navigating. Used on the OpenMics page
   * to scroll-and-expand within the same view.
   */
  onSelect?: (micUniqueIdentifier: string) => void;
}

export function MicOfTheDayCard({
  className = '',
  variant = 'compact',
  onSelect,
}: MicOfTheDayCardProps) {
  const { mic, isLoading } = useMicOfTheDay();

  if (isLoading || !mic) return null;

  const label = mic.openMic || mic.venueName || 'Mic of the Day';

  if (variant === 'premium') {
    const handleClick = () => onSelect?.(mic.uniqueIdentifier);

    const card = (
      <Card
        className={`relative overflow-hidden border-2 border-yellow-400/70 bg-gradient-to-br from-yellow-50 via-amber-50 to-white shadow-[0_4px_20px_-4px_rgba(234,179,8,0.35)] hover:shadow-[0_6px_28px_-4px_rgba(234,179,8,0.5)] transition-all cursor-pointer ${className}`}
      >
        {/* Decorative gold accent stripe */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-yellow-400 via-amber-500 to-yellow-400" />
        <CardContent className="p-3.5 sm:p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <Badge
                variant="outline"
                className="text-[10px] font-semibold text-yellow-800 border-yellow-500/60 bg-yellow-100/60 gap-1 mb-1.5"
              >
                <Star className="h-3 w-3 fill-yellow-500 text-yellow-500" />
                MIC OF THE DAY
              </Badge>
              <h3 className="text-base sm:text-lg font-bold text-foreground leading-tight truncate">
                {label}
              </h3>
              <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-muted-foreground">
                {mic.venueName && mic.openMic !== mic.venueName && (
                  <span className="flex items-center gap-1 min-w-0">
                    <MapPin className="h-3 w-3 shrink-0" />
                    <span className="truncate">{mic.venueName}</span>
                  </span>
                )}
                {mic.day && (
                  <span className="flex items-center gap-1">
                    <Calendar className="h-3 w-3 shrink-0" />
                    {mic.day}
                    {mic.startTime ? ` • ${mic.startTime}` : ''}
                  </span>
                )}
              </div>
            </div>
            <Button
              size="sm"
              onClick={handleClick}
              className="shrink-0 bg-gradient-to-r from-yellow-500 to-amber-500 hover:from-yellow-600 hover:to-amber-600 text-white font-semibold shadow-sm gap-1 h-8 px-3"
            >
              Sign Up
              <ArrowRight className="h-3.5 w-3.5" />
            </Button>
          </div>
        </CardContent>
      </Card>
    );

    if (onSelect) {
      return (
        <button
          type="button"
          onClick={handleClick}
          className="block w-full text-left"
          aria-label={`View ${label} – Mic of the Day`}
        >
          {card}
        </button>
      );
    }

    return (
      <Link
        to={`/mics/${slugify(mic.venueName || '')}-${slugify(mic.neighborhood || '')}`}
        className="block"
        aria-label={`View ${label} – Mic of the Day`}
      >
        {card}
      </Link>
    );
  }

  // Compact variant (legacy)
  const inner = (
    <Card
      className={`border-border bg-card border-l-4 border-l-yellow-500 hover:shadow-md transition-shadow cursor-pointer ${className}`}
    >
      <CardContent className="px-3 py-2 flex items-center gap-2.5">
        <Badge
          variant="outline"
          className="text-[9px] text-yellow-700 border-yellow-500/50 shrink-0 self-start mt-0.5 gap-0.5"
        >
          <Star className="h-2.5 w-2.5 fill-yellow-500 text-yellow-500" />
          Mic of Day
        </Badge>
        <span className="min-w-0 flex-1 text-sm font-medium text-foreground truncate">
          {label}
        </span>
      </CardContent>
    </Card>
  );

  if (onSelect) {
    return (
      <button
        type="button"
        onClick={() => onSelect(mic.uniqueIdentifier)}
        className="block w-full text-left"
        aria-label={`Jump to ${label}`}
      >
        {inner}
      </button>
    );
  }

  return (
    <Link
      to={`/mics/${slugify(mic.venueName || '')}-${slugify(mic.neighborhood || '')}`}
      className="block"
      aria-label={`View ${label}`}
    >
      {inner}
    </Link>
  );
}

export default MicOfTheDayCard;
