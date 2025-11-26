import { Instagram, Youtube, Music2, Twitter, Globe, Award } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { ComedianProfile } from '@/api/profiles';

interface ComedianCardProps {
  comedian: ComedianProfile;
  variant?: 'default' | 'compact';
}

export default function ComedianCard({ comedian, variant = 'default' }: ComedianCardProps) {
  const stageName = comedian.stage_name || comedian.username || 'Comedian';
  const initials = stageName.split(' ').map(n => n[0]).join('').toUpperCase();

  const getSocialIcon = (platform: string) => {
    switch (platform) {
      case 'instagram': return <Instagram className="h-4 w-4" />;
      case 'youtube': return <Youtube className="h-4 w-4" />;
      case 'tiktok': return <Music2 className="h-4 w-4" />;
      case 'twitter': return <Twitter className="h-4 w-4" />;
      case 'website': return <Globe className="h-4 w-4" />;
      default: return <Globe className="h-4 w-4" />;
    }
  };

  const primaryLink = comedian.social_links?.find(link => link.is_primary);
  const displayLinks = comedian.social_links?.slice(0, 3) || [];

  if (variant === 'compact') {
    return (
      <div className="flex items-center gap-3">
        <Avatar className="h-12 w-12">
          {comedian.headshot_url ? (
            <AvatarImage src={comedian.headshot_url} alt={stageName} />
          ) : (
            <AvatarFallback>{initials}</AvatarFallback>
          )}
        </Avatar>
        <div className="flex-1 min-w-0">
          <p className="font-semibold truncate">{stageName}</p>
          {comedian.credit && (
            <p className="text-xs text-muted-foreground truncate">{comedian.credit}</p>
          )}
        </div>
      </div>
    );
  }

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex flex-col items-center text-center space-y-4">
          <Avatar className="h-24 w-24 border-4 border-background">
            {comedian.headshot_url ? (
              <AvatarImage src={comedian.headshot_url} alt={stageName} />
            ) : (
              <AvatarFallback className="text-2xl">{initials}</AvatarFallback>
            )}
          </Avatar>

          <div className="space-y-2">
            <h3 className="text-xl font-bold">{stageName}</h3>
            
            {primaryLink && (
              <p className="text-sm text-muted-foreground">@{primaryLink.handle}</p>
            )}

            {comedian.credit && (
              <div className="flex items-center justify-center gap-1 text-sm">
                <Award className="h-4 w-4 text-primary" />
                <span>{comedian.credit}</span>
              </div>
            )}

            {comedian.years_performing !== undefined && comedian.years_performing > 0 && (
              <Badge variant="secondary">
                {comedian.years_performing} {comedian.years_performing === 1 ? 'year' : 'years'} performing
              </Badge>
            )}
          </div>

          {comedian.bio && (
            <p className="text-sm text-muted-foreground line-clamp-3">{comedian.bio}</p>
          )}

          {displayLinks.length > 0 && (
            <div className="flex gap-3 pt-2">
              {displayLinks.map((link) => (
                <a
                  key={link.platform}
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-muted-foreground hover:text-primary transition-colors"
                  title={`@${link.handle}`}
                >
                  {getSocialIcon(link.platform)}
                </a>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
