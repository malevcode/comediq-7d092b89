import { Check, X, AlertCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { ComedianProfile } from '@/api/profiles';

interface ProfileCompletenessProps {
  profile: ComedianProfile;
  onEditClick?: () => void;
}

interface ProfileItem {
  key: string;
  label: string;
  isComplete: boolean;
  priority: 'required' | 'recommended' | 'optional';
  hint?: string;
}

export default function ProfileCompleteness({ profile, onEditClick }: ProfileCompletenessProps) {
  const socialPlatforms = profile.social_links?.map(l => l.platform) || [];

  const items: ProfileItem[] = [
    {
      key: 'headshot',
      label: 'Headshot',
      isComplete: !!profile.headshot_url,
      priority: 'required',
      hint: 'Add a professional headshot',
    },
    {
      key: 'stage_name',
      label: 'Stage Name',
      isComplete: !!profile.stage_name,
      priority: 'required',
      hint: 'How do you want to be billed?',
    },
    {
      key: 'credit',
      label: 'Credit',
      isComplete: !!profile.credit,
      priority: 'required',
      hint: 'Your biggest credit (e.g., "As seen on...")',
    },
    {
      key: 'bio',
      label: 'Bio',
      isComplete: !!profile.bio,
      priority: 'recommended',
      hint: 'Tell bookers about yourself',
    },
    {
      key: 'instagram',
      label: 'Instagram',
      isComplete: socialPlatforms.includes('instagram'),
      priority: 'recommended',
      hint: 'Most bookers check Instagram',
    },
    {
      key: 'youtube',
      label: 'YouTube or TikTok',
      isComplete: socialPlatforms.includes('youtube') || socialPlatforms.includes('tiktok'),
      priority: 'recommended',
      hint: 'Showcase your material',
    },
    {
      key: 'venmo',
      label: 'Venmo',
      isComplete: socialPlatforms.includes('venmo'),
      priority: 'optional',
      hint: 'Let audiences tip you',
    },
  ];

  const completedCount = items.filter(i => i.isComplete).length;
  const percentage = Math.round((completedCount / items.length) * 100);

  const getStatusIcon = (item: ProfileItem) => {
    if (item.isComplete) {
      return <Check className="h-4 w-4 text-green-600" />;
    }
    if (item.priority === 'required') {
      return <X className="h-4 w-4 text-destructive" />;
    }
    if (item.priority === 'recommended') {
      return <AlertCircle className="h-4 w-4 text-amber-500" />;
    }
    return <div className="h-4 w-4 rounded-full border-2 border-muted-foreground/30" />;
  };

  const incompleteItems = items.filter(i => !i.isComplete);

  if (percentage === 100) {
    return null; // Hide when complete
  }

  return (
    <Card className="border-0 bg-[#07111f]/2 text-white shadow-[0_18px_60px_rgba(4,20,55,0.18)] backdrop-blur-xl transition-all duration-300 hover:-translate-y-0.5 hover:scale-[1.03] hover:bg-[#07111f]/5">
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center justify-between">
          <span>Profile Completeness</span>
          <span className="text-2xl font-bold text-[hsl(var(--comediq-cream)]">{percentage}%</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Progress value={percentage} className="h-2" />
        
        <div className="space-y-2">
          {incompleteItems.slice(0, 4).map((item) => (
            <div
              key={item.key}
              className="flex items-center gap-2 text-sm cursor-pointer hover:bg-muted/20 p-2 rounded-md -mx-2 transition-colors"
              onClick={onEditClick}
            >
              {getStatusIcon(item)}
              <span className="flex-1">{item.label}</span>
              {item.hint && (
                <span className="text-xs text-white/60 hidden sm:block">
                  {item.hint}
                </span>
              )}
            </div>
          ))}
          {incompleteItems.length > 4 && (
            <p className="text-xs text-white/60 text-center pt-1">
              +{incompleteItems.length - 4} more to complete
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
