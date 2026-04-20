import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Star } from 'lucide-react';
import { useMicOfTheDay } from '@/hooks/useMicOfTheDay';
import { Link } from 'react-router-dom';
import { slugify } from '@/utils/slugify';

interface MicOfTheDayCardProps {
  className?: string;
  /**
   * If provided, clicking the card calls this handler with the mic's
   * uniqueIdentifier instead of navigating. Used on the OpenMics page
   * to scroll-and-expand within the same view.
   */
  onSelect?: (micUniqueIdentifier: string) => void;
}

export function MicOfTheDayCard({ className = '', onSelect }: MicOfTheDayCardProps) {
  const { mic, isLoading } = useMicOfTheDay();

  if (isLoading || !mic) return null;

  const label = mic.openMic || mic.venueName || 'Mic of the Day';

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
