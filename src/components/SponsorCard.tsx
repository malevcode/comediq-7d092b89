import { useSponsorAd, recordAdClick } from '@/hooks/useBannerAds';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ExternalLink } from 'lucide-react';

interface SponsorCardProps {
  placement: string;
  className?: string;
}

export function SponsorCard({ placement, className = '' }: SponsorCardProps) {
  const { data: sponsor, isLoading } = useSponsorAd();
  const { user } = useAuth();

  if (isLoading || !sponsor) return null;

  const handleClick = () => {
    recordAdClick(sponsor.id, user?.id, placement);
  };

  return (
    <Card className={`border-border bg-card ${className}`}>
      <CardContent className="px-3 py-2 flex items-center gap-2.5">
        <Badge variant="outline" className="text-[9px] text-white/64 border-white/18 bg-white/8 shrink-0 self-start mt-0.5">
          Ad
        </Badge>
        {sponsor.icon_url && (
          <a
            href={sponsor.href}
            target={sponsor.external ? '_blank' : undefined}
            rel={sponsor.external ? 'noopener noreferrer' : undefined}
            onClick={handleClick}
            className="shrink-0"
          >
            <img
              src={sponsor.icon_url}
              alt={sponsor.label}
              className="h-8 w-8 object-contain rounded"
            />
          </a>
        )}
        <a
          href={sponsor.href}
          target={sponsor.external ? '_blank' : undefined}
          rel={sponsor.external ? 'noopener noreferrer' : undefined}
          onClick={handleClick}
          className="min-w-0 flex-1 text-sm font-medium text-current truncate hover:underline"
        >
          {sponsor.label}
          {sponsor.external && <ExternalLink className="inline ml-1 h-3 w-3 text-current opacity-60" />}
        </a>
      </CardContent>
    </Card>
  );
}
