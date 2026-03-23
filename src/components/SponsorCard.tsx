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
      <CardContent className="p-4 space-y-3">
        <Badge variant="outline" className="text-[10px] text-muted-foreground border-border">
          Sponsored
        </Badge>
        <div className="flex items-center gap-3">
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
                className="h-12 w-12 object-contain rounded-lg"
              />
            </a>
          )}
          <div className="min-w-0">
            <h4 className="font-semibold text-sm text-foreground truncate">{sponsor.label}</h4>
            {sponsor.description && (
              <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">
                {sponsor.description}
              </p>
            )}
          </div>
        </div>
        <Button
          asChild
          className="w-full bg-[#1a5fb4] hover:bg-[#164d94] text-white"
          size="sm"
        >
          <a
            href={sponsor.href}
            target={sponsor.external ? '_blank' : undefined}
            rel={sponsor.external ? 'noopener noreferrer' : undefined}
            onClick={handleClick}
          >
            {sponsor.cta_text || 'Learn More'}
            {sponsor.external && <ExternalLink className="ml-1.5 h-3.5 w-3.5" />}
          </a>
        </Button>
      </CardContent>
    </Card>
  );
}
