import { useSponsors, recordSponsorClick } from '@/hooks/useSponsors';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { ExternalLink } from 'lucide-react';

const SponsorSection = () => {
  const { data: sponsors, isLoading } = useSponsors();
  const { user } = useAuth();

  if (isLoading || !sponsors || sponsors.length === 0) return null;

  return (
    <section className="py-12 bg-gradient-to-b from-white to-muted/30">
      <div className="container mx-auto px-4 max-w-4xl">
        <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground text-center mb-6">
          Sponsored By
        </p>
        <div className="space-y-8">
          {sponsors.map((sponsor) => (
            <div
              key={sponsor.id}
              className="flex flex-col md:flex-row items-center gap-6 rounded-2xl border bg-card p-6 md:p-8 shadow-sm"
            >
              {sponsor.icon_url && (
                <a
                  href={sponsor.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => recordSponsorClick(sponsor.id, 'sponsors_section', user?.id)}
                  className="flex-shrink-0"
                >
                  <img
                    src={sponsor.icon_url}
                    alt={sponsor.label}
                    className="h-24 w-auto max-w-[200px] object-contain rounded-lg"
                    loading="lazy"
                  />
                </a>
              )}
              <div className="flex-1 text-center md:text-left space-y-3">
                <h3 className="text-xl font-bold text-foreground">{sponsor.label}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {sponsor.description || '{SPONSOR_BLURB}'}
                </p>
                <Button
                  asChild
                  className="bg-[#1a5fb4] hover:bg-[#164d94] text-white rounded-full px-6"
                >
                  <a
                    href={sponsor.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => recordSponsorClick(sponsor.id, 'sponsors_section', user?.id)}
                  >
                    {sponsor.cta_text || 'Listen Now'}
                    <ExternalLink className="w-4 h-4 ml-1" />
                  </a>
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default SponsorSection;
