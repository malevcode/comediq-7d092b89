import { Instagram, Youtube, Music2, Twitter, Globe, Award, DollarSign } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { ComedianProfile } from '@/api/profiles';

interface ComedianCardProps {
  comedian: ComedianProfile;
  variant?: 'default' | 'compact';
}

// Order of display for social links
const PLATFORM_ORDER = ['instagram', 'tiktok', 'youtube', 'twitter', 'venmo', 'website'];

export default function ComedianCard({ comedian, variant = 'default' }: ComedianCardProps) {
  const stageName = comedian.stage_name || comedian.username || 'Comedian';
  const initials = stageName.split(' ').map(n => n[0]).join('').toUpperCase();

  const getSocialIcon = (platform: string) => {
    switch (platform) {
      case 'instagram': return <Instagram className="h-4 w-4" />;
      case 'youtube': return <Youtube className="h-4 w-4" />;
      case 'tiktok': return <Music2 className="h-4 w-4" />;
      case 'twitter': return <Twitter className="h-4 w-4" />;
      case 'venmo': return <DollarSign className="h-4 w-4" />;
      case 'website': return <Globe className="h-4 w-4" />;
      default: return <Globe className="h-4 w-4" />;
    }
  };

  const primaryLink = comedian.social_links?.find(link => link.is_primary);
  
  // Sort links by platform order and limit to 5
  const sortedLinks = [...(comedian.social_links || [])]
    .sort((a, b) => {
      const aIndex = PLATFORM_ORDER.indexOf(a.platform);
      const bIndex = PLATFORM_ORDER.indexOf(b.platform);
      return (aIndex === -1 ? 999 : aIndex) - (bIndex === -1 ? 999 : bIndex);
    })
    .slice(0, 5);

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

          {sortedLinks.length > 0 && (
            <div className="flex gap-3 pt-2">
              {sortedLinks.map((link) => (
                <a
                  key={link.platform}
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`transition-colors ${
                    link.platform === 'venmo' 
                      ? 'text-green-600 hover:text-green-700' 
                      : 'text-muted-foreground hover:text-primary'
                  }`}
                  title={link.platform === 'venmo' ? 'Tip Me!' : `@${link.handle}`}
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
