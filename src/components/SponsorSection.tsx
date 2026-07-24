import { useSponsorAd, recordAdClick } from '@/hooks/useBannerAds';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ExternalLink } from 'lucide-react';

export default function SponsorSection() {
  const { data: sponsor, isLoading } = useSponsorAd();
  const { user, subscriptionPlan } = useAuth();

  if (subscriptionPlan !== 'free') return null;
  if (isLoading || !sponsor) return null;

  const handleClick = () => {
    recordAdClick(sponsor.id, user?.id, 'sponsors_section');
  };

  return (
    <section className="px-4 py-8">
      <div className="container mx-auto px-4 max-w-3xl">
        <div className="flex items-center justify-center gap-2 mb-4">
          <Badge variant="outline" className="border-white/45 bg-white/80 text-xs text-muted-foreground backdrop-blur">
            Sponsored
          </Badge>
        </div>
        <Card className="border-white/45 bg-white/88 shadow-[0_18px_60px_rgba(4,20,55,0.16)] backdrop-blur-xl hover:shadow-[0_22px_70px_rgba(4,20,55,0.2)] transition-shadow">
          <CardContent className="flex flex-col sm:flex-row items-center gap-6 p-6 sm:p-8">
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
                  className="h-20 w-20 sm:h-24 sm:w-24 object-contain rounded-lg"
                />
              </a>
            )}
            <div className="flex-1 text-center sm:text-left space-y-2">
              <h3 className="text-lg font-bold text-foreground">{sponsor.label}</h3>
              {sponsor.description && (
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {sponsor.description}
                </p>
              )}
              <Button
                asChild
                className="bg-[#1a5fb4] hover:bg-[#164d94] text-white mt-2"
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
            </div>
          </CardContent>
        </Card>
      </div>
    </section>
  );
}
