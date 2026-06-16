import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Star, MapPin, Calendar, ArrowRight, Trophy, Info } from 'lucide-react';
import { useMicOfTheDay } from '@/hooks/useMicOfTheDay';
import { Link, useNavigate } from 'react-router-dom';
import { slugify } from '@/utils/slugify';
import { useAuth } from '@/contexts/AuthContext';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

import { slugify } from '@/utils/slugify';
import { useAuth } from '@/contexts/AuthContext';

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
  const { user } = useAuth();
  const navigate = useNavigate();

  if (isLoading || !mic) return null;

  const label = mic.openMic || mic.venueName || 'Mic of the Day';

  if (variant === 'premium') {
    const handleClick = (e?: React.MouseEvent) => {
      e?.stopPropagation();
      onSelect?.(mic.uniqueIdentifier);
    };

    const handleNominate = (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      if (!user) {
        navigate('/auth');
        return;
      }
      // Scroll/expand the mic so the user can use the in-card Nominate button
      onSelect?.(mic.uniqueIdentifier);
    };

    const card = (
      <Card
        className={`relative overflow-hidden border border-yellow-300/60 border-l-4 border-l-yellow-500 bg-gradient-to-br from-yellow-50 via-amber-50 to-white shadow-sm hover:shadow-md transition-all cursor-pointer ${className}`}
      >
        <CardContent className="p-3 sm:p-3.5">
          {/* Row 1: Mic name • MOTD badge • Sign Up */}
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0 flex-1">
              <h3 className="text-sm sm:text-base font-bold text-foreground leading-tight truncate">
                {label}
              </h3>
              <Badge
                variant="outline"
                className="shrink-0 text-[9px] font-semibold text-yellow-800 border-yellow-500/60 bg-yellow-100/60 gap-0.5 px-1.5 py-0"
              >
                <Star className="h-2.5 w-2.5 fill-yellow-500 text-yellow-500" />
                MIC OF THE DAY
              </Badge>
            </div>
            <Button
              size="sm"
              onClick={handleClick}
              className="shrink-0 bg-gradient-to-r from-yellow-500 to-amber-500 hover:from-yellow-600 hover:to-amber-600 text-white font-semibold shadow-sm gap-1 h-7 px-2.5 text-xs"
            >
              Sign Up
              <ArrowRight className="h-3 w-3" />
            </Button>
          </div>

          {/* Row 2: Location • Start time • Nominate link */}
          <div className="mt-1 flex items-center justify-between gap-2 text-xs text-muted-foreground">
            <div className="flex items-center gap-x-2 gap-y-0.5 min-w-0 flex-wrap">
              {mic.venueName && mic.openMic !== mic.venueName && (
                <span className="flex items-center gap-1 min-w-0">
                  <MapPin className="h-3 w-3 shrink-0" />
                  <span className="truncate">{mic.venueName}</span>
                </span>
              )}
              {mic.startTime && (
                <span className="flex items-center gap-1">
                  <Calendar className="h-3 w-3 shrink-0" />
                  {mic.startTime}
                </span>
              )}
            </div>
            <button
              type="button"
              onClick={handleNominate}
              className="shrink-0 inline-flex items-center gap-1 text-[11px] font-medium text-amber-700 hover:text-amber-900 hover:underline"
            >
              <Trophy className="h-3 w-3" />
              Nominate for tomorrow
            </button>
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
