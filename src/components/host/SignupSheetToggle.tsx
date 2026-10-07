import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { fetchMicSignupSettings, setMicSignupsEnabled } from '@/api/signups';

/**
 * The on-switch for a mic's signup sheet.
 *
 * Everything below this control already existed and worked: the sheet, the
 * numbered list, join, cancel, the host's run of show. It was unreachable
 * because `slots_enabled` is false on all 406 mics and nothing in the app
 * could set it. This is the missing door, not a new room.
 *
 * It sits at the top of the host panel because creating an event while the
 * sheet is off produces a real event nobody can find.
 */
export function SignupSheetToggle({ micId, micSlug }: { micId: string; micSlug?: string }) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: settings, isLoading } = useQuery({
    queryKey: ['micSignupSettings', micId],
    queryFn: () => fetchMicSignupSettings(micId),
    enabled: !!micId,
  });

  const enabled = settings?.slots_enabled ?? false;

  const mutation = useMutation({
    mutationFn: (next: boolean) =>
      // Off restores what the room actually does, which for a mic that was
      // taking signups elsewhere is not necessarily in person.
      setMicSignupsEnabled(micId, next, settings?.signup_url ? 'online' : 'in_person'),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['micSignupSettings', micId] });
      queryClient.invalidateQueries({ queryKey: ['openMics'] });
      toast({
        title: data.slots_enabled ? 'Signups are on' : 'Signups are off',
        description: data.slots_enabled
          ? 'Comedians can take a spot on this mic from its listing.'
          : 'The sheet is hidden. Anyone already signed up keeps their spot.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Could not change that',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  return (
    <Card className="border border-[#07111f]/10 bg-white/30 text-[#07111f] shadow-[0_18px_60px_rgba(4,20,55,0.12)] backdrop-blur-xl dark:border-white/10 dark:bg-[#07111f]/30 dark:text-white">
      <CardHeader className="border-b border-[#07111f]/10 bg-white/20 dark:border-white/10 dark:bg-[#102a53]/10">
        <CardTitle>Signups on Comediq</CardTitle>
        <CardDescription className="text-[#07111f]/70 dark:text-white/70">
          Take the list here instead of on paper or another site.
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-6">
        <div className="flex items-center justify-between gap-4">
          <div className="min-w-0">
            <p className="font-medium">
              {isLoading ? 'Checking…' : enabled ? 'Signups are on' : 'Signups are off'}
            </p>
            <p className="mt-1 text-sm text-[#07111f]/70 dark:text-white/70">
              {enabled
                ? 'Comedians see the list, their number on it, and how many spots are left.'
                : 'Turn this on and this mic gets a signup sheet on its listing.'}
            </p>
          </div>
          <Switch
            checked={enabled}
            disabled={isLoading || mutation.isPending}
            onCheckedChange={(next) => mutation.mutate(next)}
            aria-label="Take signups for this mic on Comediq"
          />
        </div>

        {enabled && micSlug && (
          <Link
            to={`/mic/${micSlug}/signup`}
            className="mt-4 inline-block text-sm font-semibold text-[#1a5fb4] underline dark:text-[#8ec5ff]"
          >
            Open the sheet comedians see
          </Link>
        )}
      </CardContent>
    </Card>
  );
}

export default SignupSheetToggle;
